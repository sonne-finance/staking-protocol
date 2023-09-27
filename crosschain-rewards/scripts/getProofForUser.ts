import { ethers } from 'hardhat';
import { getProofForUserShares } from '../src/op/getProofForUserShares';

async function main() {
    const provider = new ethers.JsonRpcProvider(
        'https://opt-mainnet.g.alchemy.com/v2/o0342IMrRLY_Uj8PNpCRebPwMn1n1ql5',
    );

    const sSonne = '0x41279e29586EB20f9a4f65e031Af09fced171166';
    const blockNr = 109908917;
    const addr = '0x969F2e54B4Aa4654F7c2f75Cbbd2d56910A1d371';

    const proof = await getProofForUserShares(provider, sSonne, addr, blockNr);

    console.log(proof);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
