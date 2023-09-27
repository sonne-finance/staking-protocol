import { upgrades } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployBeaconProxy = async (
    deploymentKey: string,
    contract: string,
    args: any[],
    {
        getNamedAccounts,
        deployments: { deploy, save, get, log, getExtendedArtifact, getOrNull },
        ethers,
        network,
    }: HardhatRuntimeEnvironment,
) => {
    const PROXY_CONTRACT_NAME = '@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol:BeaconProxy';

    const contractFactory = await ethers.getContractFactory(contract);
    const contractArtifact = await getExtendedArtifact(contract);

    const contractName = contract.indexOf(':') > -1 ? contract.split(':')[1] : contract;

    const beaconDeploymentKey = `${contractName}_Beacon`;
    const beaconDeploy = await get(beaconDeploymentKey);
    const beacon = await ethers.getContractAt(contract, beaconDeploy.address);

    const proxyDeploy = await getOrNull(deploymentKey);

    if (proxyDeploy) {
        log(`Using existing deployment for ${deploymentKey} at ${proxyDeploy.address}`);

        const proxyContract = await ethers.getContractAt(contractName, proxyDeploy.address);
        return proxyContract;
    }

    const deployment = await upgrades.deployBeaconProxy(beacon, contractFactory, args);
    await deployment.waitForDeployment();
    const deploymentAddress = await deployment.getAddress();
    log(`${deploymentKey} deployed at: ${deploymentAddress}.`);

    await save(deploymentKey, {
        address: deploymentAddress,
        ...contractArtifact,
    });

    const proxyDeployment = await get(deploymentKey);
    const proxyContract = await ethers.getContractAt(contractName, proxyDeployment.address);
    return proxyContract;
};

export { deployBeaconProxy };
