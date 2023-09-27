//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

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

    function rewardToken() external view returns (IERC20);

    function Rewards(
        uint256 blockNumber
    ) external view returns (uint256 balance, bytes32 merkleRoot, uint256 withdrawUnlockTime, uint256 ratio);

    function addReward(
        uint256 amount,
        bytes32 merkleRoot,
        uint256 blockNumber,
        uint256 withdrawUnlockTime,
        uint256 totalStakedBalance
    ) external;

    // For testing

    function grantRole(bytes32 role, address account) external;
}
