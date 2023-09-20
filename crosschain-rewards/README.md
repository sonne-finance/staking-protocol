This is a suite of contracts and scrips allowing Sonne Finance to distribute rewards on BASE to `uSonne` and `sSonne` stakers on Optimism.

# 🗄️ Main contracts
- [`SonneMerkleDistributor.sol`](https://github.com/0xjaki/Sonne-Cross-Chain-Reward-Distribution/blob/main/contracts/SonneMerkleDistributor.sol) Contract to be deployed on BASE to distribute rewards
- [`Delegator.sol`](https://github.com/0xjaki/Sonne-Cross-Chain-Reward-Distribution/blob/main/contracts/Delegator.sol) Contract to be deployed on Optimism to allow user to delegate their claim
- [`getAccountRoot.ts`](https://github.com/0xjaki/Sonne-Cross-Chain-Reward-Distribution/blob/main/scripts/getAccountRoot.ts) Script to generate snapshot, including `accountRoot`
- [`getProofForUser.ts`](https://github.com/0xjaki/Sonne-Cross-Chain-Reward-Distribution/blob/main/scripts/getProofForUser.ts) Script to generate merkle proof for a given user

# ▶️ Sonne Merkle Distributor
SonneMerkleDistributor is a smart contract that allows the distribution of ERC20 rewards tokens to addresses based on a Merkle tree of staking balances.

## Features

- Deposit reward tokens and associate with a Merkle root
- Users can claim rewards by providing Merkle proofs
- Support for delegated reward claims
- Withdrawal of unclaimed rewards by the owner (after a specified period)
- Check claim status for addresses

## Usage
### Adding Rewards
The contract owner can add new rewards distributions using the `addReward` function:

```solidity
function addReward(
  uint256 amount,
  bytes32 merkleRoot,
  uint256 blockNumber, 
  uint256 withdrawUnlockTime,
  uint256 totalStakedBalance
) external onlyOwner;
``` 

This deposits the reward tokens into the contract and associates them with a Merkle root.
- `amount` - Total reward tokens to distribute
- `merkleRoot` - Root of the Merkle tree containing staking balances
- `blockNumber` - Block number on Optimism where balances were fetched
- `withdrawUnlockTime` - Timestamp after which the owner can withdraw remaining rewards
- `totalStakedBalance` - Total staked balance across all accounts

### Claiming Rewards
Users can claim their rewards by calling the claim function:

```solidity
function claim(
  uint256 blockNumber,
  bytes[] calldata proof, 
) external;
``` 

This verifies the Merkle proof and transfers the reward tokens to the user's address.
- `blockNumber` - Reward distribution to claim from
- `proof` - Merkle proof of the user's staking balance

### Withdrawing Remaining Rewards
The owner can withdraw unclaimed rewards after the `withdrawUnlockTime` by calling:

```solidity
function withdrawFunds(
  uint256 blockNumber,
  uint256 amount
) external onlyOwner;
``` 

- blockNumber - Reward distribution to withdraw from
- amount - Amount of remaining rewards to withdraw

### Delegated Claims
The contract owner can set a delegated address for users with `setDelegator`:

```solidity
function setDelegator(
  address recipient,
  address delegator  
) external onlyOwner;
``` 

This allows the delegator to claim rewards on behalf of the recipient.

### Checking Claim Status
To verify if an account can claim rewards from a distribution:

```solidity
function isClaimable(
  uint256 blockNumber,
  address account,
  bytes[] calldata proof  
) external view returns (bool);
``` 
Returns true if the account can claim rewards from the distribution based on the Merkle proof.

### Security
The contract uses OpenZeppelin's `ReentrancyGuard` to prevent reentrancy attacks. All external functions that alter state use the `nonReentrant` modifier.
