import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ManagerFixtureOutput, managerFixture } from './_fixtures';
import { anyValue } from './_utils';

describe('RewardManager', () => {
    let fixture: ManagerFixtureOutput;

    beforeEach(async () => {
        fixture = await managerFixture();
    });

    it('Should deploy RewardManager properly', async () => {
        const { rewardManager } = fixture;

        const rewardManagerAddress = await rewardManager.getAddress();
        expect(rewardManagerAddress).to.properAddress;
    });

    it('Should add vara and wkava rewards', async () => {
        const { owner, rewardManager, sSonne, uSonne, sonne, usdc, velo } = fixture;

        const sSupply = await sSonne.totalSupply();
        const uSupply = await uSonne.totalSupply();
        const totalStaked = sSupply + uSupply;

        const usdcBalance = await usdc.balanceOf(owner.address);
        const uUsdc = (usdcBalance * uSupply) / totalStaked;
        const veloBalance = await velo.balanceOf(owner.address);
        const uVELO = (veloBalance * uSupply) / totalStaked;
        const sVELO = veloBalance - uVELO;

        const rewardManagerAddress = await rewardManager.getAddress();

        await expect(velo.connect(owner).approve(rewardManagerAddress, ethers.MaxUint256)).not.to.reverted;
        await expect(usdc.connect(owner).approve(rewardManagerAddress, ethers.MaxUint256)).not.to.reverted;

        const veloAddress = await velo.getAddress();
        const usdcAddress = await usdc.getAddress();

        await expect(rewardManager.connect(owner).addRewards(ethers.MaxUint256, ethers.MaxUint256, ethers.MaxUint256))
            .to.emit(sSonne, 'AddReward')
            .withArgs(veloAddress, sVELO, anyValue)
            .to.emit(uSonne, 'AddReward')
            .withArgs(veloAddress, uVELO, anyValue)
            .to.emit(uSonne, 'AddReward')
            .withArgs(usdcAddress, uUsdc, anyValue);

        expect(await velo.balanceOf(rewardManagerAddress)).to.equal(0);
        expect(await usdc.balanceOf(rewardManagerAddress)).to.equal(0);
        expect(await sonne.balanceOf(rewardManagerAddress)).to.equal(0);
    });
});
