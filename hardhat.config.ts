import * as dotenv from 'dotenv';
dotenv.config();

import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import '@typechain/hardhat';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import { HardhatUserConfig } from 'hardhat/config';

import './extend';

const forking_network = process.env.FORKING_NETWORK?.toLowerCase();
const forking_url = process.env[`${forking_network?.toUpperCase()}_RPC_URL`];
const forking_bn = process.env[`${forking_network?.toUpperCase()}_BLOCK_NUMBER`]
    ? Number(process.env[`${forking_network?.toUpperCase()}_BLOCK_NUMBER`])
    : undefined;

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            forking: {
                enabled: true,
                targetName: forking_network!,
                url: forking_url!,
                blockNumber: forking_bn,
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
                    apiKey: process.env.OPTIMISM_ETHERSCAN_KEY,
                },
            },
            addressBook: {
                comptroller: '0x60cf091cd3f50420d50fd7f707414d0df4751c58',
                usdcWhale: '0xf89d7b9c864f589bbf53a82105107622b35eaa40',
                veloWhale: '0xdf90c9b995a3b10a5b8570a47101e6c6a29eb945',
            },
            timeout: 100000,
        },
        base: {
            chainId: 8453,
            url: process.env.BASE_RPC_URL!,
            //ovm: true,
            accounts: [process.env.BASE_DEPLOYER_KEY!],
            verify: {
                etherscan: {
                    apiUrl: 'https://api.basescan.org',
                    apiKey: process.env.BASE_ETHERSCAN_KEY,
                },
            },
            addressBook: {
                comptroller: '0x1DB2466d9F5e10D7090E7152B68d62703a2245F0',
                usdcWhale: '0x20fe51a9229eef2cf8ad9e89d91cab9312cf3b7a',
                aeroWhale: '0xebf418fe2512e7e6bd9b87a8f0f294acdc67e6b4',
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
