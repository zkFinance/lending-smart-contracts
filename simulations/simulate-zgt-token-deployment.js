/*
  npx hardhat run simulations/simulate-zgt-token-deployment.js --network localhost
*/

const { expect, web3 } = require("hardhat");
const { deploy, reset, getContractAt, impersonate } = require("../utils/misc");

async function sim() {
    await hre.run("compile");
    const [admin] = await ethers.getSigners();

    // Deploy ZGT token
    let zgt = await deploy("ZGT").send({ from: admin.address });
    console.log(`***Deployed ZGT token to ${zgt._address}`);

    console.log(await zgt.methods.balanceOf(admin.address).call())

    console.log("starting verify process")

    await hre.run("verify:verify", {
        contract: "contracts/Governance/ZGT.sol:ZGT",
        address: zgt._address,
        constructorArguments: []
    })
}

sim()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
