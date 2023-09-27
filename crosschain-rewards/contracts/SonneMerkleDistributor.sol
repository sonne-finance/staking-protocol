// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import {SecureMerkleTrie} from '@eth-optimism/contracts-bedrock/contracts/libraries/trie/SecureMerkleTrie.sol';
import {RLPReader} from '@eth-optimism/contracts-bedrock/contracts/libraries/rlp/RLPReader.sol';
import {ISonneMerkleDistributor} from './interfaces/ISonneMerkleDistributor.sol';

/// @title Sonne Finance Merkle tree-based rewards distributor
/// @notice Contract to distribute rewards on BASE network to Sonne Finance Optimism stakers
contract SonneMerkleDistributor is
    Initializable,
    ReentrancyGuardUpgradeable,
    AccessControlUpgradeable,
    ISonneMerkleDistributor
{
    using SafeERC20 for IERC20;

    bytes32 public constant MANAGER_ROLE = keccak256('MANAGER_ROLE');
    bytes32 public constant FUNDS_ROLE = keccak256('FUNDS_ROLE');

    struct Reward {
        uint256 balance; // amount of reward tokens held in this reward
        bytes32 merkleRoot; // root of claims merkle tree
        uint256 withdrawUnlockTime; // time after which owner can withdraw remaining rewards
        uint256 ratio; // ratio of rewards to be distributed per one staked token on OP
        mapping(bytes32 => bool) leafClaimed; // mapping of leafes that already claimed
    }

    IERC20 public rewardToken;
    uint256[] public rewards; // a list of all rewards

    mapping(uint256 => Reward) public Rewards; // mapping between blockNumber => Reward
    mapping(address => address) public delegatorAddresses;

    /// mapping to allow msg.sender to claim on behalf of a delegators address

    /// @notice Contract constructor to initialize rewardToken
    /// @param _rewardToken The reward token to be distributed
    function initialize(IERC20 _rewardToken) external initializer {
        __ReentrancyGuard_init();
        __AccessControl_init();

        require(address(_rewardToken) != address(0), 'Token cannot be zero');
        rewardToken = _rewardToken;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        _grantRole(FUNDS_ROLE, msg.sender);
    }

    /// @notice Sets a delegator address for a given recipient
    /// @param _recipient original eligible recipient address
    /// @param _delegator The address that sould claim on behalf of the owner
    function setDelegator(address _recipient, address _delegator) external onlyRole(MANAGER_ROLE) {
        require(_recipient != address(0) && _delegator != address(0), 'Invalid address provided');
        delegatorAddresses[_delegator] = _recipient;
    }

    /// @notice Creates a new Reward struct for a rewards distribution
    /// @param amount The amount of reward tokens to deposit
    /// @param merkleRoot The merkle root of the distribution tree
    /// @param blockNumber The block number for the Reward
    /// @param withdrawUnlockTime The timestamp after which withdrawals by owner are allowed
    /// @param totalStakedBalance Total staked balance of the merkleRoot (computed off-chain)
    function addReward(
        uint256 amount,
        bytes32 merkleRoot,
        uint256 blockNumber,
        uint256 withdrawUnlockTime,
        uint256 totalStakedBalance
    ) external onlyRole(MANAGER_ROLE) {
        require(merkleRoot != bytes32(0), 'Merkle root cannot be zero');

        // creates a new reward struct tied to the blocknumber the merkleProof was created at
        Reward storage reward = Rewards[blockNumber];

        require(reward.merkleRoot == bytes32(0), 'Merkle root was already posted');
        uint256 balance = rewardToken.balanceOf(msg.sender);
        require(amount > 0 && amount <= balance, 'Invalid amount or insufficient balance');

        // transfer rewardToken from the distributor to the contract
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);

        // record Reward in stable storage
        reward.balance = amount;
        reward.merkleRoot = merkleRoot;
        reward.withdrawUnlockTime = withdrawUnlockTime;
        reward.ratio = (amount * 1e36) / (totalStakedBalance);
        rewards.push(blockNumber);
        emit NewMerkle(msg.sender, address(rewardToken), amount, merkleRoot, blockNumber, withdrawUnlockTime);
    }

    /// @notice Allows to withdraw available funds to owner after unlock time
    /// @param blockNumber The block number for the Reward
    /// @param amount The amount to withdraw
    function withdrawFunds(uint256 blockNumber, uint256 amount) external onlyRole(FUNDS_ROLE) {
        Reward storage reward = Rewards[blockNumber];
        require(block.timestamp >= reward.withdrawUnlockTime, 'Rewards may not be withdrawn');
        require(amount <= reward.balance, 'Insufficient balance');

        // update Rewards record
        reward.balance = reward.balance -= amount;

        // transfer rewardToken back to owner
        rewardToken.safeTransfer(msg.sender, amount);
        emit MerkleFundUpdate(msg.sender, reward.merkleRoot, blockNumber, amount, true);
    }

    /// @notice Claims the specified amount for an account if valid
    /// @dev Checks proofs and claims tracking before transferring rewardTokens
    /// @param blockNumber The block number for the Reward
    /// @param proof The merkle proof for the claim
    function claim(uint256 blockNumber, bytes[] calldata proof) external nonReentrant {
        Reward storage reward = Rewards[blockNumber];
        require(reward.merkleRoot != bytes32(0), 'Reward not found');

        // Check if the delegatorAddresses includes the account
        // The delegatorAddresses mapping allows for an account to delegate its claim ability to another address
        // This can be useful in scenarios where the target recipient might not have the ability to directly interact
        // with the BASE network contract (e.g. a smart contract with a different address)
        address recipient = delegatorAddresses[msg.sender] != address(0) ? delegatorAddresses[msg.sender] : msg.sender;

        // Assuming slotNr is 2 as per your previous function
        bytes32 key = keccak256(abi.encode(recipient, uint256(2)));

        //Get the amount of the key from the merkel tree
        uint256 amount = _getValueFromMerkleTree(reward.merkleRoot, key, proof);

        // calculate the reward based on the ratio
        uint256 rewardAmount = (amount * reward.ratio) / 1e36; // TODO check if there is a loss of precision possible here

        require(reward.balance >= rewardAmount, 'Claim under-funded by funder.');
        require(Rewards[blockNumber].leafClaimed[key] == false, 'Already claimed');

        // marks the leaf as claimed
        reward.leafClaimed[key] = true;

        // Subtract the rewardAmount, not the amount
        reward.balance = reward.balance - rewardAmount;

        //Send reward tokens to the recipient
        rewardToken.safeTransfer(recipient, rewardAmount);

        emit MerkleClaim(recipient, address(rewardToken), blockNumber, rewardAmount);
    }

    /// @notice Checks if a claim is valid and claimable
    /// @param blockNumber The block number for the Reward
    /// @param account The address of the account claiming
    /// @param proof The merkle proof for the claim
    /// @return A bool indicating if the claim is valid and claimable
    function isClaimable(uint256 blockNumber, address account, bytes[] calldata proof) external view returns (bool) {
        bytes32 merkleRoot = Rewards[blockNumber].merkleRoot;

        // At the staking contract, the balances are stored in a mapping (address => uint256) at storage slot 2
        bytes32 leaf = keccak256(abi.encode(account, uint256(2)));

        if (merkleRoot == 0) return false;
        return !Rewards[blockNumber].leafClaimed[leaf] && _getValueFromMerkleTree(merkleRoot, leaf, proof) > 0;
    }

    /// @dev Uses SecureMerkleTrie Library to extract the value from the Merkle proof provided by the user
    /// @param merkleRoot the merkle root
    /// @param key the key of the leaf => keccak256(address,2)
    /// @return result The converted uint256 value as stored in the slot on OP
    function _getValueFromMerkleTree(
        bytes32 merkleRoot,
        bytes32 key,
        bytes[] calldata proof
    ) internal pure returns (uint256 result) {
        // Uses SecureMerkleTrie Library to extract the value from the Merkle proof provided by the user
        // Reverts if Merkle proof verification fails
        bytes memory data = RLPReader.readBytes(SecureMerkleTrie.get(abi.encodePacked(key), proof, merkleRoot));

        for (uint256 i = 0; i < data.length; i++) {
            result = result * 256 + uint8(data[i]);
        }
    }
}
