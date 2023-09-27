import { JsonRpcProvider, Contract } from 'ethers';
import { toRpcHexString } from '@eth-optimism/core-utils';

export const createSnaptshot = async (provider: JsonRpcProvider, stakingContract: string, blockNr: number) => {
    const proof = await provider.send('eth_getProof', [stakingContract, [], toRpcHexString(blockNr)]);
    const accountRoot = proof.storageHash;
    const stakingContractAbi = [
        {
            inputs: [],
            name: 'totalShares',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
        },
    ];

    const stakingInstance = new Contract(stakingContract, stakingContractAbi, provider);
    const totalStakedBalance = await stakingInstance.totalShares();

    return { accountRoot, blockNr, totalStakedBalance: totalStakedBalance.toString() };
};
