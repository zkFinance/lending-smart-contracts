import { Wallet } from 'zksync-web3'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy'
import fs from 'fs'

const PRIVATE_KEY: string = fs.readFileSync('.secret').toString()

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the zkFinance Protocool`)

  // Initialize the wallet.
  const wallet = new Wallet(PRIVATE_KEY)
  const deployer = new Deployer(hre, wallet)
  const owner = await wallet.getAddress()

  // Comp
  const artifactComp = await deployer.loadArtifact('Comp')
  const compContract = await deployer.deploy(artifactComp, [owner])
  const compAddress = compContract.address

  console.log(`${artifactComp.contractName} was deployed to ${compAddress}`)

  // Comptroller
  const artifactComptroller = await deployer.loadArtifact('Comptroller')
  const comptrollerContract = await deployer.deploy(artifactComptroller)
  const comptrollerAddress = comptrollerContract.address

  console.log(`${artifactComptroller.contractName} was deployed to ${comptrollerAddress}`)

  // Unitroller
  const artifactUnitroller = await deployer.loadArtifact('Unitroller')
  const unitrollerContract = await deployer.deploy(artifactComptroller)
  const unitrollerAddress = unitrollerContract.address

  console.log(`${artifactUnitroller.contractName} was deployed to ${unitrollerAddress}`)

  // JumpRateModelV2
  const artifactJumpRateModelV2 = await deployer.loadArtifact('JumpRateModelV2')
  const jumpRateModelV2Contract = await deployer.deploy(artifactJumpRateModelV2, [
    0,
    '40000000000000000',
    '1090000000000000000',
    '800000000000000000',
    owner,
  ])
  const jumpRateModelV2Address = jumpRateModelV2Contract.address

  console.log(`${artifactJumpRateModelV2.contractName} was deployed to ${jumpRateModelV2Address}`)

  // CErc20Delegate
  const artifactCErc20Delegate = await deployer.loadArtifact('CErc20Delegate')
  const cErc20DelegateContract = await deployer.deploy(artifactCErc20Delegate)
  const cErc20DelegateContractAddress = cErc20DelegateContract.address

  console.log(
    `${artifactCErc20Delegate.contractName} was deployed to ${cErc20DelegateContractAddress}`
  )
}
