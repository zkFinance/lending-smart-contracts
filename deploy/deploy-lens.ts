/*
  yarn deploy --script deploy-lens.ts
*/

import { Wallet, Provider, utils } from 'zksync-web3'
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy'
import { loatArtifact } from '../utils/loadArtifact';

export default async function (hre: HardhatRuntimeEnvironment, onlyEstimateGas?: boolean, verify?: boolean) {
  console.log(`Running deploy script for the zkFinance Lens`)

  // Initialize the wallet.
  const wallet = new Wallet(process.env.PRIVATE_KEY!)

  // Create deployer object and load the artifact of the contract you want to deploy.
  const deployer = new Deployer(hre, wallet)
  const zkFinanceLens_artifact = await loatArtifact(deployer, 'ZKFinanceLens', [])

  if (!onlyEstimateGas) {
    const zkFinanceLens = await deployer.deploy(zkFinanceLens_artifact, [])
    console.log(`${zkFinanceLens_artifact.contractName} was deployed to ${zkFinanceLens.address}`)
  }
}
