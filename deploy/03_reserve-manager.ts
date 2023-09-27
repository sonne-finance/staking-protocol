import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const isOp = network.name == 'optimism' || network.targetName == 'optimism';
    if (!isOp) return;

    const { deployer } = await getNamedAccounts();

    const reserveManagerDeploy = await deploy('ReserveManager', {
        from: deployer,
        log: true,
        contract: 'contracts/ReserveManager.sol:ReserveManager',
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
