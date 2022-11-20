/*
  npx hardhat run simulations/simulate-full-deployment.js --network localhost
*/

const { expect, web3 } = require("hardhat");
const { deploy, reset, getContractAt, impersonate } = require("../utils/misc");
const { calculateExchangeRate } = require("../utils/exchangeRate");

async function sim() {
    await hre.run("compile");

    const [admin] = await ethers.getSigners();
    // await impersonate(admin.address);
    let tx;
    d = getContractAt('ZKEther', "0x2B40Cd18218f6f4DbC88eB0C31522df68a3f9F22");
    console.log(await d.methods.interestRateModel().call())
    
    //zkToken = await deploy("ZKEther", comptroller._address, jumpRateModelV2._address, exchangeRate, name, symbol, 8, admin.address).send({ from: admin.address });
    await hre.run("verify:verify", {
        address: "0x2B40Cd18218f6f4DbC88eB0C31522df68a3f9F22",
        constructorArguments: ["0x0434Bdb3fA1f329b3fa18fc13B5F379434015d88", "0x0Ff15fb7169D864C3de3Ec070C7Aa8Fc415A4d08", calculateExchangeRate(18), 'zkFinance ETH Token', 'zkETH', 8, admin.address]
    })

    return
    // Depoly ZGT token
    let zgt = await deploy("ZGT", admin.address).send({ from: admin.address });
    console.log(`***Deployed ZGT token to ${zgt._address}`);

    // Depoly zkFinance Lens
    let zkFinanceLens = await deploy("ZKFinanceLens", zgt._address).send({ from: admin.address });
    console.log(`***Deployed zkFinance Lens to ${zkFinanceLens._address}`);

    // Deploy Comptroller and Unitroller
    let comptroller = await deploy("Comptroller").send({ from: admin.address });
    let unitroller = await deploy("Unitroller").send({ from: admin.address });

    console.log(`***Deployed Unitroller contract to ${unitroller._address}`);

    // Link Comptroller to Unitroller proxy
    await unitroller.methods._setPendingImplementation(comptroller._address).send({ from: admin.address })
    await comptroller.methods._become(unitroller._address).send({ from: admin.address })
    comptroller = getContractAt('Comptroller', unitroller._address);

    // Set close factor to 0.5%
    await comptroller.methods._setCloseFactor(ethers.utils.parseEther("0.5")).send({ from: admin.address })
    // Set liquidation incentive to 10%
    await comptroller.methods._setLiquidationIncentive(ethers.utils.parseEther("1.1")).send({ from: admin.address })

    let comoptrollerLens = await deploy("ComptrollerLens").send({ from: admin.address });

    // Set the comptroller lens
    await comptroller.methods._setComptrollerLens(comoptrollerLens._address).send({ from: admin.address })

    // Deploy oracle and set it in Comptroller
    const oracle = await deploy("ZKFinanceChainlinkOracle").send({ from: admin.address });
    await comptroller.methods._setPriceOracle(oracle._address).send({ from: admin.address })

    // Deploy JumpRateModelV2
    const jumpRateModelV2 = await deploy("JumpRateModelV2", ethers.utils.parseEther("0"), ethers.utils.parseEther("0.12"), ethers.utils.parseEther("2.8"), ethers.utils.parseEther("0.8"), admin.address).send({ from: admin.address });

    // Deploy ZKErc20Delegate
    const zkErc20Delegate = await deploy("ZKErc20Delegate").send({ from: admin.address });

    // Deploy ZKEther
    let underlyingSymbol = "ETH"
    let underlyingAddress = ""
    let exchangeRate = calculateExchangeRate(18)
    let name = "zkFinance ETH Token"
    let symbol = 'zkETH'
    let oracleFeed = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"
    let reserveFactor = ethers.utils.parseEther("0.25")
    let collateralFactor = ethers.utils.parseEther("0.75")
    let supplierSpeed = ethers.utils.parseEther("0.1")
    let borrowerSpeed = ethers.utils.parseEther("0.02")
    await deployToken(true, underlyingSymbol, underlyingAddress, comptroller, jumpRateModelV2, oracle, zkErc20Delegate, exchangeRate, name, symbol, oracleFeed, reserveFactor, collateralFactor, supplierSpeed, borrowerSpeed, admin)

    // Deploy USDC
    underlyingSymbol = "USDC"
    underlyingAddress = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"
    exchangeRate = calculateExchangeRate(18)
    name = "zkFinance USDC Token"
    symbol = 'zkUSDC'
    oracleFeed = "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7"
    reserveFactor = ethers.utils.parseEther("0.10")
    collateralFactor = ethers.utils.parseEther("0.80")
    supplierSpeed = ethers.utils.parseEther("0.1")
    borrowerSpeed = ethers.utils.parseEther("0.2")
    await deployToken(false, underlyingSymbol, underlyingAddress, comptroller, jumpRateModelV2, oracle, zkErc20Delegate, exchangeRate, name, symbol, oracleFeed, reserveFactor, collateralFactor, supplierSpeed, borrowerSpeed, admin)

}

async function deployToken(isEther, underlyingSymbol, underlyingAddress, comptroller, jumpRateModelV2, oracle, zkErc20Delegate, exchangeRate, name, symbol, oracleFeed, reserveFactor, collateralFactor, supplierSpeed, borrowerSpeed, admin) {
    let zkToken

    if (isEther) {
        zkToken = await deploy("ZKEther", comptroller._address, jumpRateModelV2._address, exchangeRate, name, symbol, 8, admin.address).send({ from: admin.address });
    } else {
        zkToken = await deploy("ZKErc20Delegator", underlyingAddress, comptroller._address, jumpRateModelV2._address, exchangeRate, name, symbol, 8, admin.address, zkErc20Delegate._address, "0x").send({ from: admin.address });
    }

    await oracle.methods.setFeed(underlyingSymbol, oracleFeed).send({ from: admin.address })

    if (isEther) {
        await oracle.methods.setFeed(symbol, oracleFeed).send({ from: admin.address })
    }

    // await oracle.methods.setDirectPrice(underlyingAddress, oracleFeed).send({ from: admin.address })
    await comptroller.methods._supportMarket(zkToken._address).send({ from: admin.address })
    await comptroller.methods._setCollateralFactor(zkToken._address, collateralFactor).send({ from: admin.address })
    await comptroller.methods._setZGTSpeeds([zkToken._address], [supplierSpeed], [borrowerSpeed]).send({ from: admin.address })
    console.log(`***Deployed ${symbol} token to ${zkToken._address}`);
}

sim()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
