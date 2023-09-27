import { extendConfig, extendEnvironment } from 'hardhat/config';
import { lazyObject } from 'hardhat/plugins';

import {
    HardhatConfig,
    HardhatNetworkConfig,
    HardhatNetworkUserConfig,
    HardhatUserConfig,
    HttpNetworkConfig,
    HttpNetworkUserConfig,
} from 'hardhat/types';

import './type-extensions';

extendConfig((config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    if (userConfig.networks) {
        for (const [k, v] of Object.entries(userConfig.networks)) {
            const hardhatNetwork = v as HardhatNetworkUserConfig;

            // set target to hardhat network
            if (k === 'hardhat' && config.networks.hardhat.forking && hardhatNetwork.forking) {
                config.networks.hardhat.forking.targetName = hardhatNetwork.forking.targetName;
            }

            // set addressBook to config
            if (k !== 'hardhat' && k !== 'localhost') {
                const network = v as HttpNetworkUserConfig;
                (config.networks[k] as HttpNetworkConfig).addressBook = network.addressBook ?? {};
            }
        }
    }
});

extendEnvironment((hre) => {
    if (hre.network.name === 'hardhat') {
        const hardhatNetworkConfig = hre.network.config as HardhatNetworkUserConfig;
        if (hardhatNetworkConfig.forking) {
            const targetName = hardhatNetworkConfig.forking.targetName;

            hre.network.targetName = targetName;
            hre.network.targetConfig = lazyObject(() => hre.config.networks[targetName] as HttpNetworkConfig);
        }
    }
});
