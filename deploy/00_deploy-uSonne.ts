import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const sonneAddress = '0x1db2466d9f5e10d7090e7152b68d62703a2245f0';
const veloAddress = '0x3c8b650257cfb5f272f799f5e2b4e65093a11a05';
const usdcAddress = '0x7f5c764cbc14f9669b88837ca1490cca17c31607';

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();

    const stakeDeploy = await deploy('uSonne', {
        from: deployer,
        log: true,
        contract: 'contracts/StakedDistributor.sol:StakedDistributor',
        args: [sonneAddress, 'Staked Sonne', 'uSonne'],
    });
    const staking = await ethers.getContractAt('StakedDistributor', stakeDeploy.address);

    await (await staking.addToken(usdcAddress)).wait(1);
    await (await staking.addToken(veloAddress)).wait(1);
};

export default func;
