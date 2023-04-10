import * as dotenv from 'dotenv';
dotenv.config();

import '@nomicfoundation/hardhat-network-helpers';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-deploy';
import { HardhatUserConfig } from 'hardhat/config';
import 'solidity-coverage';

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            chainId: 10,
            companionNetworks: {
                mainnet: process.env.FORKING_NETWORK?.toLowerCase()!,
            },
            forking: {
                enabled: true,
                url: process.env[`${process.env.FORKING_NETWORK?.toUpperCase()}_RPC_URL`]!,
            },
            autoImpersonate: true,
            gasPrice: 1000000000,
        },
        optimism: {
            url: process.env.OPTIMISM_RPC_URL,
            accounts: [process.env.OPTIMISM_DEPLOYER_KEY!, process.env.OPTIMISM_RESERVES_MANAGER_KEY!],
            verify: {
                etherscan: {
                    apiUrl: 'https://api-optimistic.etherscan.io',
                    apiKey: process.env.ETHERSCAN_API_KEY,
                },
            },
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    solidity: {
        compilers: [
            {
                version: '0.8.10',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
};

export default config;
