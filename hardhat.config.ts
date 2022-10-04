require('@nomiclabs/hardhat-ethers')
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-truffle5");
require('@matterlabs/hardhat-zksync-solc')
require('@matterlabs/hardhat-zksync-deploy')
require("dotenv").config();


module.exports = {
  zksolc: {
    version: '1.1.6',
    // compilerSource: 'binary',
    compilerSource: 'docker',
    settings: {
      experimental: {
        dockerImage: 'matterlabs/zksolc',
        tag: 'v1.1.6',
      },
    },
  },
  zkSyncDeploy: {
    zkSyncNetwork: "https://zksync2-testnet.zksync.dev",
    ethNetwork: "goerli"
  },
  networks: {
    hardhat: {
      zksync: true
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100
          }
        }
      }
    ],
  },
}
