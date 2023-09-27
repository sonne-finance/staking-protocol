import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BaseManagerFixtureOutput, baseManagerFixture } from './_fixtures';
import { anyValue, getOpPoolState } from './_utils';

describe.only('Base RewardManager', () => {
    let fixture: BaseManagerFixtureOutput;

    beforeEach(async () => {
        fixture = await baseManagerFixture();
    });

    it('Should deploy RewardManager properly', async () => {
        const { rewardManager } = fixture;

        const rewardManagerAddress = await rewardManager.getAddress();
        expect(rewardManagerAddress).to.properAddress;
    });

    it('Should add vara and wkava rewards', async () => {
        const {
            deployer,
            rewardManager,
            sSonneDistributor,
            uUsdcDistributor,
            sAeroDistributor,
            uAeroDistributor,
            sonne,
            usdc,
            aero,
        } = fixture;

        const { sMerkleRoot, uMerkleRoot, sSupply, uSupply, blockNumber } = await getOpPoolState(
            109937040,
            '0x969f2e54b4aa4654f7c2f75cbbd2d56910a1d371',
        );

        const sonneAddress = await sonne.getAddress();
        const usdcAddress = await usdc.getAddress();
        const aeroAddress = await aero.getAddress();

        const withdrawUnlockTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

        const totalStaked = sSupply + uSupply;

        const usdcBalance = ethers.parseUnits('10000', 6);
        const uUsdc = (usdcBalance * uSupply) / totalStaked;
        const veloBalance = ethers.parseUnits('10000', 18);
        const uVelo = (veloBalance * uSupply) / totalStaked;
        const sVelo = veloBalance - uVelo;

        const rewardManagerAddress = await rewardManager.getAddress();

        await expect(aero.connect(deployer).approve(rewardManagerAddress, ethers.MaxUint256)).not.to.reverted;
        await expect(usdc.connect(deployer).approve(rewardManagerAddress, ethers.MaxUint256)).not.to.reverted;

        const opPoolState = [sMerkleRoot, uMerkleRoot, sSupply, uSupply, blockNumber, withdrawUnlockTime];

        await expect(rewardManager.connect(deployer).addRewards(usdcBalance, veloBalance, opPoolState))
            .to.emit(sSonneDistributor, 'NewMerkle')
            .withArgs(rewardManagerAddress, sonneAddress, anyValue, sMerkleRoot, blockNumber, withdrawUnlockTime)
            .to.emit(uUsdcDistributor, 'NewMerkle')
            .withArgs(rewardManagerAddress, usdcAddress, uUsdc, uMerkleRoot, blockNumber, withdrawUnlockTime)
            .to.emit(sAeroDistributor, 'NewMerkle')
            .withArgs(rewardManagerAddress, aeroAddress, sVelo, sMerkleRoot, blockNumber, withdrawUnlockTime)
            .to.emit(uAeroDistributor, 'NewMerkle')
            .withArgs(rewardManagerAddress, aeroAddress, uVelo, uMerkleRoot, blockNumber, withdrawUnlockTime);

        expect(await usdc.balanceOf(rewardManagerAddress)).to.equal(0);
        expect(await sonne.balanceOf(rewardManagerAddress)).to.equal(0);
        expect(await aero.balanceOf(rewardManagerAddress)).to.equal(0);
    });
});
