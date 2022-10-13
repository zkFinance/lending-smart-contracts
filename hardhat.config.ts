require('@nomiclabs/hardhat-ethers')
require("@nomiclabs/hardhat-web3");

import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
require("dotenv").config();

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
    settings: {},
  },
  zkSyncDeploy: {
    zkSyncNetwork: "https://zksync2-testnet.zksync.dev",
    ethNetwork: "goerli"
  },
  networks: {
    hardhat: {
      zksync: true,
      // chainId: 56,
      // forking: {
      //   url: "https://bsc-dataseed.binance.org/",
      // }
    },
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
}
