import { ethers } from 'ethers';

export const getSlotOfBalanceOfUserUSonne = (address: string) => {
    //   mapping(address => uint256) public shares;
    const sharesSlotNumber = 2;

    //const slot1 = ethers.solidityPackedKeccak256(["address", "uint256"], [address, sharesSlotNumber]);

    const enc = ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [address, sharesSlotNumber]);
    const slot = ethers.keccak256(enc);

    return slot;
};
