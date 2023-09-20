import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();

    const usdc = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

    const distributorDeploy = await deploy('UsdcMerkleDistributor', {
        from: deployer,
        log: true,
        contract: 'contracts/SonneMerkleDistributor.sol:SonneMerkleDistributor',
        args: [usdc],
    });
};

export default func;
