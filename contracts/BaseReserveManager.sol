//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

import './interfaces/LendingInterfaces.sol';
import './interfaces/AerodromeInterfaces.sol';
import './libraries/SafeToken.sol';

import './BaseRewardManager.sol';

contract BaseReserveManager is AccessControlUpgradeable {
    using SafeToken for address;

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256('DISTRIBUTOR_ROLE');

    /* Tokens */

    address public constant usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public constant aero = 0x940181a94A35A4569E4529A3CDfB74e38FD98631;

    /* OpenOcean */
    address public constant OORouter = 0x6352a56caadC4F1E25CD6c75970Fa768A3304e64;

    /* Aerodrome */
    address public constant voter = 0x16613524e02ad97eDfeF371bC883F2F5d6C480A5;

    /* Distribution */
    address public constant rewardManager = 0xC5ba10B609E8500c04884e1bcfc935B2c22654cd;
    address public constant sonneTimelock = 0x5b22BD2fC485afe2DEAf1Ac9e2fAd316dDE163B0;

    function initialize() public initializer {
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /* Guarded Distribution Functions */
    function distributeReserves(
        IMarket usdcMarket,
        uint56 usdcAmount,
        IMarket[] calldata markets,
        uint256[] calldata amounts,
        bytes[] calldata swapQuoteData,
        OpPoolState calldata state
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        require(
            markets.length == amounts.length && markets.length == swapQuoteData.length,
            'ReserveManager: INVALID_INPUT'
        );

        reduceReserveInternal(usdcMarket, usdcAmount);

        for (uint256 i = 0; i < markets.length; i++) {
            reduceReserveInternal(markets[i], amounts[i]);
            address underlying = markets[i].underlying();
            swapToBaseInternal(underlying, amounts[i], swapQuoteData[i]);
        }

        uint256 distAmount = usdc.myBalance();

        usdc.safeApprove(rewardManager, distAmount);
        BaseRewardManager(rewardManager).addRewards(distAmount, 0, state);
    }

    function distributeAero(address pair, OpPoolState calldata state) external onlyRole(DISTRIBUTOR_ROLE) {
        claimAeroInternal(pair);

        uint256 distAmount = aero.myBalance();

        aero.safeApprove(rewardManager, distAmount);
        BaseRewardManager(rewardManager).addRewards(0, distAmount, state);
    }

    /* Guarded Aerodrome Management Function */
    function _stakeLP(address pair, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (amount == type(uint256).max) {
            amount = pair.balanceOf(msg.sender);
        }

        pair.safeTransferFrom(msg.sender, address(this), amount);

        stakeLPInternal(pair);
    }

    function _unstakeLP(address pair, address to) public onlyRole(DEFAULT_ADMIN_ROLE) {
        unstakeLPInternal(pair);

        uint256 amount = pair.myBalance();
        pair.safeTransfer(to, amount);
    }

    /* Internal Market Management Functions */
    function reduceReserveInternal(IMarket market, uint256 amount) internal {
        market.accrueInterest();

        require(market.getCash() >= amount, 'ReserveManager: NOT_ENOUGH_CASH');
        require(market.totalReserves() >= amount, 'ReserveManager: NOT_ENOUGH_RESERVE');

        ISonneTimelock(sonneTimelock)._reduceReserves(address(market), amount, address(this));
    }

    function swapToBaseInternal(address underlying, uint256 amount, bytes memory swapQuoteDatum) internal {
        underlying.safeApprove(OORouter, amount);

        (bool success, bytes memory result) = OORouter.call{value: 0}(swapQuoteDatum);
        require(success, 'ReserveManager: OO_API_SWAP_FAILED');
    }

    /* Internal Aerodrome Management Functions */
    function stakeLPInternal(address pair) internal {
        address gauge = IVoter(voter).gauges(pair);

        uint256 amountPair = pair.myBalance();
        pair.safeApprove(gauge, amountPair);
        IGauge(gauge).deposit(amountPair, 0);
    }

    function unstakeLPInternal(address pair) internal {
        address gauge = IVoter(voter).gauges(pair);
        IGauge(gauge).withdrawAll();
    }

    function claimAeroInternal(address pair) internal {
        address[] memory tokens = new address[](1);
        tokens[0] = aero;

        address gauge = IVoter(voter).gauges(pair);
        IGauge(gauge).getReward(address(this), tokens);
    }
}
