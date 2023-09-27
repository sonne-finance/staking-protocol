//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

interface IRouter {
    struct route {
        address from;
        address to;
        bool stable;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        route[] calldata routes,
        address to,
        uint deadline
    ) external;
}

interface IVoter {
    function gauges(address pair) external view returns (address gauge);
}

interface IGauge {
    function stake() external view returns (address token);

    function balanceOf(address account) external view returns (uint256 amount);

    function deposit(uint256 amount, uint256 tokenId) external;

    function depositAll(uint256 tokenId) external;

    function withdrawAll() external;

    function withdraw(uint256 amount) external;

    function getReward(address account, address[] memory tokens) external;
}
