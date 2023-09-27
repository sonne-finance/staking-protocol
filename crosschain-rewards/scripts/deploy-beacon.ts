import { upgrades } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import beaconArtifact from '@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol/UpgradeableBeacon.json';

const deployBeacon = async (
    contract: string,
    {
        artifacts,
        getNamedAccounts,
        deployments: { get, save, log, getExtendedArtifact, getOrNull },
        ethers,
        network,
    }: HardhatRuntimeEnvironment,
) => {
    const contractFactory = await ethers.getContractFactory(contract);
    const contractArtifact = await getExtendedArtifact(contract);

    const contractName = contract.indexOf(':') > -1 ? contract.split(':')[1] : contract;
    const beaconDeploymentKey = `${contractName}_Beacon`;
    const implementationDeploymentKey = `${contractName}_Implementation`;

    const existingBeacon = await getOrNull(beaconDeploymentKey);
    if (existingBeacon) {
        // beacon exist
        const beacon = await ethers.getContractAtFromArtifact(beaconArtifact, existingBeacon.address);
        const existingImplementation = await getOrNull(implementationDeploymentKey);
        if (existingImplementation?.bytecode == contractArtifact.bytecode) {
            // beacon exists, implementation not changed; don't do anything
            log(
                `No need to update beacon at ${existingBeacon.address} with implementation ${existingImplementation.address}`,
            );

            return beacon;
        } else {
            // beacon exists, implementation changed; upgrade implementation
            await upgrades.upgradeBeacon(existingBeacon.address, contractFactory);
            const newImplementationAddress = await beacon.implementation();
            log(
                `Beacon upgraded for ${contractName} at ${existingBeacon.address} with implementation ${newImplementationAddress}`,
            );

            await save(implementationDeploymentKey, {
                address: newImplementationAddress,
                ...contractArtifact,
            });
        }
    } else {
        const beacon = await upgrades.deployBeacon(contractFactory);
        await beacon.waitForDeployment();
        const newBeaconAddress = await beacon.getAddress();
        const newImplementationAddress = await beacon.implementation();
        log(
            `Beacon deployed deployed for ${contractName} at ${newBeaconAddress} with implementation ${newImplementationAddress}`,
        );

        await save(beaconDeploymentKey, {
            address: newBeaconAddress,
            ...beaconArtifact,
        });

        await save(implementationDeploymentKey, {
            address: newImplementationAddress,
            ...contractArtifact,
        });
    }

    const beaconDeployment = await get(beaconDeploymentKey);
    const beaconContract = await ethers.getContractAtFromArtifact(beaconArtifact, beaconDeployment.address);
    return beaconContract;
};

export { deployBeacon };
