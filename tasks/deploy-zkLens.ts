/*
    npx hardhat zkLens --network hardhat \
    --zgt-address 0x \
    --only-estimate-gas true \
    --verify false
*/

import { task, types } from "hardhat/config";
import * as zkLensDeployer from '../deploy/deploy-lens'

task("zkLens", "Deploy ZK Lens")
  .addParam("zgtAddress", "")
  .addParam("onlyEstimateGas", "", false, types.boolean)
  .addParam("verify", "", false, types.boolean)
  .setAction(async args => {
    await zkLensDeployer.default(hre, args.zgtAddress, args.onlyEstimateGas, args.verify)
  });