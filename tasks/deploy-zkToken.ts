import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { HardhatUserConfig, task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { hrtime } from "process";
import { utils, Wallet } from 'zksync-web3'

/*
    npx hardhat deploy-zkToken --network hardhat \
      --unitroller 0xA65722af4957CeF481Edb4cB255f804DD36E8aDc \
      --interest-rate-model 0x0057Fe240DA4100Dea2315031A93A0dd8D402388 \
      --delegate 0xD9AfD196b572bDE92f1B524cE0BA52b058001158 \
      --underlying-address 0x332730a4F6E03D9C55829435f10360E13cfA41Ff \
      --name 'zkFinance BUSD Token' \
      --symbol 'zkBUSD' \
      --reserve-factor '0.10' \
      --collateral-factor '0.80' \
      --underlying-decimals 18 \
      --zgt-supply-speed '0.0001' \
      --zgt-borrow-speed '0.0001' \
      --verify true
*/

task("deploy-zkToken", "Deploy a zkToken")
  .addParam("unitroller")
  .addParam("interestRateModel")
  .addParam("delegate")
  .addParam("underlyingAddress")
  .addParam("name")
  .addParam("symbol")
  .addParam("reserveFactor")
  .addParam("collateralFactor")
  .addParam("zgtSupplySpeed")
  .addParam("zgtBorrowSpeed")
  .addParam("underlyingDecimals")
  .addParam("verify", "", false, types.boolean)
  .setAction(async args => {
    const exchangeRate = "200000000".padEnd(Number(args.underlyingDecimals) + 9, "0")

    // Initialize the wallet.
    const wallet = new Wallet(process.env.PRIVATE_KEY!)
    const deployer = new Deployer(hre, wallet)
    const owner = await wallet.getAddress()

    const params = [args.underlyingAddress, args.unitroller, args.interestRateModel, exchangeRate, args.name, args.symbol, 8, owner, args.delegate, "0x"]
    const zkErc20Delegator_artifact = await deployer.loadArtifact('ZKErc20Delegator')
    let deploymentFee = await deployer.estimateDeployFee(zkErc20Delegator_artifact, [
      ...params
    ]);

    // console.log(`The ${args.symbol} deployment is estimated to cost ${ethers.utils.formatEther(deploymentFee.toString())} ETH`);
    // const zkErc20DelegatorContract = await deployer.deploy(zkErc20Delegator_artifact, [...params])
    // console.log(`${zkErc20Delegator_artifact.contractName} was deployed to ${zkErc20DelegatorContract.address}`)

    // let tx = await zkErc20DelegatorContract._setReserveFactor(parseEther(args.reserveFactor))
    // await tx.wait()

    // const comptroller = await deployer.hre.ethers.getContractAt("Comptroller", args.unitroller);
    // tx = await comptroller.functions._become(unitrollerContract.address)
    // await tx.wait();
  });