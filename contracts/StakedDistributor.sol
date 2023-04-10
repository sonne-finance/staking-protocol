//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

import './libraries/SafeToken.sol';
import './Distributor.sol';

contract StakedDistributor is Distributor, ERC20 {
    using SafeToken for address;
    struct Withdrawal {
        uint256 amount;
        uint256 releaseTime;
    }

    event Withdraw(address indexed user, uint256 amount);

    uint256 public withdrawalPendingTime = 7 * 1 days;
    mapping(address => Withdrawal) public withdrawal;

    address public immutable sonne;

    constructor(
        address sonne_,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        sonne = sonne_;
    }

    function mint(uint256 amount) public {
        sonne.safeTransferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount);
    }

    function burn(uint256 amount) public {
        if (amount > 0) {
            _burn(msg.sender, amount);
        }

        Withdrawal storage withdrawal_ = withdrawal[msg.sender];
        withdrawal_.amount = withdrawal_.amount + amount;
        withdrawal_.releaseTime = block.timestamp + withdrawalPendingTime;
    }

    function withdraw() public {
        Withdrawal storage withdrawal_ = withdrawal[msg.sender];
        require(block.timestamp >= withdrawal_.releaseTime, 'StakedDistributor: not released');
        uint256 amount = withdrawal_.amount;
        withdrawal_.amount = 0;
        sonne.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 /* amount */
    ) internal override {
        if (from != address(0)) {
            _editRecipientInternal(from, balanceOf(from));
        }

        if (to != address(0)) {
            _editRecipientInternal(to, balanceOf(to));
        }
    }

    /* Admin functions */
    function setWithdrawalPendingTime(uint256 withdrawalPendingTime_) public onlyOwner {
        withdrawalPendingTime = withdrawalPendingTime_;
    }
}
