/*
  yarn deploy --script upgrade-comptroller.ts --network zkSyncTestnet
*/

import { Wallet, Provider, utils } from 'zksync-web3'
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy'
import { loatArtifact } from '../utils/loadArtifact';
import { GetzkSyncSigner } from '../utils/get-zksync-signer';

export default async function (hre: HardhatRuntimeEnvironment, verify?: boolean) {
  console.log(`Running deploy script for upgrading Comptroller`)

  // Initialize the wallet.
  const wallet = new Wallet(process.env.PRIVATE_KEY!)

  // Create deployer object and load the artifact of the contract you want to deploy.
  const deployer = new Deployer(hre, wallet)
  const unitrollerAddress = "0x461ff13694AA20Beb13c90065032956964d87220"
  const unitrollerContract = await deployer.hre.ethers.getContractAt("Unitroller", unitrollerAddress, GetzkSyncSigner(wallet));
  
  const comptroller_artifact = await loatArtifact(deployer, 'Comptroller', [])
  let comptrollerContract = await deployer.deploy(comptroller_artifact)
  console.log(`${comptroller_artifact.contractName} was deployed to ${comptrollerContract.address}`)

  // Link Comptroller to Unitroller proxy
  let tx = await unitrollerContract._setPendingImplementation(comptrollerContract.address)
  await tx.wait();
  console.log(`Unitroller Pending implementation is set`)

  tx = await comptrollerContract._become(unitrollerAddress)
  await tx.wait();
  console.log(`Comptroller Become called`)

  console.log("***Upgrade is done***")
}
