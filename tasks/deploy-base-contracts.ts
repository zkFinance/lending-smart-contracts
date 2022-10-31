/*
    npx hardhat deploy-base-contracts --network hardhat \
    --only-estimate-gas true \
    --verify false
*/

import { task, types } from "hardhat/config";
import * as baseContractsDeployer from '../deploy/deploy-base-contracts'

task("deploy-base-contracts", "Deploy zkFinance base contracts")
  .addParam("onlyEstimateGas", "", false, types.boolean)
  .addParam("verify", "", false, types.boolean)
  .setAction(async args => {
    await baseContractsDeployer.default(hre, args.onlyEstimateGas, args.verify)
  });