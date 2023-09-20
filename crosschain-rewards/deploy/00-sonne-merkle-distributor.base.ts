import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();

    const sonne = '0x22a2488fE295047Ba13BD8cCCdBC8361DBD8cf7c';

    const distributorDeploy = await deploy('SonneMerkleDistributor', {
        from: deployer,
        log: true,
        contract: 'contracts/SonneMerkleDistributor.sol:SonneMerkleDistributor',
        args: [sonne],
    });
};

export default func;
