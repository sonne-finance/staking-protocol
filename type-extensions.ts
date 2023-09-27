// If your plugin extends types from another plugin, you should import the plugin here.

// To extend one of Hardhat's types, you need to import the module where it has been defined, and redeclare it.
import 'hardhat/types/config';
import { HttpNetworkConfig } from 'hardhat/types/config';
import 'hardhat/types/runtime';

declare module 'hardhat/types/config' {
    export interface HardhatNetworkForkingUserConfig {
        targetName: string;
    }

    export interface HardhatNetworkForkingConfig {
        targetName: string;
    }

    export interface HttpNetworkUserConfig {
        addressBook?: {
            [key: string]: `0x${string}`;
        };
    }

    export interface HttpNetworkConfig {
        addressBook: {
            [key: string]: `0x${string}`;
        };
    }
}

declare module 'hardhat/types/runtime' {
    interface Network {
        targetName?: string;
        targetConfig?: HttpNetworkConfig;
    }
}
