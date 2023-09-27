import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { SonneMerkleDistributor__factory } from '../src/types';
import { upgrades } from 'hardhat';
import { deployBeaconProxy } from '../scripts/deploy-beacon-proxy';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const CONTRACT_NAME = 'contracts/SonneMerkleDistributor.sol:SonneMerkleDistributor';

    const deployments = {
        sSONNE_Distributor: '0x22a2488fE295047Ba13BD8cCCdBC8361DBD8cf7c',
        uUSDC_Distributor: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        sAero_Distributor: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
        uAero_Distributor: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    };

    for (const [deploymentKey, rewardToken] of Object.entries(deployments)) {
        await deployBeaconProxy(deploymentKey, CONTRACT_NAME, [rewardToken], hre);
    }
};

export default func;
