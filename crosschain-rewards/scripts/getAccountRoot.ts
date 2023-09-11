import hre, { ethers } from "hardhat"
import { createSnaptshot } from "../src/op/createSnapshot"


async function main() {
    const provider = new ethers.JsonRpcProvider("https://opt-mainnet.g.alchemy.com/v2/o0342IMrRLY_Uj8PNpCRebPwMn1n1ql5")

    const uSonne = "0x41279e29586eb20f9a4f65e031af09fced171166"
    const blockNr = 108080039
    const s = await createSnaptshot(provider, uSonne, blockNr)

    console.log(s)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});