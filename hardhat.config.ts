require("dotenv").config();

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer"
import "hardhat-deploy";
import "./tasks/deploy-base-contracts";
import "./tasks/deploy-zkLens";
import "./tasks/send-eth-to-l2";
import "./tasks/deploy-zkToken";


// During the development compiling with zksync solc takes very long time.
// solution is to exclute the zksync solc library and just use the 
// solidy compile. 
if (process.env.NODE_ENV !== 'sim-compile' && process.env.NODE_ENV !== 'test') {
  require('@matterlabs/hardhat-zksync-solc')
  require('@matterlabs/hardhat-zksync-deploy')
}

module.exports = {
  zksolc: {
    version: '1.2.0',
    compilerSource: 'binary',
    // compilerSource: "docker",
    settings: {
      optimizer: {
        enabled: true,
      },
      // experimental: {
      //   dockerImage: "matterlabs/zksolc",
      //   tag: "v1.2.0"
      // }
    },
  },
  zkSyncDeploy: {
    zkSyncNetwork: "https://zksync2-testnet.zksync.dev",
    ethNetwork: "goerli"
  },
  networks: {
    hardhat: {
      zksync: true
    },
    // test: {
    //   url: "https://bsc-dataseed.binance.org/",
    //   chainId: 56,
    //   accounts: { mnemonic: process.env.MNEMONIC }
    // }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
}
