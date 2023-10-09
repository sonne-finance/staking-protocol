import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    return false;
    const isSideChain = network.name != 'optimism' && network.targetName != 'optimism';
    if (!isSideChain) return;

    const { deployer } = await getNamedAccounts();

    const reserveManagerDeploy = await deploy('BaseReserveManager', {
        from: deployer,
        log: true,
        contract: 'contracts/BaseReserveManager.sol:BaseReserveManager',
        args: [],
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
            execute: {
                init: {
                    methodName: 'initialize',
                    args: [],
                },
            },
        },
    });
};

const tags = ['ReserveManager'];
export { tags };

export default func;
