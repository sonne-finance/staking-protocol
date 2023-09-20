import * as dotenv from 'dotenv';
dotenv.config();

import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

import '@typechain/hardhat';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-truffle5';
import '@nomicfoundation/hardhat-network-helpers';
import 'hardhat-deploy';

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.19',
        settings: {
            optimizer: {
                enabled: true,
                runs: 1000,
            },
        },
    },
    typechain: {
        outDir: 'src/types',
        target: 'ethers-v6',
        alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
        externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
        dontOverrideCompile: false, // defaults to false
    },
    networks: {
        hardhat: {},
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
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
};

export default config;
