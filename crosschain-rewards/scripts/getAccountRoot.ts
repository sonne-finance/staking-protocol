import hre, { ethers } from 'hardhat';
import { createSnaptshot } from '../src/op/createSnapshot';

async function main() {
    const provider = new ethers.JsonRpcProvider(
        'https://opt-mainnet.g.alchemy.com/v2/o0342IMrRLY_Uj8PNpCRebPwMn1n1ql5',
    );

    const sSonne = '0x41279e29586EB20f9a4f65e031Af09fced171166';
    const blockNr = 109908917;
    const s = await createSnaptshot(provider, sSonne, blockNr);

    console.log(s);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
