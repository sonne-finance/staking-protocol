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

    const rewardManagerDeploy = await deploy('RewardManager', {
        from: deployer,
        log: true,
        contract: 'contracts/RewardManager.sol:RewardManager',
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

const tags = ['RewardManager'];
export { tags };

export default func;
