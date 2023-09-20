// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.19;

import "forge-std/console.sol";
import {ExtendedTest} from "./ExtendedTest.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SonneMerkleDistributor} from "../../SonneMerkleDistributor.sol";
import {ISonneMerkleDistributor} from "../../interfaces/ISonneMerkleDistributor.sol";

contract Setup is ExtendedTest {
    // Contract instancees that we will use repeatedly.
    ERC20 public asset;
    ISonneMerkleDistributor public box;

    mapping(string => address) public tokenAddrs;

    // Addresses for different roles we will use repeatedly.
    address public owner = address(this);
    address public newOwner = address(1);
    address public alice = address(0x3021338C74f10CEf1ECe6404Ac1498c2559f7a5c);
    address public bob = address(0x58C4f03a954e4CbB1b8E204a881a8e9A99d015Dd);
    address public charlie = address(0xdAD29981B5FeeFEeaf3eF92E678e53c5620A1Fd8);   
    address public other = address(0x1234);

    // Address of the real deployed staking contractss
    address public uSonne = 0x41279e29586EB20f9a4f65e031Af09fced171166;
    address public sSonne = 0xDC05d85069Dc4ABa65954008ff99f2D73FF12618;

    // Integer variables that will be used repeatedly.
    uint256 public decimals;
    uint256 public MAX_BPS = 10_000;

    // Fuzz from $0.01 of 1e6 stable coins up to 1 trillion of a 1e18 coin
    uint256 public maxFuzzAmount = 1e30;
    uint256 public minFuzzAmount = 10_000;

    function setUp() public virtual {
        _setTokenAddrs();

        // Set asset
        asset = ERC20(tokenAddrs["SONNE"]);

        // Deploy contract
        box = ISonneMerkleDistributor(setUpContract());

        // Allow box to spend asset
        vm.prank(owner);
        box.rewardToken().approve(address(box), type(uint256).max);
        deal(address(asset), owner, type(uint256).max);

        vm.label(address(asset), "asset");
        vm.label(address(alice), "USER {Alice]");
        vm.label(address(bob), "USER {Bob]");
        vm.label(address(charlie), "USER {Charlie]");
    }


    function setUpContract() public returns (address) {
        // Deploy box contract
        ISonneMerkleDistributor _merkleDistributor = ISonneMerkleDistributor(new SonneMerkleDistributor(
            asset
        ));
        return address(_merkleDistributor);
    }

    function _setTokenAddrs() internal {
        tokenAddrs["SONNE"] = 0x1DB2466d9F5e10D7090E7152B68d62703a2245F0;
        tokenAddrs["USDC"] = 0x7F5c764cBc14f9669B88837ca1490cCa17c31607;
    }

}