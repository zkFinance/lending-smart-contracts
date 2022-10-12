/*
  yarn deploy --script deploy-lens.ts
*/

import { Wallet, Provider, utils } from 'zksync-web3'
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy'

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the zkFinance Lens`)

  // Initialize the wallet.
  const wallet = new Wallet(process.env.PRIVATE_KEY!)

  // Create deployer object and load the artifact of the contract you want to deploy.
  const deployer = new Deployer(hre, wallet)
  const zkFinanceLens_artifact = await deployer.loadArtifact('ZKFinanceLens')

    // Estimate contract deployment fee
  const deploymentFee = await deployer.estimateDeployFee(zkFinanceLens_artifact, []);

  // Deposit funds to L2
  const depositHandle = await deployer.zkWallet.deposit({
    to: deployer.zkWallet.address,
    token: utils.ETH_ADDRESS,
    amount: deploymentFee.mul(0.01),
  });

  // Wait until the deposit is processed on zkSync
  await depositHandle.wait();

  const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
  console.log(`The deployment is estimated to cost ${parsedFee} ETH`);

  const zkFinanceLens = await deployer.deploy(zkFinanceLens_artifact, [])
  const zkFinanceLensAddress = zkFinanceLens.address

  console.log(`${zkFinanceLens_artifact.contractName} was deployed to ${zkFinanceLensAddress}`)
}
