//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import './interfaces/VelodromeInterfaces.sol';
import './libraries/SafeToken.sol';

import './StakedDistributor.sol';

contract RewardManager is OwnableUpgradeable {
    using SafeToken for address;

    StakedDistributor public constant sSonne = StakedDistributor(0xDC05d85069Dc4ABa65954008ff99f2D73FF12618);
    StakedDistributor public constant uSonne = StakedDistributor(0x41279e29586EB20f9a4f65e031Af09fced171166);

    address public constant sonne = 0x1DB2466d9F5e10D7090E7152B68d62703a2245F0;
    address public constant usdc = 0x7F5c764cBc14f9669B88837ca1490cCa17c31607;
    address public constant velo = 0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db;
    address public constant op = 0x4200000000000000000000000000000000000042;

    IRouter public constant router = IRouter(0x9c12939390052919aF3155f41Bf4160Fd3666A6f);

    function initialize() public initializer {
        __Ownable_init();
    }

    function addRewards(uint256 usdcAmount, uint256 veloAmount, uint256 opAmount) public {
        // calculate supplies
        uint256 sSupply = sSonne.totalSupply();
        uint256 uSupply = uSonne.totalSupply();
        uint256 totalSupply = sSupply + uSupply;

        // add velo
        if (veloAmount > 0) {
            pullTokenInternal(velo, veloAmount);
            addTokenRewardInternal(velo, uSupply, totalSupply);
        }

        // add op
        if (opAmount > 0) {
            pullTokenInternal(op, opAmount);
            addTokenRewardInternal(op, uSupply, totalSupply);
        }

        // add usdc
        if (usdcAmount > 0) {
            pullTokenInternal(usdc, usdcAmount);
            addUSDCRewardInternal(uSupply, totalSupply);
        }
    }

    function pullTokenInternal(address token, uint256 amount) internal {
        if (amount == type(uint256).max) {
            amount = token.balanceOf(msg.sender);
        }

        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    function addTokenRewardInternal(address token, uint256 uSupply, uint256 totalSupply) internal {
        uint256 amount = token.balanceOf(address(this));
        if (amount == 0) return;

        uint256 uAmount = (amount * uSupply) / totalSupply;
        uint256 sAmount = amount - uAmount;

        // add to uSonne
        token.safeApprove(address(uSonne), uAmount);
        uSonne.addReward(token, uAmount);

        // add to sSonne
        token.safeApprove(address(sSonne), sAmount);
        sSonne.addReward(token, sAmount);
    }

    function addUSDCRewardInternal(uint256 uSupply, uint256 totalSupply) internal {
        uint256 amount = usdc.balanceOf(address(this));
        if (amount == 0) return;

        uint256 uUSDCAmount = (amount * uSupply) / totalSupply;
        uint256 sUSDCAmount = amount - uUSDCAmount;

        // add to uSonne
        usdc.safeApprove(address(uSonne), uUSDCAmount);
        uSonne.addReward(usdc, uUSDCAmount);

        // swap usdc to sonne
        swapUSDCtoSonneInternal(sUSDCAmount);

        // add to sMare
        uint256 sonneAmount = sonne.balanceOf(address(this));
        sonne.safeApprove(address(sSonne), sonneAmount);
        sSonne.addReward(sonne, sonneAmount);
    }

    function swapUSDCtoSonneInternal(uint256 usdcAmount) internal {
        IRouter.route[] memory path = new IRouter.route[](1);
        path[0] = IRouter.route({from: usdc, to: sonne, stable: false});

        usdc.safeApprove(address(router), usdcAmount);
        router.swapExactTokensForTokens(usdcAmount, 0, path, address(this), block.timestamp);
    }
}
