require('@nomiclabs/hardhat-ethers')
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-truffle5");
require('@matterlabs/hardhat-zksync-deploy')
require("dotenv").config();

if (process.env.DEPLOY === 'true') {
  require('@matterlabs/hardhat-zksync-solc')
}

module.exports = {
  zksolc: {
    version: '1.1.5',
    compilerSource: 'docker',
    settings: {
      optimizer: {
        enabled: true,
      },
      experimental: {
        dockerImage: 'matterlabs/zksolc',
        tag: 'v1.1.5',
      },
    },
  },
  zkSyncDeploy: {
    zkSyncNetwork: 'https://zksync2-testnet.zksync.dev',
    ethNetwork: 'goerli', // Can also be the RPC URL of the network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
  },
  networks: {
    hardhat: {
      chainId: 56,
      forking: {
        url: process.env.ARCHIVE_NODE,
      },
      timeout: 1400000,
      accounts: { mnemonic: process.env.DEPLOYER_MNEMONIC }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      timeout: 1400000,
      gasPrice: 10000000000,
      accounts: { mnemonic: process.env.DEPLOYER_MNEMONIC }
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ],
  },
}
