// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/console.sol";
import {Setup} from "./utils/Setup.sol";

contract OperationTest is Setup {
    
    bytes32 fakeMerkleRoot = 0x1234567890123456789012345678901234567890123456789012345678901234;

    function setUp() public override {
        super.setUp();
    }

    function testSetupDeploymentOK() public {
        assertTrue(address(0) != address(box));
    }

    function testOnlyOwnerCanAddReward() public {
        // Call as other address
        deal(address(asset), other, 100);
        vm.prank(other);
        box.rewardToken().approve(address(box), 100); 
        vm.prank(other);
        vm.expectRevert("Ownable: caller is not the owner");
        box.addReward(100, fakeMerkleRoot, 1, block.timestamp + 1 days, 1);
 
        // Call as owner
        vm.prank(owner);
        box.addReward(100, fakeMerkleRoot, 1, block.timestamp + 1 days, 1); 
    }

    function testWithdrawFundsBeforeTimelock() public {
        uint256 blockNumber = 1;
        vm.prank(owner);
        box.addReward(100, fakeMerkleRoot, blockNumber, block.timestamp + 1 days, 1000);

        // Withdraw should fail before unlock time
        vm.expectRevert("Rewards may not be withdrawn");
        box.withdrawFunds(blockNumber, 100);

        // Fast forward time but not enough
        vm.warp(block.timestamp + 12 hours);

        // Should still fail
        vm.expectRevert("Rewards may not be withdrawn");
        box.withdrawFunds(blockNumber, 100);

        // Now fast forward past timelock
        vm.warp(block.timestamp + 2 days);

        // Withdraw should now succeed
        box.withdrawFunds(blockNumber, 100);
    }

    function testSetDelegator() public {
        vm.prank(owner);
        box.setDelegator(alice, bob);
        assertEq(box.delegatorAddresses(bob), alice);
    }

    function testSetDelegatorNotOwnerReverts() public {
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        box.setDelegator(alice, bob);
    }

}