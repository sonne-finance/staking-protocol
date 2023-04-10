import { BigNumber } from 'ethers';

const sumArray = (array: BigNumber[][]) => {
    const newArray: BigNumber[] = [];
    array.forEach((sub) => {
        sub.forEach((num: BigNumber, index: number) => {
            if (newArray[index]) {
                newArray[index] = newArray[index].add(num);
            } else {
                newArray[index] = num;
            }
        });
    });
    return newArray;
};

export { sumArray };
