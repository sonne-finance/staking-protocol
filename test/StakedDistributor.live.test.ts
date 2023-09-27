import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { sumArray } from './_utils';

let sonneAddress = '0x1db2466d9f5e10d7090e7152b68d62703a2245f0';
let usdcAddress = '0x7f5c764cbc14f9669b88837ca1490cca17c31607';
let multiSigAddress = '0x784B82a27029C9E114b521abcC39D02B3D1DEAf2';

const mantissa = ethers.WeiPerEther;
// 0 => staker0, 1 => staker1 [rows => stages] rewardAmount[stage][staker]
const stakeAmounts = [
    [ethers.parseUnits('5', 18), ethers.parseUnits('3', 18)], // first stake
    [ethers.parseUnits('1', 18), ethers.parseUnits('2', 18)], // second stake
];
const totalStakeAmountsByStage = stakeAmounts.map((stage) => stage.reduce((a, b) => a + b, 0n));
const totalStakeAmountsByStaker = sumArray(stakeAmounts);
const totalStakeAmounts = totalStakeAmountsByStaker.reduce((a, b) => a + b, 0n);
// 0 => reward0, 1 => reward0 [rows => states] rewardAmount[stage][pool]
const rewardAmounts = [
    [ethers.parseUnits('53', 18), ethers.parseUnits('33', 6)], // first reward
    [ethers.parseUnits('23', 18), ethers.parseUnits('13', 6)], // second reward
];
const totalRewardAmountsByStage = rewardAmounts.map((stage) => stage.reduce((a, b) => a + b, 0n));
const totalRewardAmountsByPool = sumArray(rewardAmounts);
const totalRewardAmounts = totalRewardAmountsByPool.reduce((a, b) => a + b, 0n);

async function deployTokensFixture() {
    // Accounts
    const [deployer, staker0, staker1] = await ethers.getSigners();

    const admin = await ethers.getImpersonatedSigner(multiSigAddress);

    // give admin some eth
    await (
        await deployer.sendTransaction({
            to: admin.address,
            value: ethers.parseEther('100'),
        })
    ).wait(1);

    // Sonne
    const sonne = await getTokenContract({
        adminAddress: admin.address,
        mintAmount: ethers.parseEther('100000000'),
        existingAddress: sonneAddress,
        whaleAddress: multiSigAddress,
        decimals: '18',
    });

    // USDC
    const usdc = await getTokenContract({
        adminAddress: admin.address,
        mintAmount: ethers.parseEther('100000'),
        existingAddress: usdcAddress,
        whaleAddress: '0xebe80f029b1c02862b9e8a70a7e5317c06f62cae',
        decimals: '6',
    });

    // Give participants some Sonne
    const initialBalance0 = ethers.parseEther('1500');
    const initialBalance1 = ethers.parseEther('5000');
    console.log(sonne);
    await (await sonne.connect(admin).transfer(staker0.address, initialBalance0)).wait(1);
    await (await sonne.connect(admin).transfer(staker1.address, initialBalance1)).wait(1);

    // rewards
    const reward0 = sonne;
    const reward1 = usdc;

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
    await (await reward0.connect(admin).approve(stakedDistributor.address, totalRewardAmountsByPool[0])).wait(1);
    await (await stakedDistributor.connect(admin).addReward(reward0.address, rewardAmounts[0][0])).wait(1);
    await (await reward1.connect(admin).approve(stakedDistributor.address, totalRewardAmountsByPool[1])).wait(1);
    await (await stakedDistributor.connect(admin).addReward(reward1.address, rewardAmounts[0][1])).wait(1);

    return {
        admin,
        staker0,
        staker1,
        sonne,
        reward0,
        reward1,
        stakedDistributor,
        initialBalance0,
        initialBalance1,
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
        const reward2 = await MockERC20Token.connect(admin).deploy(ethers.parseUnits('10000', 18), 18);
        await expect(stakedDistributor.connect(admin).addToken(reward2.address)).to.not.be.reverted;
    });

    it('Should be able to remove a reward token', async function () {
        const { admin, stakedDistributor, reward0 } = await loadFixture(deployTokensFixture);

        // Remove an invalid reward token
        await expect(stakedDistributor.connect(admin).removeToken(ethers.ZeroAddress)).to.be.revertedWith(
            'Distributor: token not found',
        );

        // Remove a reward token
        await expect(stakedDistributor.connect(admin).removeToken(reward0.address)).to.not.reverted;
    });

    it('Should set withdrawal pending time correctly', async function () {
        const { admin, stakedDistributor } = await loadFixture(deployTokensFixture);

        // Set withdrawal pending time
        await expect(stakedDistributor.connect(admin).setWithdrawalPendingTime(86400)).to.not.be.reverted;
        await expect(stakedDistributor.connect(admin).withdrawalPendingTime()).to.be.equal(86400);
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
        await expect(stakedDistributor.connect(admin).addReward(ethers.ZeroAddress, 100)).to.be.revertedWith(
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
        const { admin, stakedDistributor, reward0, reward1, staker0, staker1, initialBalance0, initialBalance1 } =
            await loadFixture(deployTokensFixture);

        // Check claimable amounts
        let reward0Balance = await reward0.balanceOf(stakedDistributor.address);
        let reward1Balance = await reward1.balanceOf(stakedDistributor.address);

        const reward0staker0_0 = stakeAmounts[0][0].mul(rewardAmounts[0][0]).div(totalStakeAmountsByStage[0]);
        const reward0staker0_1 = totalStakeAmountsByStaker[0].mul(rewardAmounts[1][0]).div(totalStakeAmounts);
        const reward0staker1_0 = stakeAmounts[0][1].mul(rewardAmounts[0][0]).div(totalStakeAmountsByStage[0]);
        const reward0staker1_1 = totalStakeAmountsByStaker[1].mul(rewardAmounts[1][0]).div(totalStakeAmounts);
        const reward1staker1_0 = stakeAmounts[0][1].mul(rewardAmounts[0][1]).div(totalStakeAmountsByStage[0]);
        const reward1staker1_1 = totalStakeAmountsByStaker[1].mul(rewardAmounts[1][1]).div(totalStakeAmounts);

        // Claim first staker
        const beforeReward0Balance = await reward0.balanceOf(staker0.address);
        await (await stakedDistributor.connect(staker0).claim(reward0.address)).wait(1);
        const afterReward0Balance = await reward0.balanceOf(staker0.address);
        expect(afterReward0Balance.sub(beforeReward0Balance)).to.equal(reward0staker0_0);
        reward0Balance = reward0Balance.sub(reward0staker0_0);

        // Add second stakes
        await (await stakedDistributor.connect(staker0).mint(stakeAmounts[1][0])).wait(1);
        expect(await stakedDistributor.balanceOf(staker0.address)).to.equal(totalStakeAmountsByStaker[0]);
        reward0Balance = reward0Balance.add(stakeAmounts[1][0]);
        await (await stakedDistributor.connect(staker1).mint(stakeAmounts[1][1])).wait(1);
        expect(await stakedDistributor.balanceOf(staker1.address)).to.equal(totalStakeAmountsByStaker[1]);
        reward0Balance = reward0Balance.add(stakeAmounts[1][1]);

        // Add second rewards
        const beforeReward0 = await reward0.balanceOf(stakedDistributor.address);
        await (await stakedDistributor.connect(admin).addReward(reward0.address, rewardAmounts[1][0])).wait(1);
        reward0Balance = reward0Balance.add(rewardAmounts[1][0]);
        const afterReward0 = await reward0.balanceOf(stakedDistributor.address);
        expect(rewardAmounts[1][0]).to.equal(afterReward0.sub(beforeReward0));
        expect(afterReward0).to.equal(reward0Balance);

        const beforeReward1 = await reward1.balanceOf(stakedDistributor.address);
        await (await stakedDistributor.connect(admin).addReward(reward1.address, rewardAmounts[1][1])).wait(1);
        const afterReward1 = await reward1.balanceOf(stakedDistributor.address);
        expect(totalRewardAmountsByPool[1]).to.equal(afterReward1);

        // Claim first staker second time
        const before_reward0_staker0_balance = await reward0.balanceOf(staker0.address);
        const reward0_staker0_claimable = await stakedDistributor.getClaimable(reward0.address, staker0.address);
        await (await stakedDistributor.connect(staker0).claim(reward0.address)).wait(1);
        const after_reward0_staker0_balance = await reward0.balanceOf(staker0.address);
        expect(reward0_staker0_claimable).to.equal(reward0staker0_1);
        expect(reward0staker0_1).to.equal(after_reward0_staker0_balance.sub(before_reward0_staker0_balance));

        // Claim All second staker for two distribution
        const before_reward0_staker1_balance = await reward0.balanceOf(staker1.address);
        const reward0_staker1_claimable = await stakedDistributor.getClaimable(reward0.address, staker1.address);
        const before_reward1_staker1_balance = await reward1.balanceOf(staker1.address);
        const reward1_staker1_claimable = await stakedDistributor.getClaimable(reward1.address, staker1.address);
        await (await stakedDistributor.connect(staker1).claimAll()).wait(1);
        const after_reward0_staker1_balance = await reward0.balanceOf(staker1.address);
        const after_reward1_staker1_balance = await reward1.balanceOf(staker1.address);

        // Check reward0
        const reward0Staker1Total = reward0staker1_0.add(reward0staker1_1);
        expect(after_reward0_staker1_balance.sub(before_reward0_staker1_balance)).to.be.equal(reward0Staker1Total);
        expect(reward0_staker1_claimable).to.be.equal(reward0Staker1Total);

        // Check reward1
        const reward1Staker1Total = reward1staker1_0.add(reward1staker1_1);
        //expect(after_reward1_staker1_balance.sub(before_reward1_staker1_balance)).to.be.equal(reward1Staker1Total);
        //expect(reward1_staker1_claimable).to.be.equal(reward1Staker1Total);
    });

    it('Should revert to claim invalid reward token', async function () {
        const { stakedDistributor, staker0 } = await loadFixture(deployTokensFixture);

        await expect(stakedDistributor.connect(staker0).claim(ethers.ZeroAddress)).to.be.revertedWith(
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

const getTokenContract = async (opts: {
    adminAddress: string;
    mintAmount?: bigint;
    existingAddress?: string;
    whaleAddress?: string;
    decimals?: string;
}) => {
    if (opts.existingAddress) {
        const token = await ethers.getContractAt('MockERC20Token', opts.existingAddress);

        if (opts.whaleAddress) {
            const whale = await ethers.getImpersonatedSigner(opts.whaleAddress);

            const balance = await token.balanceOf(whale.address);
            await (await token.connect(whale).transfer(opts.adminAddress, balance)).wait(1);
        }

        return token;
    } else {
        const Token = await ethers.getContractFactory('MockERC20Token');
        const token = await Token.deploy(opts.mintAmount || ethers.parseEther('100000000'), 18);
        return token;
    }
};
