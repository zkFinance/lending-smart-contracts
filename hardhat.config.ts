require("dotenv").config();
require('@matterlabs/hardhat-zksync-deploy')
require('@matterlabs/hardhat-zksync-solc')

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer"
import "@nomiclabs/hardhat-truffle5";
import "./tasks/deploy-base-contracts";
import "./tasks/deploy-zkLens";
import "./tasks/send-eth-to-l2";
import "./tasks/deploy-zkToken";

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
    zkTestnet: {
      url: "https://zksync2-testnet.zksync.dev",
      ethNetwork: "goerli", // URL of the Ethereum Web3 RPC, or the identifier of the network (e.g. `mainnet` or `goerli`)
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
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  }
}
