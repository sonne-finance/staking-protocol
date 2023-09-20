import { toRpcHexString } from '@eth-optimism/core-utils';
import { getSlotOfBalanceOfUserUSonne } from "./getBalanceOfUserUSonne";

import { ethers } from "ethers";
export const getProofForUserShares = async (provider: ethers.JsonRpcProvider, stakingContract: string, user: string, blockNr: number) => {
    const slot = getSlotOfBalanceOfUserUSonne(user)

    const proofResponse = await provider.send('eth_getProof', [stakingContract, [slot], toRpcHexString(blockNr)]);

    const { storageHash, storageProof } = proofResponse
    const { value, proof, key } = storageProof[0]



    console.log("slot", await provider.getStorage(stakingContract, slot))
    return { storageHash, value, user, blockNr, key, proof: proof }

}
