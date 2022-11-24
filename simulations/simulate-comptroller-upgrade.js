/*
  npx hardhat run simulations/simulate-comptroller-upgrade.js --network localhost
*/

const { expect, web3 } = require("hardhat");
const { deploy, reset, getContractAt, impersonate } = require("../utils/misc");

async function sim() {
    await hre.run("compile");
    const [admin] = await ethers.getSigners();

    const unitrollerAddress = ""
    
    if (unitrollerAddress == "") {
        console.error("Unitroller address must be provided")
        return
    }

    let comptroller = await deploy("Comptroller").send({ from: admin.address });
    console.log(`***Deployed Comptroller to ${comptroller._address}`);

    let unitroller = getContractAt('Unitroller', unitrollerAddress);

    await unitroller.methods._setPendingImplementation(comptroller._address).send({ from: admin.address })
    await comptroller.methods._become(unitroller._address).send({ from: admin.address })

    console.log("starting verify process")

    await hre.run("verify:verify", {
        address: comptroller._address,
        constructorArguments: []
    })
}

sim()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
