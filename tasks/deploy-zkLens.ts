/*
    npx hardhat zkLens --network hardhat \
    --only-estimate-gas true \
    --verify false
*/

import { task, types } from "hardhat/config";
import * as zkLensDeployer from '../deploy/deploy-lens'

task("zkLens", "Deploy ZK Lens")
  .addParam("onlyEstimateGas", "", false, types.boolean)
  .addParam("verify", "", false, types.boolean)
  .setAction(async args => {
    await zkLensDeployer.default(hre, args.onlyEstimateGas, args.verify)
  });