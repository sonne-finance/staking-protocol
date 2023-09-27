import { ethers } from 'ethers';
import { createSnaptshot } from '../../src/op/createSnapshot';
import { getSlotOfBalanceOfUserUSonne } from '../../src/op/getBalanceOfUserUSonne';
import { getProofForUserShares } from '../../src/op/getProofForUserShares';
describe('CreateSnapshot', () => {
    const provider = new ethers.JsonRpcProvider(
        'https://opt-mainnet.g.alchemy.com/v2/o0342IMrRLY_Uj8PNpCRebPwMn1n1ql5',
    );
    it('get account root', async () => {
        const uSonne = '0xDC05d85069Dc4ABa65954008ff99f2D73FF12618';
        const blockNr = 109888730;
        const s = await createSnaptshot(provider, uSonne, blockNr);
    });

    it('get proof for user', async () => {
        const uSonne = '0xDC05d85069Dc4ABa65954008ff99f2D73FF12618';
        const addr = '0x969F2e54B4Aa4654F7c2f75Cbbd2d56910A1d371';
        const blockNr = 109888730;

        const proof = await getProofForUserShares(provider, uSonne, addr, blockNr);
    });
});
