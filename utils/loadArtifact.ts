import { Deployer } from '@matterlabs/hardhat-zksync-deploy'
import * as ethers from "ethers";

export const loatArtifact = async (deployer: Deployer, contractName: string, params: any[]) => {
  const artifact = await deployer.loadArtifact(contractName)

  // Estimate contract deployment fee
  const deploymentFee = await deployer.estimateDeployFee(artifact, [...params]);
  const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
  console.log(`The deployment of ${contractName} is estimated to cost ${parsedFee} ETH`);

  return artifact
};


