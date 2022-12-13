require("dotenv").config();

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer"
// import "hardhat-deploy";
import "@nomiclabs/hardhat-truffle5";
import "./tasks/deploy-base-contracts";
import "./tasks/deploy-zkLens";
import "./tasks/send-eth-to-l2";
import "./tasks/deploy-zkToken";
require('@matterlabs/hardhat-zksync-deploy')


// During the development compiling with zksync solc takes very long time.
// solution is to exclute the zksync solc library and just use the 
// solidy compile. 

require('@matterlabs/hardhat-zksync-solc')

module.exports = {
  zksolc: {
    version: '1.2.1',
    compilerSource: 'binary',
    settings: {
      optimizer: {
        enabled: true,
      }
    },
  },
  zkSyncDeploy: {
    zkSyncNetwork: "https://zksync2-testnet.zksync.dev",
    ethNetwork: "goerli"
  },
  networks: {
    hardhat: {
      zksync: true,
      chainId: 5,
      forking: {
        url: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      },
      timeout: 14000000,
      accounts: { mnemonic: process.env.MNEMONIC }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      timeout: 1400000,
      gasPrice: 10000000000,
      accounts: { mnemonic: process.env.MNEMONIC }
    },
    zkSyncTestnet: {
      url: "https://zksync2-testnet.zksync.dev",
      ethNetwork: "goerli", // Can also be the RPC URL of the network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
      zksync: true,
    },
    testnet_goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      chainId: 5,
      accounts: { mnemonic: process.env.MNEMONIC }
    },
  },
  solidity: {
    version: "0.8.17"
  },
  // solidity: {
  //   compilers: [
  //     {
  //       version: "0.8.17",
  //       settings: {
  //         optimizer: {
  //           enabled: true,
  //           runs: 200
  //         },
  //         outputSelection: {
  //           "*": {
  //             "*": ["storageLayout"]
  //           }
  //         }
  //       }
  //     }
  //   ],
  //   overrides: {
  //     "contracts/Governance/ZGT.sol": {
  //       version: "0.8.17",
  //       settings: {
  //         optimizer: {
  //           enabled: true,
  //           runs: 999999,
  //         },
  //         outputSelection: {
  //           "*": {
  //             "*": ["storageLayout"]
  //           }
  //         }
  //       },
  //     },
  //   }
  // },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
}
