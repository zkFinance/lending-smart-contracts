import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { HardhatUserConfig, task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { hrtime } from "process";
import { utils, Wallet } from 'zksync-web3'
import { convertToUnit } from "../utils/convertToUnit";

/*
    npx hardhat send-eth-to-l2 --network zkTestnet
*/

task("send-eth-to-l2", "Deploy a zkToken")
  .setAction(async args => {
    const exchangeRate = "200000000".padEnd(Number(args.underlyingDecimals) + 9, "0")

    // Initialize the wallet.
    const wallet = new Wallet(process.env.PRIVATE_KEY!)
    const deployer = new Deployer(hre, wallet)
    const owner = await wallet.getAddress()

  
    console.log("L1 balance", (await deployer.zkWallet.getBalanceL1()).toString())
    console.log("L2 balance", (await deployer.zkWallet.getBalance()).toString())

    // Deposit funds to L2
    const depositHandle = await deployer.zkWallet.deposit({
      to: deployer.zkWallet.address,
      token: utils.ETH_ADDRESS,
      amount: convertToUnit("0.5", 18),
    });

    // Wait until the deposit is processed on zkSync
    await depositHandle.wait();

  });