import { ethers } from "ethers"
import { createSnaptshot } from "../../src/op/createSnapshot"
import { getSlotOfBalanceOfUserUSonne } from "../../src/op/getBalanceOfUserUSonne"
import { getProofForUserShares } from "../../src/op/getProofForUserShares"
describe("CreateSnapshot", () => {
    const provider = new ethers.JsonRpcProvider("https://opt-mainnet.g.alchemy.com/v2/o0342IMrRLY_Uj8PNpCRebPwMn1n1ql5")
    it("get account root", async () => {
        const uSonne = "0x41279e29586eb20f9a4f65e031af09fced171166"
        const blockNr = 108080039
        const s = await createSnaptshot(provider, uSonne, blockNr)

        console.log(s)

    })

    it("get proof for user", async () => {
        const uSonne = "0x41279e29586EB20f9a4f65e031Af09fced171166"
        const addr = "0x0f45156f109e474295913d78036fa213b1745d5a"
        const blockNr = 108080039


        const proof = await getProofForUserShares(provider, uSonne, addr, blockNr)

        console.log(proof)


    })

})