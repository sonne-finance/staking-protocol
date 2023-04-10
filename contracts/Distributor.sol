//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

import './libraries/SafeToken.sol';

abstract contract Distributor is Ownable {
    using SafeMath for uint256;
    using SafeToken for address;

    struct Recipient {
        uint256 lastShareIndex;
        uint256 credit;
    }
    // token => account => recipient
    mapping(address => mapping(address => Recipient)) public recipients;

    // account => shares
    mapping(address => uint256) public shares;

    // token => shareIndex
    mapping(address => uint256) public shareIndex;

    // token => totalShares
    uint256 public totalShares;

    event AddReward(address indexed token, uint256 amount, uint256 newShareIndex);
    event UpdateCredit(address indexed token, address indexed account, uint256 lastShareIndex, uint256 credit);
    event EditRecipient(address indexed account, uint256 shares, uint256 totalShares);
    event Claim(address indexed token, address indexed account, uint256 amount);

    // Valid reward tokens
    address[] public tokens;
    mapping(address => uint256) public tokenIndexes;

    constructor() {
        tokens.push(address(0));
    }

    function addReward(address token, uint256 amount) public returns (uint256 _shareIndex) {
        require(tokenIndexes[token] > 0, 'Distributor: Invalid token');
        require(amount > 0, 'Distributor: Invalid amount');

        if (totalShares == 0) return shareIndex[token];

        _shareIndex = amount.mul(2**160).div(totalShares).add(shareIndex[token]);
        shareIndex[token] = _shareIndex;

        token.safeTransferFrom(msg.sender, address(this), amount);
        emit AddReward(token, amount, shareIndex[token]);
    }

    function updateCredit(address token, address account) public returns (uint256 credit) {
        require(tokenIndexes[token] > 0, 'Distributor: Invalid token');

        uint256 _shareIndex = shareIndex[token];
        if (_shareIndex == 0) return 0;

        Recipient storage recipient = recipients[token][account];
        uint256 lastShareIndex = recipient.lastShareIndex;
        uint256 lastCredit = recipient.credit;
        uint256 _shares = shares[account];

        credit = lastCredit + _shareIndex.sub(lastShareIndex).mul(_shares) / 2**160;
        recipient.lastShareIndex = _shareIndex;
        recipient.credit = credit;

        emit UpdateCredit(token, account, _shareIndex, credit);
    }

    function claim(address token) external returns (uint256 amount) {
        return claimInternal(token, msg.sender);
    }

    function claimAll() external returns (uint256[] memory amounts) {
        amounts = new uint256[](tokens.length);
        for (uint256 i = 1; i < tokens.length; i++) {
            amounts[i] = claimInternal(tokens[i], msg.sender);
        }
    }

    function getClaimable(address token, address account) external view returns (uint256 amount) {
        uint256 _shareIndex = shareIndex[token];
        if (_shareIndex == 0) return 0;

        Recipient memory recipient = recipients[token][account];
        uint256 lastShareIndex = recipient.lastShareIndex;
        uint256 lastCredit = recipient.credit;
        uint256 _shares = shares[account];

        amount = lastCredit + _shareIndex.sub(lastShareIndex).mul(_shares) / 2**160;
    }

    function claimInternal(address token, address account) internal returns (uint256 amount) {
        require(tokenIndexes[token] > 0, 'Distributor: Invalid token');

        amount = updateCredit(token, account);
        if (amount > 0) {
            recipients[token][account].credit = 0;

            IERC20(token).transfer(account, amount);
            //token.safeTransfer(account, amount);

            emit Claim(token, account, amount);
        }
    }

    function _editRecipientInternal(address account, uint256 shares_) internal {
        for (uint256 i = 1; i < tokens.length; i++) {
            updateCredit(tokens[i], account);
        }

        //updateCredit(token, account);
        uint256 prevShares = shares[account];
        uint256 _totalShares = shares_ > prevShares
            ? totalShares.add(shares_ - prevShares)
            : totalShares.sub(prevShares - shares_);
        totalShares = _totalShares;
        shares[account] = shares_;
        emit EditRecipient(account, shares_, _totalShares);
    }

    /* Admin functions */
    function addToken(address token) external onlyOwner {
        require(tokenIndexes[token] == 0, 'Distributor: token already added');
        tokens.push(token);
        tokenIndexes[token] = tokens.length - 1;
    }

    function removeToken(address token) external onlyOwner {
        uint256 index = tokenIndexes[token];
        require(index > 0, 'Distributor: token not found');
        uint256 lastIndex = tokens.length - 1;
        if (index < lastIndex) {
            address lastToken = tokens[lastIndex];
            tokens[index] = lastToken;
            tokenIndexes[lastToken] = index;
        }
        tokens.pop();
        delete tokenIndexes[token];
    }
}
