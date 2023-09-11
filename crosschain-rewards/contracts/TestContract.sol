// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

contract TestContract {
    address public owner;
    //Fake vars to move shares mapping at slot number 2
    uint256 private bar;

    mapping(address => uint256) public shares;

    function mint(address account, uint256 amount) public {
        require(msg.sender == owner, "only owner");
        shares[account] = amount;
    }

    constructor() {
        owner = msg.sender;
    }
}
