//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

import './interfaces/AerodromeInterfaces.sol';
import './interfaces/SonneMerkleDistributorInterfaces.sol';
import './libraries/SafeToken.sol';

struct OpPoolState {
    bytes32 sMerkleRoot;
    bytes32 uMerkleRoot;
    uint256 sSupply;
    uint256 uSupply;
    uint256 blockNumber;
    uint256 withdrawUnlockTime;
}

contract BaseRewardManager is AccessControlUpgradeable {
    using SafeToken for address;

    bytes32 public constant MANAGER_ROLE = keccak256('MANAGER_ROLE');

    ISonneMerkleDistributor public constant sSonneDistributor =
        ISonneMerkleDistributor(0x071B00ef6AD31Fb716955a1d70Ab26D47290120a);
    ISonneMerkleDistributor public constant uUsdcDistributor =
        ISonneMerkleDistributor(0x6cbDABf17c4634fA4F9A0C4A5e73Fd869F9a9be8);
    ISonneMerkleDistributor public constant sAeroDistributor =
        ISonneMerkleDistributor(0xA1918c958963DC7E710F5736A7fbCa7C32Bf501d);
    ISonneMerkleDistributor public constant uAeroDistributor =
        ISonneMerkleDistributor(0xcA31a8173AB19c3fa006D0Adc2883882F189797b);

    address public constant sonne = 0x22a2488fE295047Ba13BD8cCCdBC8361DBD8cf7c;
    address public constant usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public constant usdbc = 0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA;
    address public constant aero = 0x940181a94A35A4569E4529A3CDfB74e38FD98631;

    IRouter public constant router = IRouter(0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43);

    function initialize() public initializer {
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(MANAGER_ROLE, _msgSender());
    }

    function addRewards(
        uint256 usdcAmount,
        uint256 aeroAmount,
        OpPoolState calldata state
    ) public onlyRole(MANAGER_ROLE) {
        uint256 totalSupply = state.sSupply + state.uSupply;

        // add velo
        if (aeroAmount > 0) {
            pullTokenInternal(aero, aeroAmount);
            uint256 amount = aero.balanceOf(address(this));

            uint256 uAmount = (amount * state.uSupply) / totalSupply;
            uint256 sAmount = amount - uAmount;

            // add for uSonne
            aero.safeApprove(address(uAeroDistributor), uAmount);
            uAeroDistributor.addReward(
                uAmount,
                state.uMerkleRoot,
                state.blockNumber,
                state.withdrawUnlockTime,
                state.uSupply
            );

            // add for sSonne
            aero.safeApprove(address(sAeroDistributor), sAmount);
            sAeroDistributor.addReward(
                sAmount,
                state.sMerkleRoot,
                state.blockNumber,
                state.withdrawUnlockTime,
                state.sSupply
            );
        }

        // add usdc
        if (usdcAmount > 0) {
            pullTokenInternal(usdc, usdcAmount);
            uint256 amount = usdc.balanceOf(address(this));

            uint256 uUSDCAmount = (amount * state.uSupply) / totalSupply;
            uint256 sUSDCAmount = amount - uUSDCAmount;

            // add usdc for uSonne
            usdc.safeApprove(address(uUsdcDistributor), uUSDCAmount);
            uUsdcDistributor.addReward(
                uUSDCAmount,
                state.uMerkleRoot,
                state.blockNumber,
                state.withdrawUnlockTime,
                state.uSupply
            );

            // swap usdc to sonne
            swapUSDCtoSonneInternal(sUSDCAmount);

            // add sonne for sSonne
            uint256 sonneAmount = sonne.balanceOf(address(this));
            sonne.safeApprove(address(sSonneDistributor), sonneAmount);
            sSonneDistributor.addReward(
                sonneAmount,
                state.sMerkleRoot,
                state.blockNumber,
                state.withdrawUnlockTime,
                state.sSupply
            );
        }
    }

    function pullTokenInternal(address token, uint256 amount) internal {
        if (amount == type(uint256).max) {
            amount = token.balanceOf(msg.sender);
        }

        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    function swapUSDCtoSonneInternal(uint256 usdcAmount) internal {
        IRouter.Route[] memory path = new IRouter.Route[](2);
        path[0] = IRouter.Route({from: usdc, to: usdbc, stable: true, factory: address(0)});
        path[1] = IRouter.Route({from: usdbc, to: sonne, stable: false, factory: address(0)});

        usdc.safeApprove(address(router), usdcAmount);
        router.swapExactTokensForTokens(usdcAmount, 0, path, address(this), block.timestamp);
    }
}
