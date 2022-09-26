/*
  npx hardhat run simulations/simulate-full-deployment.ts --network hardhat
*/

const { expect, web3 } = require("hardhat");
const { deploy, reset, getContractAt, impersonate } = require("../utils/misc");
const { calculateExchangeRate } = require("../utils/exchangeRate");

async function sim() {
    await hre.run("compile");

    const [admin] = await ethers.getSigners();
    await impersonate(admin.address);

    let tx;

    // Depoly ZGT token
    let zgt = await deploy("ZGT", admin.address).send({ from: admin.address });
    console.log("ZGT address", zgt._address);

    // Deploy Comptroller and Unitroller
    let comptroller = await deploy("Comptroller").send({ from: admin.address });
    let unitroller = await deploy("Unitroller").send({ from: admin.address });

    // Link Comptroller to Unitroller proxy
    await unitroller.methods._setPendingImplementation(comptroller._address).send({ from: admin.address })
    await comptroller.methods._become(unitroller._address).send({ from: admin.address })
    comptroller = getContractAt('Comptroller', unitroller._address);

    // Set close factor to 0.5%
    await comptroller.methods._setCloseFactor(ethers.utils.parseEther("0.5")).send({ from: admin.address })

    // Set liquidation incentive to 10%
    await comptroller.methods._setLiquidationIncentive(ethers.utils.parseEther("1.1")).send({ from: admin.address })

    // Deploy oracle and set it in Comptroller
    const oracle = await deploy("ZKFinanceChainlinkOracle").send({ from: admin.address });
    await comptroller.methods._setPriceOracle(oracle._address).send({ from: admin.address })

    // Deploy JumpRateModelV2
    const jumpRateModelV2 = await deploy("JumpRateModelV2", ethers.utils.parseEther("0"), ethers.utils.parseEther("0.12"), ethers.utils.parseEther("2.8"), ethers.utils.parseEther("0.8"), admin.address).send({ from: admin.address });

    // Deploy ZKErc20Delegate
    const zkErc20Delegate = await deploy("ZKErc20Delegate").send({ from: admin.address });

    // Deploy USDC
    let underlyingAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
    let exchangeRate = calculateExchangeRate(18)
    let name = "zkFinance USDC Token"
    let symbol = 'zkUSDC'

    const zkUSDC = await deploy("ZKErc20Delegator", underlyingAddress, comptroller._address, jumpRateModelV2._address, exchangeRate, name, symbol, 8, admin.address, zkErc20Delegate, "0x").send({ from: admin.address });

}

sim()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
