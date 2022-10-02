import { Wallet } from 'zksync-web3'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy'
import fs from 'fs'

const PRIVATE_KEY: string = fs.readFileSync('.secret').toString()

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the zkFinance Lens`)

  // Initialize the wallet.
  const wallet = new Wallet(PRIVATE_KEY)
  const deployer = new Deployer(hre, wallet)
  const owner = await wallet.getAddress()

  // Comp
  const artifactZKFinanceLens = await deployer.loadArtifact('ZGT')
  const zkFinanceLens = await deployer.deploy(artifactZKFinanceLens, [])
  const zkFinanceLensAddress = zkFinanceLens.address

  console.log(`${artifactZKFinanceLens.contractName} was deployed to ${zkFinanceLensAddress}`)
}
