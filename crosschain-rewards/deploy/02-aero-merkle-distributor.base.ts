import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();

    const aero = '0x940181a94A35A4569E4529A3CDfB74e38FD98631';

    const distributorDeploy = await deploy('AeroMerkleDistributor', {
        from: deployer,
        log: true,
        contract: 'contracts/SonneMerkleDistributor.sol:SonneMerkleDistributor',
        args: [aero],
    });
};

export default func;
