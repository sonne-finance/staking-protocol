import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { Contract } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { getImpersonatedSigner } from './_utils';
import { createSnaptshot } from './op/createSnapshot';
import { getProofForUserShares } from './op/getProofForUserShares';

export type ManagerFixtureOutput = {
    owner: SignerWithAddress;
    rewardManager: Contract;
    reserveManager: Contract;
    sSonne: Contract;
    uSonne: Contract;
    sonne: Contract;
    usdc: Contract;
    velo: Contract;
    comptroller: Contract;
};
const managerFixture = deployments.createFixture<ManagerFixtureOutput, any>(
    async ({ deployments, network }, options) => {
        const [deployer] = await ethers.getSigners();

        await deployments.fixture(undefined, {
            keepExistingDeployments: true,
        });

        const addressBook = network.targetConfig?.addressBook;
        if (!addressBook) throw new Error('Need to define addressBook on forking network config');

        // Reward Manager
        const rewardManager = await ethers.getContract('RewardManager');

        const sSonneAddress = await rewardManager.sSonne();
        const sSonne = await ethers.getContractAt('StakedDistributor', sSonneAddress);

        const uSonneAddress = await rewardManager.uSonne();
        const uSonne = await ethers.getContractAt('StakedDistributor', uSonneAddress);

        const sonneAddress = await rewardManager.sonne();
        const sonne = await ethers.getContractAt('IERC20', sonneAddress);

        const usdcAddress = await rewardManager.usdc();
        const usdc = await ethers.getContractAt('IERC20', usdcAddress);

        const veloAddress = await rewardManager.velo();
        const velo = await ethers.getContractAt('IERC20', veloAddress);

        // impersonate whale and transfer tokens to owner
        const usdcWhaleAddress = addressBook.usdcWhale;
        const veloWhaleAddress = addressBook.veloWhale;
        const [usdcWhale, veloWhale] = await Promise.all([
            getImpersonatedSigner(usdcWhaleAddress),
            getImpersonatedSigner(veloWhaleAddress),
        ]);

        // transfer tokens to owner
        await Promise.all([
            usdc.connect(usdcWhale).transfer(deployer.address, await usdc.balanceOf(usdcWhaleAddress)),
            velo.connect(veloWhale).transfer(deployer.address, await velo.balanceOf(veloWhaleAddress)),
        ]);

        // Reserve Manager
        const reserveManager = await ethers.getContract('ReserveManager');

        /* Sonne Timelock */
        const sonneTimelockAddress = await reserveManager.sonneTimelock();
        const sonneTimelock = await ethers.getContractAt('ISonneTimelock', sonneTimelockAddress);
        const sonneTimelockSigner = await getImpersonatedSigner(sonneTimelockAddress);
        const sonneAdminSigner = await getImpersonatedSigner('0xfb59ce8986943163f14c590755b29db2998f2322');
        // grant reserve role on timelock
        const reservesRole = await sonneTimelock.RESERVES_ROLE();
        await sonneTimelock.connect(sonneAdminSigner).grantRole(reservesRole, reserveManager);

        // add distributor role to deployer
        const distributorRole = await reserveManager.DISTRIBUTOR_ROLE();
        await reserveManager.grantRole(distributorRole, deployer.address);

        // set timelock as markets admin
        const comptrollerAddress = addressBook.comptroller;
        const comptroller = await ethers.getContractAt('IComptroller', comptrollerAddress);
        const marketAddresses: string[] = await comptroller.getAllMarkets();
        await Promise.all(
            marketAddresses.map(async (addr) => {
                const market = await ethers.getContractAt('IMarket', addr);
                const admin = await market.admin();
                const adminSigner = await getImpersonatedSigner(admin);
                await market.connect(adminSigner)._setPendingAdmin(sonneTimelockAddress);
                await market.connect(sonneTimelockSigner)._acceptAdmin();
            }),
        );

        return {
            owner: deployer,
            rewardManager,
            reserveManager,
            sSonne,
            uSonne,
            sonne,
            usdc,
            velo,
            comptroller,
        };
    },
);

export type BaseManagerFixtureOutput = {
    deployer: SignerWithAddress;
    rewardManager: Contract;
    reserveManager: Contract;
    sSonneDistributor: Contract;
    uUsdcDistributor: Contract;
    sAeroDistributor: Contract;
    uAeroDistributor: Contract;
    sonne: Contract;
    usdc: Contract;
    aero: Contract;
    comptroller: Contract;
};
const baseManagerFixture = deployments.createFixture<BaseManagerFixtureOutput, any>(
    async ({ deployments, network }, options) => {
        const [deployer] = await ethers.getSigners();

        await deployments.fixture(undefined, {
            keepExistingDeployments: true,
        });

        const addressBook = network.targetConfig?.addressBook;
        if (!addressBook) throw new Error('Need to define addressBook on forking network config');

        // Reward Manager
        const rewardManager = await ethers.getContract('BaseRewardManager');
        const rewardManagerAddress = await rewardManager.getAddress();

        const owner = '0xfb59ce8986943163f14c590755b29db2998f2322';
        const MANAGER_ROLE = '0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08';
        const FUNDS_ROLE = '0x7840a44bf6bbc1b45786ad46ece0694a9179b33e609d4ac4a51e6466e1f664c2';

        const sSonneDistributorAddress = await rewardManager.sSonneDistributor();
        const sSonneDistributor = await ethers.getContractAt('ISonneMerkleDistributor', sSonneDistributorAddress);

        const uUsdcDistributorAddress = await rewardManager.uUsdcDistributor();
        const uUsdcDistributor = await ethers.getContractAt('ISonneMerkleDistributor', uUsdcDistributorAddress);

        const sAeroDistributorAddress = await rewardManager.sAeroDistributor();
        const sAeroDistributor = await ethers.getContractAt('ISonneMerkleDistributor', sAeroDistributorAddress);

        const uAeroDistributorAddress = await rewardManager.uAeroDistributor();
        const uAeroDistributor = await ethers.getContractAt('ISonneMerkleDistributor', uAeroDistributorAddress);

        for (const distributor of [sSonneDistributor, uUsdcDistributor, sAeroDistributor, uAeroDistributor]) {
            await distributor.connect(await getImpersonatedSigner(owner)).grantRole(MANAGER_ROLE, rewardManagerAddress);
            await distributor.connect(await getImpersonatedSigner(owner)).grantRole(FUNDS_ROLE, rewardManagerAddress);
        }

        const sonneAddress = await rewardManager.sonne();
        const sonne = await ethers.getContractAt('IERC20', sonneAddress);

        const usdcAddress = await rewardManager.usdc();
        const usdc = await ethers.getContractAt('IERC20', usdcAddress);

        const aeroAddress = await rewardManager.aero();
        const aero = await ethers.getContractAt('IERC20', aeroAddress);

        // impersonate whale and transfer tokens to owner
        const usdcWhaleAddress = addressBook.usdcWhale;
        const aeroWhaleAddress = addressBook.aeroWhale;
        const [usdcWhale, veloWhale] = await Promise.all([
            getImpersonatedSigner(usdcWhaleAddress),
            getImpersonatedSigner(aeroWhaleAddress),
        ]);

        // transfer tokens to owner
        await Promise.all([
            usdc.connect(usdcWhale).transfer(deployer.address, await usdc.balanceOf(usdcWhaleAddress)),
            aero.connect(veloWhale).transfer(deployer.address, await aero.balanceOf(aeroWhaleAddress)),
        ]);

        // Reserve Manager
        /*const reserveManager = await ethers.getContract('BaseReserveManager');

        // Sonne Timelock //
        const sonneTimelockAddress = await reserveManager.sonneTimelock();
        const sonneTimelock = await ethers.getContractAt('ISonneTimelock', sonneTimelockAddress);
        const sonneTimelockSigner = await getImpersonatedSigner(sonneTimelockAddress);
        const sonneAdminSigner = await getImpersonatedSigner('0xfb59ce8986943163f14c590755b29db2998f2322');
        // grant reserve role on timelock
        const reservesRole = await sonneTimelock.RESERVES_ROLE();
        await sonneTimelock.connect(sonneAdminSigner).grantRole(reservesRole, reserveManager);

        // add distributor role to deployer
        const distributorRole = await reserveManager.DISTRIBUTOR_ROLE();
        await reserveManager.grantRole(distributorRole, deployer.address);

        // set timelock as markets admin
        const comptrollerAddress = addressBook.comptroller;
        const comptroller = await ethers.getContractAt('IComptroller', comptrollerAddress);
        const marketAddresses: string[] = await comptroller.getAllMarkets();
        await Promise.all(
            marketAddresses.map(async (addr) => {
                const market = await ethers.getContractAt('IMarket', addr);
                const admin = await market.admin();
                const adminSigner = await getImpersonatedSigner(admin);
                await market.connect(adminSigner)._setPendingAdmin(sonneTimelockAddress);
                await market.connect(sonneTimelockSigner)._acceptAdmin();
            }),
        );*/

        return {
            deployer,
            rewardManager,
            reserveManager: undefined,
            sSonneDistributor,
            uUsdcDistributor,
            sAeroDistributor,
            uAeroDistributor,
            sonne,
            usdc,
            aero,
            comptroller: undefined,
        };
    },
);

export { managerFixture, baseManagerFixture };
