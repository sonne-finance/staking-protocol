import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const sonneAddress = '0x1db2466d9f5e10d7090e7152b68d62703a2245f0';
const veloAddress = '0x3c8b650257cfb5f272f799f5e2b4e65093a11a05';

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();

    const stakeDeploy = await deploy('sSonne', {
        from: deployer,
        log: true,
        contract: 'contracts/StakedDistributor.sol:StakedDistributor',
        args: [sonneAddress, 'Staked Sonne', 'sSonne'],
    });
    const staking = await ethers.getContractAt('StakedDistributor', stakeDeploy.address);

    await (await staking.addToken(sonneAddress)).wait(1);
    await (await staking.addToken(veloAddress)).wait(1);
};

export default func;
