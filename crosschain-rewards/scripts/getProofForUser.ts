import { ethers } from "hardhat"
import { getProofForUserShares } from "../src/op/getProofForUserShares"


async function main() {
    const provider = new ethers.JsonRpcProvider("https://opt-mainnet.g.alchemy.com/v2/o0342IMrRLY_Uj8PNpCRebPwMn1n1ql5")

    const uSonne = "0x41279e29586eb20f9a4f65e031af09fced171166"
    const addr = "0xdAD29981B5FeeFEeaf3eF92E678e53c5620A1Fd8"
    const blockNr = 108080039

    const proof = await getProofForUserShares(provider, uSonne, addr, blockNr)

    console.log(proof)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});