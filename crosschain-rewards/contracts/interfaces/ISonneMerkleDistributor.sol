// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface ISonneMerkleDistributor {
    event NewMerkle(
        address indexed creator,
        address indexed rewardToken,
        uint256 amount,
        bytes32 indexed merkleRoot,
        uint256 blockNr,
        uint256 withdrawUnlockTime
    );
    event MerkleFundUpdate(
        address indexed funder,
        bytes32 indexed merkleRoot,
        uint256 blockNr,
        uint256 amount,
        bool withdrawal
    );
    event MerkleClaim(address indexed claimer, address indexed rewardToken, uint256 indexed blockNr, uint256 amount);

    function rewardToken() external view returns (IERC20);

    function Rewards(
        uint256 blockNumber
    ) external view returns (uint256 balance, bytes32 merkleRoot, uint256 withdrawUnlockTime, uint256 ratio);

    function delegatorAddresses(address _delegator) external view returns (address originalRecipient);

    function setDelegator(address _recipient, address _delegator) external;

    function addReward(
        uint256 amount,
        bytes32 merkleRoot,
        uint256 blockNumber,
        uint256 withdrawUnlockTime,
        uint256 totalStakedBalance
    ) external;

    function withdrawFunds(uint256 blockNumber, uint256 amount) external;

    function claim(uint256 blockNumber, bytes[] calldata proof) external;

    function isClaimable(uint256 blockNumber, address account, bytes[] calldata proof) external view returns (bool);
}
