/*
  yarn deploy --script deploy-base-contracts.ts
*/

import { Wallet } from 'zksync-web3'
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy'
import { loatArtifact } from '../utils/loadArtifact';
import { convertToUnit } from '../utils/convertToUnit';
import { AddressZero } from '../utils/address-zero';

export default async function (hre: HardhatRuntimeEnvironment, onlyEstimateGas?: boolean, verify?: boolean) {
  console.log(`Running deploy script`)

  // Initialize the wallet.
  const wallet = new Wallet(process.env.PRIVATE_KEY!)
  const deployer = new Deployer(hre, wallet)
  const owner = await wallet.getAddress()

  // Unitroller
  const unitroller_artifact = await loatArtifact(deployer, 'Unitroller', [])

  // Comptroller
  const comptroller_artifact = await loatArtifact(deployer, 'Comptroller', [])

  // ZKFinanceChainlinkOracle
  const chainlinkOracle_artifact = await loatArtifact(deployer, 'ZKFinanceChainlinkOracle', [])

  // JumpRateModelV2
  const jumpRateModelV2_params = [0, convertToUnit("0.12", 18), convertToUnit("2.8", 18), convertToUnit("0.8", 18), owner]
  const jumpRateModelV2_artifact = await loatArtifact(deployer, 'JumpRateModelV2', jumpRateModelV2_params)

  // ZKErc20Delegate
  const zkErc20Delegate_artifact = await loatArtifact(deployer, 'ZKErc20Delegate', [])

  // ZKEther
  const zkEther_artifact = await loatArtifact(deployer, 'ZKEther', [AddressZero(), AddressZero(), 0, "", "", 8, owner])

  // zkFinance Lens
  const zkFinanceLens_artifact = await loatArtifact(deployer, 'ZKFinanceLens', [AddressZero()])

  // zkFinance ZGT token
  const zgt_artifact = await loatArtifact(deployer, 'ZGT', [])

  if (onlyEstimateGas) {
    return
  }

  let comptrollerContract = await deployer.deploy(comptroller_artifact)
  console.log(`${comptroller_artifact.contractName} was deployed to ${comptrollerContract.address}`)

  const unitrollerContract = await deployer.deploy(unitroller_artifact)
  console.log(`${unitroller_artifact.contractName} was deployed to ${unitrollerContract.address}`)

  // Link Comptroller to Unitroller proxy
  let tx = await unitrollerContract._setPendingImplementation(comptrollerContract.address)
  await tx.wait();
  console.log(`${unitroller_artifact.contractName} Pending implementation is set`)

  tx = await comptrollerContract._become(unitrollerContract.address)
  await tx.wait();
  console.log(`${comptroller_artifact.contractName} Become called`)

  const comptrollerAddress = comptrollerContract.address
  comptrollerContract = await deployer.hre.ethers.getContractAt("Comptroller", unitrollerContract.address);

  // set comptroller variables
  tx = await comptrollerContract._setCloseFactor(convertToUnit("0.5", 18))
  await tx.wait()
  console.log("Comptroller close factor was set successfully")

  tx = await comptrollerContract._setLiquidationIncentive(convertToUnit("1.1", 18))
  await tx.wait()
  console.log("Comptroller liquidation incetive was set successfully")

  // ZKFinanceChainlinkOracle
  const chainLinkOracleContract = await deployer.deploy(chainlinkOracle_artifact, [])
  console.log(`${chainlinkOracle_artifact.contractName} was deployed to ${chainLinkOracleContract.address}`)

  // Assign to comptroller
  tx = await comptrollerContract._setPriceOracle(chainLinkOracleContract.address)
  await tx.wait()
  console.log("Comptroller oracle was set successfully")

  // JumpRateModelV2
  const jumpRateModelV2Contract = await deployer.deploy(jumpRateModelV2_artifact, jumpRateModelV2_params)
  console.log(`${jumpRateModelV2_artifact.contractName} was deployed to ${jumpRateModelV2Contract.address}`)

  // ZKErc20Delegate
  const zkErc20DelegateContract = await deployer.deploy(zkErc20Delegate_artifact)
  console.log(`${zkErc20Delegate_artifact.contractName} was deployed to ${zkErc20DelegateContract.address}`)

  // ZKEthers
  const zkEther_params = [comptrollerContract.address, jumpRateModelV2Contract.address, convertToUnit(200000000, 18), "zkFinance Ethereum Token", "zkETH", 8, owner]
  const zkEtherContract = await deployer.deploy(zkEther_artifact, [...zkEther_params])
  console.log(`${zkEther_artifact.contractName} was deployed to ${zkEtherContract.address}`)

  const zgt = await deployer.deploy(zgt_artifact, [])
  console.log(`${zgt_artifact.contractName} was deployed to ${zgt.address}`)

  tx = await chainLinkOracleContract.setDirectPrice(zkEtherContract.address, convertToUnit("1200", 18))
  await tx.wait()
  console.log("Oracle price for ETH was set successfully")

  tx = await comptrollerContract._setCollateralFactor(zkEtherContract.address, convertToUnit("0.75", 18))
  await tx.wait()
  console.log("Collateral factor for ETH was set successfully")

  tx = await zkEtherContract._setReserveFactor(convertToUnit("0.25", 18))
  await tx.wait()
  console.log("Reserve factor for ETH was set successfully")

  tx = await comptrollerContract._setCollateralFactor(zkEtherContract.address, convertToUnit("0.75", 18))
  await tx.wait()
  console.log("Collateral factor for ETH was set successfully")

  tx = await comptrollerContract._setZGTSpeeds([zkEtherContract.address], [convertToUnit("0.00208", 18)], [convertToUnit("0.003", 18)])
  await tx.wait()
  console.log("ZGT speed for ETH was set successfully")

  const zkFinanceLens = await deployer.deploy(zkFinanceLens_artifact, [zgt.address])

  console.log("######################################")
  console.log(`${comptroller_artifact.contractName} was deployed to ${comptrollerContract.address}`)
  console.log(`${jumpRateModelV2_artifact.contractName} was deployed to ${jumpRateModelV2Contract.address}`)
  console.log(`${zkErc20Delegate_artifact.contractName} was deployed to ${zkErc20DelegateContract.address}`)
  console.log(`zkETH was deployed to ${zkEtherContract.address}`)
  console.log(`${zkFinanceLens_artifact.contractName} was deployed to ${zkFinanceLens.address}`)
  console.log(`${zgt.contractName} was deployed to ${zgt.address}`)
  console.log("######################################")

  if (verify) {
    await hre.run("verify:verify", {
      address: unitrollerContract.address,
      constructorArguments: [],
    })
    console.log("Unitroller was verified successfully")

    await hre.run("verify:verify", {
      address: comptrollerAddress,
      constructorArguments: [],
    })
    console.log("Comptroller was verified successfully")

    await hre.run("verify:verify", {
      address: chainLinkOracleContract.address,
      constructorArguments: [],
    })
    console.log("ChainLinkOracle was verified successfully")

    await hre.run("verify:verify", {
      address: jumpRateModelV2Contract.address,
      constructorArguments: [...jumpRateModelV2_params],
    })
    console.log("JumRateModelV2 was verified successfully")

    await hre.run("verify:verify", {
      address: zkErc20DelegateContract.address,
      constructorArguments: [],
    })
    console.log("zkErc20Delegate was verified successfully")

    await hre.run("verify:verify", {
      address: zkEtherContract.address,
      constructorArguments: [...zkEther_params],
    })
    console.log("zkEther was verified successfully")
  }

}