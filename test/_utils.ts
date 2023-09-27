import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { ethers, network } from 'hardhat';
import { createSnaptshot } from './op/createSnapshot';
import { getProofForUserShares } from './op/getProofForUserShares';

const sumArray = (array: bigint[][]) => {
    const newArray: bigint[] = [];
    array.forEach((sub) => {
        sub.forEach((num: bigint, index: number) => {
            if (newArray[index]) {
                newArray[index] = newArray[index] + num;
            } else {
                newArray[index] = num;
            }
        });
    });
    return newArray;
};

const getTokenContract = async (opts: {
    admin: SignerWithAddress;
    mintAmount?: bigint;
    existingAddress?: string;
    whaleAddress?: string;
    decimals?: string;
}) => {
    if (opts.existingAddress) {
        const token = await ethers.getContractAt('MockERC20Token', opts.existingAddress);

        if (opts.whaleAddress) {
            const whale = await ethers.getSigner(opts.whaleAddress);

            const balance = await token.balanceOf(whale.address);
            await (await token.connect(whale).transfer(opts.admin.address, balance)).wait(1);
        }

        return token;
    } else {
        const Token = await ethers.getContractFactory('MockERC20Token');
        const token = await Token.connect(opts.admin).deploy(opts.mintAmount || ethers.parseEther('100000000'), 18);
        return token;
    }
};

const getImpersonatedSigner = async (account: string) => {
    await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [account],
    });

    const newBalanceHex = '0x' + ethers.parseEther('100').toString(16);
    await network.provider.request({
        method: 'hardhat_setBalance',
        params: [account, newBalanceHex],
    });
    return ethers.getSigner(account);
};

function anyValue(a) {
    console.log(a);
    return true;
}

const getOpPoolState = async (blockNumber: number, userAddress: string) => {
    const opProvider = new ethers.JsonRpcProvider(
        'https://opt-mainnet.g.alchemy.com/v2/o0342IMrRLY_Uj8PNpCRebPwMn1n1ql5',
    );
    const sSonneAddress = '0xDC05d85069Dc4ABa65954008ff99f2D73FF12618';
    const uSonneAddress = '0x41279e29586EB20f9a4f65e031Af09fced171166';

    const [sSonneRoot, uSonneRoot] = await Promise.all([
        createSnaptshot(opProvider, sSonneAddress, blockNumber),
        createSnaptshot(opProvider, uSonneAddress, blockNumber),
    ]);
    const [sSonneProof, uSonneProof] = await Promise.all([
        getProofForUserShares(opProvider, sSonneAddress, userAddress, blockNumber),
        getProofForUserShares(opProvider, uSonneAddress, userAddress, blockNumber),
    ]);

    return {
        sMerkleRoot: sSonneRoot.accountRoot,
        uMerkleRoot: uSonneRoot.accountRoot,
        sSupply: BigInt(sSonneRoot.totalStakedBalance),
        uSupply: BigInt(uSonneRoot.totalStakedBalance),
        blockNumber: blockNumber,
    };
};

export { anyValue, getImpersonatedSigner, getTokenContract, sumArray, getOpPoolState };
