import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { sumArray } from './_utils';

const mantissa = ethers.BigNumber.from(10).pow(18);
// 0 => staker0, 1 => staker1 [rows => stages] rewardAmount[stage][staker]
const stakeAmounts = [
    [ethers.utils.parseUnits('5', 18), ethers.utils.parseUnits('3', 18)], // first stake
    [ethers.utils.parseUnits('1', 18), ethers.utils.parseUnits('2', 18)], // second stake
];
const totalStakeAmountsByStage = stakeAmounts.map((stage) =>
    stage.reduce((a, b) => a.add(b), ethers.BigNumber.from(0)),
);
const totalStakeAmountsByStaker = sumArray(stakeAmounts);
const totalStakeAmounts = totalStakeAmountsByStaker.reduce((a, b) => a.add(b), ethers.BigNumber.from(0));
// 0 => reward0, 1 => reward0 [rows => states] rewardAmount[stage][pool]
const rewardAmounts = [
    [ethers.utils.parseUnits('53', 18), ethers.utils.parseUnits('33', 18)], // first reward
    [ethers.utils.parseUnits('23', 18), ethers.utils.parseUnits('13', 18)], // second reward
];
const totalRewardAmountsByStage = rewardAmounts.map((stage) =>
    stage.reduce((a, b) => a.add(b), ethers.BigNumber.from(0)),
);
const totalRewardAmountsByPool = sumArray(rewardAmounts);
const totalRewardAmounts = totalRewardAmountsByPool.reduce((a, b) => a.add(b), ethers.BigNumber.from(0));

async function deployTokensFixture() {
    // Accounts
    const [admin, rewardHolder, staker0, staker1] = await ethers.getSigners();

    // Sonne
    const Sonne = await ethers.getContractFactory('MockERC20Token');
    const sonne = await Sonne.connect(admin).deploy(ethers.utils.parseUnits('10000', 18), 18);

    // Send some Sonne to the staker0 and staker1
    await (await sonne.connect(admin).transfer(staker0.address, ethers.utils.parseUnits('10', 18))).wait(1);
    await (await sonne.connect(admin).transfer(staker1.address, ethers.utils.parseUnits('10', 18))).wait(1);

    // reward0
    const MockERC20Token = await ethers.getContractFactory('MockERC20Token');
    const reward0 = await MockERC20Token.connect(rewardHolder).deploy(ethers.utils.parseUnits('10000', 18), 18);
    const reward1 = await MockERC20Token.connect(rewardHolder).deploy(ethers.utils.parseUnits('10000', 18), 18);

    // StakedDistributor
    const StakedDistributor = await ethers.getContractFactory('StakedDistributor');
    const stakedDistributor = await StakedDistributor.connect(admin).deploy(sonne.address, 'SS', 'ss');

    // Add reward tokens to staked distributor as valid tokens
    await (await stakedDistributor.connect(admin).addToken(reward0.address)).wait(1);
    await (await stakedDistributor.connect(admin).addToken(reward1.address)).wait(1);

    // Add Initial Stakers: 1
    await (await sonne.connect(staker0).approve(stakedDistributor.address, totalStakeAmountsByStaker[0])).wait(1);
    await (await stakedDistributor.connect(staker0).mint(stakeAmounts[0][0])).wait(1);

    // Add Initial Stakers: 2
    await (await sonne.connect(staker1).approve(stakedDistributor.address, totalStakeAmountsByStaker[1])).wait(1);
    await (await stakedDistributor.connect(staker1).mint(stakeAmounts[0][1])).wait(1);

    // Add Initial Rewards
    await (await reward0.connect(rewardHolder).approve(stakedDistributor.address, totalRewardAmountsByPool[0])).wait(1);
    await (await stakedDistributor.connect(rewardHolder).addReward(reward0.address, rewardAmounts[0][0])).wait(1);
    await (await reward1.connect(rewardHolder).approve(stakedDistributor.address, totalRewardAmountsByPool[1])).wait(1);
    await (await stakedDistributor.connect(rewardHolder).addReward(reward1.address, rewardAmounts[0][1])).wait(1);

    return {
        admin,
        rewardHolder,
        staker0,
        staker1,
        sonne,
        reward0,
        reward1,
        stakedDistributor,
    };
}

describe('Staked Distributor Admin', function () {
    it('Should be able to add a new reward token', async function () {
        const { admin, stakedDistributor, reward0 } = await loadFixture(deployTokensFixture);

        // Add an already reward token
        await expect(stakedDistributor.connect(admin).addToken(reward0.address)).to.be.revertedWith(
            'Distributor: token already added',
        );

        // Add a new reward token
        const MockERC20Token = await ethers.getContractFactory('MockERC20Token');
        const reward2 = await MockERC20Token.connect(admin).deploy(ethers.utils.parseUnits('10000', 18), 18);
        await expect(stakedDistributor.connect(admin).addToken(reward2.address)).to.not.be.reverted;
    });

    it('Should be able to remove a reward token', async function () {
        const { admin, stakedDistributor, reward0 } = await loadFixture(deployTokensFixture);

        // Remove an invalid reward token
        await expect(stakedDistributor.connect(admin).removeToken(ethers.constants.AddressZero)).to.be.revertedWith(
            'Distributor: token not found',
        );

        // Remove a reward token
        await expect(stakedDistributor.connect(admin).removeToken(reward0.address)).to.not.reverted;
    });

    it('Should set withdrawal pending time correctly', async function () {
        const { admin, stakedDistributor } = await loadFixture(deployTokensFixture);

        // Set withdrawal pending time
        await expect(stakedDistributor.connect(admin).setWithdrawalPendingTime(86400)).to.not.be.reverted;
    });
});

describe('Staked Distributor', function () {
    it('Should deploy staked distributor', async function () {
        const { stakedDistributor } = await loadFixture(deployTokensFixture);

        expect(stakedDistributor.address).to.be.properAddress;
    });

    it('Should revert or return on invalid reward additions', async function () {
        const { admin, stakedDistributor, reward0 } = await loadFixture(deployTokensFixture);

        // Add an invalid reward token
        await expect(stakedDistributor.connect(admin).addReward(ethers.constants.AddressZero, 100)).to.be.revertedWith(
            'Distributor: Invalid token',
        );

        // Add zero reward
        await expect(stakedDistributor.connect(admin).addReward(reward0.address, 0)).to.be.revertedWith(
            'Distributor: Invalid amount',
        );
    });

    it('Should mint staked tokens', async function () {
        const { stakedDistributor, staker0, staker1 } = await loadFixture(deployTokensFixture);

        // Check initial stakes
        expect(await stakedDistributor.balanceOf(staker0.address)).to.be.equal(stakeAmounts[0][0]);
        expect(await stakedDistributor.balanceOf(staker1.address)).to.be.equal(stakeAmounts[0][1]);

        // Add Second Stakes: Staker0
        await (await stakedDistributor.connect(staker0).mint(stakeAmounts[1][0])).wait(1);
        expect(await stakedDistributor.balanceOf(staker0.address)).to.be.equal(totalStakeAmountsByStaker[0]);

        // Add Second Stakes: Staker1
        await (await stakedDistributor.connect(staker1).mint(stakeAmounts[1][1])).wait(1);
        expect(await stakedDistributor.balanceOf(staker1.address)).to.be.equal(totalStakeAmountsByStaker[1]);
    });

    it('Should withdraw burned tokens', async function () {
        const { stakedDistributor, sonne, staker0, staker1 } = await loadFixture(deployTokensFixture);

        // Burn staked tokens and withdraw Sonne: Staker0 in Stage 0
        const staker0Sonne = await sonne.balanceOf(staker0.address);
        const toBurn0 = stakeAmounts[0][0];
        await (await stakedDistributor.connect(staker0).burn(toBurn0)).wait(1);
        const withdrawal = await stakedDistributor.connect(staker0).withdrawal(staker0.address);
        expect(withdrawal.amount).to.be.equal(toBurn0);

        // Withdraw should revert before 7 days
        await expect(stakedDistributor.connect(staker0).withdraw()).to.be.revertedWith(
            'StakedDistributor: not released',
        );

        // Go to 7 days later
        await ethers.provider.send('evm_increaseTime', [7 * 24 * 60 * 60]);
        await ethers.provider.send('evm_mine', []);
        await (await stakedDistributor.connect(staker0).withdraw()).wait(1);
        expect(await sonne.balanceOf(staker0.address)).to.be.equal(staker0Sonne.add(toBurn0));

        // Add Second Stakes: Staker1
        await (await stakedDistributor.connect(staker1).mint(stakeAmounts[1][0])).wait(1);

        // Burn staked tokens and withdraw Sonne: Staker1
        const staker1Sonne = await sonne.balanceOf(staker1.address);
        const totalStakedStaker1 = await stakedDistributor.balanceOf(staker1.address);
        const toBurn1 = totalStakedStaker1.div(2);
        await (await stakedDistributor.connect(staker1).burn(toBurn1)).wait(1);
        const withdrawal1 = await stakedDistributor.connect(staker1).withdrawal(staker1.address);
        expect(withdrawal1.amount).to.be.equal(toBurn1);

        // Withdraw should revert before 7 days
        await expect(stakedDistributor.connect(staker1).withdraw()).to.be.revertedWith(
            'StakedDistributor: not released',
        );

        // Go to 7 days later
        await ethers.provider.send('evm_increaseTime', [7 * 24 * 60 * 60]);
        await ethers.provider.send('evm_mine', []);
        await (await stakedDistributor.connect(staker1).withdraw()).wait(1);
        expect(await stakedDistributor.balanceOf(staker1.address)).to.be.equal(totalStakedStaker1.sub(toBurn1));
        expect(await sonne.balanceOf(staker1.address)).to.be.equal(staker1Sonne.add(toBurn1));
    });

    it('Should claim rewards', async function () {
        const { stakedDistributor, rewardHolder, reward0, reward1, staker0, staker1 } = await loadFixture(
            deployTokensFixture,
        );

        // Check claimable amounts

        const reward0staker0_0 = stakeAmounts[0][0].mul(rewardAmounts[0][0]).div(totalStakeAmountsByStage[0]);
        const reward0staker0_1 = totalStakeAmountsByStaker[0].mul(rewardAmounts[1][0]).div(totalStakeAmounts);
        const reward0staker1_0 = stakeAmounts[0][1].mul(rewardAmounts[0][0]).div(totalStakeAmountsByStage[0]);
        const reward0staker1_1 = totalStakeAmountsByStaker[1].mul(rewardAmounts[1][0]).div(totalStakeAmounts);
        const reward1staker1_0 = stakeAmounts[0][1].mul(rewardAmounts[0][1]).div(totalStakeAmountsByStage[0]);
        const reward1staker1_1 = totalStakeAmountsByStaker[1].mul(rewardAmounts[1][1]).div(totalStakeAmounts);

        // Claim first staker
        await (await stakedDistributor.connect(staker0).claim(reward0.address)).wait(1);
        const claimedstaker0reward0 = await reward0.balanceOf(staker0.address);
        expect(claimedstaker0reward0).to.be.equal(reward0staker0_0);

        // Add second stakes
        await (await stakedDistributor.connect(staker0).mint(stakeAmounts[1][0])).wait(1);
        expect(await stakedDistributor.balanceOf(staker0.address)).to.equal(totalStakeAmountsByStaker[0]);
        await (await stakedDistributor.connect(staker1).mint(stakeAmounts[1][1])).wait(1);
        expect(await stakedDistributor.balanceOf(staker1.address)).to.equal(totalStakeAmountsByStaker[1]);

        // Add second rewards
        await (await stakedDistributor.connect(rewardHolder).addReward(reward0.address, rewardAmounts[1][0])).wait(1);
        expect(await reward0.balanceOf(stakedDistributor.address)).to.be.equal(
            totalRewardAmountsByPool[0].sub(claimedstaker0reward0),
        );
        await (await stakedDistributor.connect(rewardHolder).addReward(reward1.address, rewardAmounts[1][1])).wait(1);
        expect(await reward1.balanceOf(stakedDistributor.address)).to.be.equal(totalRewardAmountsByPool[1]);

        // Claim first staker second time
        const reward0_staker0_balance = await reward0.balanceOf(staker0.address);
        const reward0_staker0_claimable = await stakedDistributor.getClaimable(reward0.address, staker0.address);
        await (await stakedDistributor.connect(staker0).claim(reward0.address)).wait(1);
        const reward0_staker0_balance2 = await reward0.balanceOf(staker0.address);
        expect(reward0_staker0_balance2).to.be.equal(reward0staker0_0.add(reward0staker0_1));
        expect(reward0_staker0_claimable).to.be.equal(reward0_staker0_balance2.sub(reward0_staker0_balance));

        // Claim All second staker for two distribution
        const reward0_staker1_balance = await reward0.balanceOf(staker1.address);
        const reward0_staker1_claimable = await stakedDistributor.getClaimable(reward0.address, staker1.address);
        const reward1_staker1_balance = await reward1.balanceOf(staker1.address);
        const reward1_staker1_claimable = await stakedDistributor.getClaimable(reward1.address, staker1.address);

        await (await stakedDistributor.connect(staker1).claimAll()).wait(1);

        // Check reward0
        const claimedstaker1reward0_total = await reward0.balanceOf(staker1.address);
        expect(claimedstaker1reward0_total).to.be.equal(reward0staker1_0.add(reward0staker1_1));
        expect(reward0_staker1_claimable).to.be.equal(claimedstaker1reward0_total.sub(reward0_staker1_balance));

        // Check reward1
        const claimedstaker1reward1_total = await reward1.balanceOf(staker1.address);
        expect(claimedstaker1reward1_total).to.be.equal(reward1staker1_0.add(reward1staker1_1));
        expect(reward1_staker1_claimable).to.be.equal(claimedstaker1reward1_total.sub(reward1_staker1_balance));
    });

    it('Should revert to claim invalid reward token', async function () {
        const { stakedDistributor, staker0 } = await loadFixture(deployTokensFixture);

        await expect(stakedDistributor.connect(staker0).claim(ethers.constants.AddressZero)).to.be.revertedWith(
            'Distributor: Invalid token',
        );
    });

    it('Should not return to claim zero', async function () {
        const { stakedDistributor, reward0 } = await loadFixture(deployTokensFixture);

        const nonStaker = ethers.Wallet.createRandom();
        const nonStakerBalance0 = await reward0.balanceOf(nonStaker.address);

        expect(await stakedDistributor.getClaimable(reward0.address, nonStaker.address)).to.be.equal(0);
        await expect(stakedDistributor.claim(reward0.address)).to.not.reverted;

        const nonStakerBalance1 = await reward0.balanceOf(nonStaker.address);
        expect(nonStakerBalance1).to.be.equal(nonStakerBalance0);
    });
});
