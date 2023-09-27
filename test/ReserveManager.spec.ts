import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import hre, { ethers } from 'hardhat';
import fetch from 'node-fetch';
import { managerFixture } from './_fixtures';

describe('ReserveManager', () => {
    let deployer: SignerWithAddress;
    let rewardManager: Contract;
    let reserveManager: Contract;

    let comptroller: Contract;

    beforeEach(async () => {
        const fixture = await managerFixture();
        deployer = fixture.owner;
        rewardManager = fixture.rewardManager;
        reserveManager = fixture.reserveManager;
        comptroller = fixture.comptroller;
    });

    it('Should deploy RewardManager properly', async () => {
        const rewardManagerAddress = await rewardManager.getAddress();
        const reserveManagerAddress = await reserveManager.getAddress();

        expect(rewardManagerAddress).to.properAddress;
        expect(reserveManagerAddress).to.properAddress;
    });

    it('Should distribute reserves', async () => {
        const reserveManagerAddress = await reserveManager.getAddress();
        const usdcAddress = await reserveManager.usdc();

        const marketAddresses: string[] = await comptroller.getAllMarkets();
        const markets = await Promise.all(marketAddresses.map((addr) => ethers.getContractAt('IMarket', addr)));
        const marketInfo = await Promise.all(
            markets.map(async (m) => {
                const marketAddress = await m.getAddress();
                const underlyingAddress = await m.underlying();
                console.log('market', marketAddress);
                console.log('underlying', underlyingAddress);

                const underlying = await ethers.getContractAt('ERC20', underlyingAddress);
                const underlyingDecimals = await underlying.decimals();
                const reserve = await m.totalReserves();
                const cash = await m.getCash();
                const amount = reserve > cash ? cash : reserve;
                const data = (
                    await fetchSwapDataV3(underlyingAddress, underlyingDecimals, amount, reserveManagerAddress)
                ).data;

                return {
                    market: m,
                    marketAddress,
                    underlying,
                    underlyingAddress,
                    underlyingDecimals,
                    reserve,
                    cash,
                    amount,
                    data,
                };
            }),
        );
        const usdcMarketInfo = marketInfo.find((m) => m.underlyingAddress.toLowerCase() === usdcAddress.toLowerCase());
        const otherMarketInfo = marketInfo.filter((m) => m != usdcMarketInfo);

        await expect(
            reserveManager.distributeReserves(
                usdcMarketInfo?.marketAddress,
                usdcMarketInfo?.amount,
                otherMarketInfo.map((om) => om.marketAddress),
                otherMarketInfo.map((om) => om.amount),
                otherMarketInfo.map((om) => om.data.data),
            ),
        ).to.not.reverted;
    });

    it('Should distribute vara', async () => {
        await expect(reserveManager.distributeVelo()).not.reverted;
    });
});

const fetchSwapDataV3 = async (underlying: string, underlyingDecimals: number, amount: bigint, account: string) => {
    const url = 'https://open-api.openocean.finance/v3/optimism/swap_quote';
    const queryParams = new URLSearchParams();
    queryParams.append('chain', 'optimism');
    queryParams.append('inTokenAddress', underlying);
    queryParams.append('outTokenAddress', '0x7f5c764cbc14f9669b88837ca1490cca17c31607');
    queryParams.append('amount', ethers.formatUnits(amount, underlyingDecimals));
    queryParams.append('gasPrice', '1');
    queryParams.append('slippage', '1');
    queryParams.append('account', account);

    const response = await fetch(`${url}?${queryParams}`, {
        method: 'GET',
    });
    const data = await response.json();
    console.log(`${url}?${queryParams}`, data.code);
    return data;
};
