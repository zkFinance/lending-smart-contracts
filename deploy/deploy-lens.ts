/*
  yarn deploy --script deploy-lens.ts
*/

import { Wallet } from 'zksync-web3'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy'

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the zkFinance Lens`)

  // Initialize the wallet.
  const wallet = new Wallet(process.env.PRIVATE_KEY!)
  const deployer = new Deployer(hre, wallet)

  const artifactZKFinanceLens = await deployer.loadArtifact('ZKFinanceLens')
  const zkFinanceLens = await deployer.deploy(artifactZKFinanceLens, [])
  const zkFinanceLensAddress = zkFinanceLens.address

  console.log(`${artifactZKFinanceLens.contractName} was deployed to ${zkFinanceLensAddress}`)
}
