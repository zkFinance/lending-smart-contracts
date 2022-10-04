/*
  yarn deploy --script deploy.ts
*/

import { Wallet } from 'zksync-web3'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy'

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script`)

  // Initialize the wallet.
  const wallet = new Wallet(process.env.PRIVATE_KEY!)
  const deployer = new Deployer(hre, wallet)
  const owner = await wallet.getAddress()

  // Comptroller
  const artifactComptroller = await deployer.loadArtifact('Comptroller')
  const comptrollerContract = await deployer.deploy(artifactComptroller)
  console.log(`${artifactComptroller.contractName} was deployed to ${comptrollerContract.address}`)

  // Unitroller
  const artifactUnitroller = await deployer.loadArtifact('Unitroller')
  const unitrollerContract = await deployer.deploy(artifactUnitroller)
  console.log(`${artifactUnitroller.contractName} was deployed to ${unitrollerContract.address}`)

  // Link Comptroller to Unitroller proxy
  let tx = await unitrollerContract._setPendingImplementation(comptrollerContract.address)
  await tx.wait();
  console.log(`${artifactUnitroller.contractName} Pending implementation is set`)

  tx = await comptrollerContract._become(unitrollerContract.address)
  await tx.wait();
  console.log(`${artifactComptroller.contractName} Become called`)

  // JumpRateModelV2
  const artifactJumpRateModelV2 = await deployer.loadArtifact('JumpRateModelV2')
  const jumpRateModelV2Contract = await deployer.deploy(artifactJumpRateModelV2, [
    0,
    '40000000000000000',
    '1090000000000000000',
    '800000000000000000',
    owner,
  ])
  console.log(`${artifactJumpRateModelV2.contractName} was deployed to ${jumpRateModelV2Contract.address}`)

  // ZKErc20Delegate
  const artifactZKErc20Delegate = await deployer.loadArtifact('ZKErc20Delegate')
  const zkErc20DelegateContract = await deployer.deploy(artifactZKErc20Delegate)
  console.log(`${artifactZKErc20Delegate.contractName} was deployed to ${zkErc20DelegateContract.address}`)
}