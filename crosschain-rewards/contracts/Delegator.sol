// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

contract Delegate {

  mapping(address => address) public delegates;

  event DelegateChanged(address indexed addr, address newDelegate);

  function setDelegate(address delegate) public {
    delegates[msg.sender] = delegate;
    emit DelegateChanged(msg.sender, delegate);
  }

  function getDelegate(address addr) public view returns (address) {
    return delegates[addr];
  }
}