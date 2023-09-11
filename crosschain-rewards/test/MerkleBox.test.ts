//@ts-ignore
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
//@ts-ignore
import { expectRevert, time } from '@openzeppelin/test-helpers'
import { Signer } from "ethers"
import hardhat, { ethers, expect } from "hardhat"
import { ERC20WithPermitMock, ERC20WithPermitMock__factory, SonneMerkleDistributor, SonneMerkleDistributor__factory } from "../src/types"
import { testDistribution1 } from './proofs/testDistribution1'

describe.only("SonneMerkleDistributor test", () => {

    let deployer: HardhatEthersSigner;
    let funder: HardhatEthersSigner, funder2: HardhatEthersSigner, funder3: Signer
    let staker1: HardhatEthersSigner, staker2: HardhatEthersSigner;

    let sonneMerkleDistributor: SonneMerkleDistributor
    let erc20: ERC20WithPermitMock




    beforeEach(async () => {
        [deployer, funder, funder2, staker1, staker2] = await ethers.getSigners()
        funder3 = new ethers.Wallet("0xa11a58ba8887796d1a7bc2a6107a98e0befd2b10c8846a39f39c05c6a976e725")

        erc20 = await new ERC20WithPermitMock__factory().connect(deployer).deploy()
        sonneMerkleDistributor = await new SonneMerkleDistributor__factory().connect(funder).deploy(await erc20.getAddress())

        await erc20.mintInternal(funder, 145192000000000000000000n)
        await erc20.mintInternal(funder2, 1000)
        await erc20.mintInternal(funder3, 1000)

    })
    afterEach(() => {
        hardhat.network.provider.send("hardhat_reset")
    })

    describe("before a reward is created", () => {

        it('isClaimable() returns false for an unknown blockNumber', async () => {
            const blockNumber = 42
            expect(await sonneMerkleDistributor.isClaimable(blockNumber, staker1.address, [])).to.equal(false)
        })

        it('reverts when claiming from an unknown blockNumber', async () => {
            const { accountRoot, stakers } = testDistribution1;
            const { key, proof } = stakers['0x90F79bf6EB2c4f870365E785982E1f101E93b906']
            const unknownBlocknr = 42
            await expectRevert(sonneMerkleDistributor.connect(staker1).claim(unknownBlocknr, proof,), 'Reward not found')
        })
    })

    describe("when creating a new reward", () => {
        it('emits NewMerkle event and deposits funds', async () => {
            const unlockTime = 100000000
            const { accountRoot, blocknr } = testDistribution1;

            await erc20.connect(funder).approve(await sonneMerkleDistributor.getAddress(), 1000)
            const tx = await sonneMerkleDistributor.connect(funder).addReward(1000, accountRoot, blocknr, unlockTime, 1000)
            const receipt = await tx.wait()

            const [_, newMerkleEvent] = receipt!.logs
            const [sender, eventToken, amount, merkleRoot, eventBlockNr, eventUnlockTime] = newMerkleEvent.args

            expect(sender).eqls(funder.address)
            expect(eventToken).eqls(await erc20.getAddress())
            expect(amount).eqls(1000n)
            expect(merkleRoot).eqls(accountRoot)
            expect(eventBlockNr).eqls(BigInt(blocknr))
            expect(eventUnlockTime).eqls(BigInt(unlockTime))


            expect(await erc20.balanceOf(funder)).eqls(145192000000000000000000n - 1000n)
            expect(await erc20.balanceOf(await sonneMerkleDistributor.getAddress())).eqls(1000n)

        })

        it('reverts if merkleRoot is zero', async () => {
            const unlockTime = 100000000
            const { blocknr } = testDistribution1;
            await erc20.connect(funder).approve(await sonneMerkleDistributor.getAddress(), 1000)

            await expectRevert(sonneMerkleDistributor.connect(funder).addReward(1000, ethers.ZeroHash, blocknr, unlockTime, 1000), 'Merkle root cannot be zero')
        })



        it('reverts if insufficient balance', async () => {
            const unlockTime = 100000000
            const { accountRoot, blocknr } = testDistribution1;
            await erc20.connect(funder).approve(await sonneMerkleDistributor.getAddress(), 1000)

            await expectRevert(sonneMerkleDistributor.connect(funder).addReward(145192000000000000000001n, accountRoot, blocknr, unlockTime, 1000), 'Invalid amount or insufficient balance')
        })

        it('reverts if amount is zero', async () => {
            const unlockTime = 100000000
            const { accountRoot, blocknr } = testDistribution1;
            await erc20.connect(funder).approve(await sonneMerkleDistributor.getAddress(), 1000)

            await expectRevert(sonneMerkleDistributor.connect(funder).addReward(0, accountRoot, blocknr, unlockTime, 1000), 'Invalid amount or insufficient balance')
        })
    })

    describe("after creating a reward", () => {
        const { accountRoot, blocknr, stakers } = testDistribution1;
        const unlockTime = 10000000000

        beforeEach(async () => {
            await erc20.connect(funder).approve(await sonneMerkleDistributor.getAddress(), 1000)
            const tx = await sonneMerkleDistributor.connect(funder).addReward(1000, accountRoot, blocknr, unlockTime, 1000)
        })
        it('funder cannot withdraw', async () => {
            await expectRevert(sonneMerkleDistributor.connect(funder).withdrawFunds(blocknr, 50), 'Rewards may not be withdrawn')
        })
        it('should get list of all rewards', async () => {
            await erc20.connect(funder).approve(await sonneMerkleDistributor.getAddress(), 2000)
            await sonneMerkleDistributor.connect(funder).addReward(1000, accountRoot, blocknr + 1, unlockTime, 1000)

            const availabeReward1 = await sonneMerkleDistributor.rewards(0)
            const availabeReward2 = await sonneMerkleDistributor.rewards(1)


            expect(availabeReward1).equals(blocknr)
            expect(availabeReward2).equals(blocknr + 1)

        })
        it('funder cannot withdraw-all', async () => {
            await expectRevert(sonneMerkleDistributor.connect(funder).withdrawFunds(blocknr, ethers.MaxUint256), 'Rewards may not be withdrawn')
        })
        it('stakers can claim', async () => {
            expect(staker1.address).eql("0x90F79bf6EB2c4f870365E785982E1f101E93b906")
            expect(await erc20.balanceOf(staker1)).to.equal(0)

            const { key, proof } = stakers['0x90F79bf6EB2c4f870365E785982E1f101E93b906']
            console.log(key)
            await sonneMerkleDistributor.connect(staker1).claim(blocknr, proof)
            expect(await erc20.balanceOf(staker1.address)).to.equal(123)
        })
        //Todo rewrite to delegate
        it.skip('other account can claim on behalf of recipient', async () => {
            expect(staker1.address).eql("0x90F79bf6EB2c4f870365E785982E1f101E93b906")
            expect(await erc20.balanceOf(staker1)).to.equal(0)

            const { key, proof } = stakers['0x90F79bf6EB2c4f870365E785982E1f101E93b906']
            await sonneMerkleDistributor.connect(funder).claim(blocknr, proof)
            expect(await erc20.balanceOf(staker1.address)).to.equal(123)
        })
        it('recipient cannot claim twice', async () => {
            expect(staker1.address).eql("0x90F79bf6EB2c4f870365E785982E1f101E93b906")
            expect(await erc20.balanceOf(staker1)).to.equal(0)

            const { key, proof } = stakers['0x90F79bf6EB2c4f870365E785982E1f101E93b906']
            await sonneMerkleDistributor.connect(staker1).claim(blocknr, proof)
            expect(await erc20.balanceOf(staker1.address)).to.equal(123)

            await expectRevert(sonneMerkleDistributor.connect(staker1).claim(blocknr, proof), 'Already claimed')

        })
        it('isClaimable() returns true for a valid and unclaimed Merkle proof', async () => {
            const { key, proof } = stakers['0x90F79bf6EB2c4f870365E785982E1f101E93b906']
            expect(await sonneMerkleDistributor.isClaimable(blocknr, staker1.address, proof)).to.equal(true)
        })
        it('isClaimable() returns false for a valid but already claimed Merkle proof', async () => {
            const { key, proof } = stakers['0x90F79bf6EB2c4f870365E785982E1f101E93b906']

            await sonneMerkleDistributor.connect(staker1).claim(blocknr, proof,)
            expect(await sonneMerkleDistributor.isClaimable(blocknr, staker1.address, proof)).to.equal(false)
        })
        it('reverts when claiming with an invalid Merkle proof', async () => {
            expect(staker1.address).eql("0x90F79bf6EB2c4f870365E785982E1f101E93b906")
            expect(await erc20.balanceOf(staker1)).to.equal(0)

            const { key } = stakers['0x90F79bf6EB2c4f870365E785982E1f101E93b906']
            const { proof: invalidProof } = stakers["0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"]

            await expectRevert.unspecified(sonneMerkleDistributor.connect(staker1).claim(blocknr, invalidProof,))
        })

        it('isClaimable() reverts for an invalid Merkle proof', async () => {
            await expectRevert(sonneMerkleDistributor.isClaimable(blocknr, staker1.address, []), "MerkleTrie: ran out of proof elements")

        })

        it('reverts when reward is not found for given Merkle root', async () => {
            const { key, proof } = stakers['0x90F79bf6EB2c4f870365E785982E1f101E93b906']
            await expectRevert(sonneMerkleDistributor.claim(111, proof,), 'Reward not found')
        })
        it('isClaimable() reverts when reward is not found for given Merkle root', async () => {
            await erc20.connect(funder).approve(await sonneMerkleDistributor.getAddress(), 1000)
            //Create a distribution where the value is not part of
            await sonneMerkleDistributor.connect(funder).addReward(1000, ethers.hashMessage("rando"), blocknr + 1, 10000000000, 1000)

            const { key, proof } = stakers['0x90F79bf6EB2c4f870365E785982E1f101E93b906']

            await expectRevert(sonneMerkleDistributor.isClaimable(blocknr + 1, staker1.address, proof), "'MerkleTrie: invalid root hash")

        })
        it('cant create a second reward with the same merkle root', async () => {
            await erc20.connect(funder).approve(await sonneMerkleDistributor.getAddress(), 1000)
            //TODO discuss
            await expectRevert(sonneMerkleDistributor.connect(funder).addReward(1000, accountRoot, blocknr, unlockTime, 1000), "Merkle root was already posted")

        })
        describe("when unlock time is reached", () => {
            const { accountRoot, blocknr, stakers } = testDistribution1;
            const unlockTime = 10000000000
            beforeEach(async () => {
                await time.increaseTo(unlockTime)
            })

            it('funder can withdraw', async () => {
                const prevBalance = await erc20.balanceOf(funder)
                const tx = await sonneMerkleDistributor.connect(funder).withdrawFunds(blocknr, 50,)

                const receipt = await tx.wait()
                const [_, newMerkleEvent] = receipt!.logs
                const [eventSender, eventMerkleRoot, eventBlockNr, eventAmount, eventWithdraw] = newMerkleEvent.args

                expect(eventSender).equals(funder.address)
                expect(eventMerkleRoot).equals(accountRoot)
                expect(eventBlockNr).equals(blocknr)
                expect(eventAmount).equals(50n)
                expect(eventWithdraw).equals(true)

                expect(await erc20.balanceOf(funder)).equals(prevBalance + 50n)
                expect(await erc20.balanceOf(await sonneMerkleDistributor.getAddress())).equals(950)
            })

            it('funder cannot over-withdraw', async () => {
                await expectRevert(sonneMerkleDistributor.connect(funder).withdrawFunds(blocknr, 1001,), 'Insufficient balance')
            })

            it('other cannot withdraw', async () => {
                await expectRevert(sonneMerkleDistributor.connect(staker1).withdrawFunds(blocknr, 100,), 'Ownable: caller is not the owner')

            })

            it('recipient can claim', async () => {
                expect(staker1.address).eql("0x90F79bf6EB2c4f870365E785982E1f101E93b906")
                expect(await erc20.balanceOf(staker1)).to.equal(0)

                const { key, proof } = stakers['0x90F79bf6EB2c4f870365E785982E1f101E93b906']
                await sonneMerkleDistributor.connect(staker1).claim(blocknr, proof,)
                expect(await erc20.balanceOf(staker1.address)).to.equal(123)
            })
        })
    })
    context('when a blockNumber is underfunded', async () => {
        const unlockTime = 10000000000
        const { blocknr, accountRoot, stakers } = testDistribution1;

        beforeEach(async () => {
            await erc20.connect(funder).approve(await sonneMerkleDistributor.getAddress(), 500)
            await sonneMerkleDistributor.connect(funder).addReward(456, accountRoot, blocknr, unlockTime, 500)
            const { key, proof } = stakers["0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"]

            await sonneMerkleDistributor.connect(staker2).claim(blocknr, proof,)
            //500-456  = 44 token are left
        })

        it('cannot claim when not enough balance', async () => {
            const { key, proof } = stakers["0x90F79bf6EB2c4f870365E785982E1f101E93b906"]
            await expectRevert(sonneMerkleDistributor.connect(staker1).claim(blocknr, proof), 'Claim under-funded by funder.')
        })
    })

})