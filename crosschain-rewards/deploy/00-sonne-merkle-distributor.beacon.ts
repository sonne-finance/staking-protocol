import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { SonneMerkleDistributor__factory } from '../src/types';
import { upgrades } from 'hardhat';
import { deployBeacon } from '../scripts/deploy-beacon';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const CONTRACT_NAME = 'contracts/SonneMerkleDistributor.sol:SonneMerkleDistributor';

    await deployBeacon(CONTRACT_NAME, hre);
};

export default func;
