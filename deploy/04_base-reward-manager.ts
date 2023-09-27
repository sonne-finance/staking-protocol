import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const isSideChain = network.name != 'optimism' && network.targetName != 'optimism';
    if (!isSideChain) return;

    const { deployer } = await getNamedAccounts();

    const rewardManagerDeploy = await deploy('BaseRewardManager', {
        from: deployer,
        log: true,
        contract: 'contracts/BaseRewardManager.sol:BaseRewardManager',
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
