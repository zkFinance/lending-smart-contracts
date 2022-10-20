import { Signer, BaseContract, BigNumberish, constants } from "ethers";
import { ethers } from "hardhat";
import { smock, MockContract, FakeContract } from "@defi-wonderland/smock";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import chai from "chai";
const { expect } = chai;
chai.use(smock.matchers);

import {
  Comptroller, Comptroller__factory, PriceOracle, ComptrollerLens, ComptrollerLens__factory,
  ZKToken, EIP20Interface, EIP20Interface__factory, ZGT, ZKErc20Immutable
} from "../../typechain-types";

import { convertToUnit } from "../../utils/convertToUnit";
import { ComptrollerErrorReporter } from "../../utils/Errors";
const borrowedPrice = convertToUnit(2, 10);
const collateralPrice = convertToUnit(1, 18);
const repayAmount = convertToUnit(1, 18);

async function calculateSeizeTokens(
  comptroller: MockContract<Comptroller>,
  zkTokenBorrowed: FakeContract<ZKErc20Immutable>,
  zkTokenCollateral: FakeContract<ZKErc20Immutable>,
  repayAmount: BigNumberish
) {
  return comptroller.liquidateCalculateSeizeTokens(zkTokenBorrowed.address, zkTokenCollateral.address, repayAmount);
}

function rando(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

describe('Comptroller', () => {
  let root: Signer;
  let accounts: Signer[];
  let comptroller: MockContract<Comptroller>;
  let comptrollerLens: MockContract<ComptrollerLens>;
  let oracle: FakeContract<PriceOracle>;
  let zkTokenBorrowed: FakeContract<ZKErc20Immutable>;
  let zkTokenCollateral: FakeContract<ZKErc20Immutable>;

  type LiquidateFixture = {
    comptroller: MockContract<Comptroller>;
    comptrollerLens: MockContract<ComptrollerLens>;
    oracle: FakeContract<PriceOracle>;
    zkTokenBorrowed: FakeContract<ZKErc20Immutable>;
    zkTokenCollateral: FakeContract<ZKErc20Immutable>;
  };

  async function setOraclePrice(vToken: FakeContract<ZKErc20Immutable>, price: BigNumberish) {
    oracle.getUnderlyingPrice.whenCalledWith(vToken.address).returns(price);
  }

  async function liquidateFixture(): Promise<LiquidateFixture> {
    const ComptrollerFactory = await smock.mock<Comptroller__factory>("Comptroller");
    const ComptrollerLensFactory = await smock.mock<ComptrollerLens__factory>("ComptrollerLens");
    const comptroller = await ComptrollerFactory.deploy();
    const comptrollerLens = await ComptrollerLensFactory.deploy();
    const oracle = await smock.fake<PriceOracle>("PriceOracle");
    await comptroller._setComptrollerLens(comptrollerLens.address);
    await comptroller._setPriceOracle(oracle.address);
    await comptroller._setLiquidationIncentive(convertToUnit("1.1", 18));

    const zkTokenBorrowed = await smock.fake<ZKErc20Immutable>("ZKErc20Immutable");
    const zkTokenCollateral = await smock.fake<ZKErc20Immutable>("ZKErc20Immutable");

    return { comptroller, comptrollerLens, oracle, zkTokenBorrowed, zkTokenCollateral };
  }

  async function configure({ comptroller, zkTokenCollateral, oracle, zkTokenBorrowed }: LiquidateFixture) {
    oracle.getUnderlyingPrice.returns(0);
    for (const vToken of [zkTokenBorrowed, zkTokenCollateral]) {
      vToken.comptroller.returns(comptroller.address);
      vToken.isZKToken.returns(true);
    }

    zkTokenCollateral.exchangeRateStored.returns(5e9);
    oracle.getUnderlyingPrice.whenCalledWith(zkTokenCollateral.address).returns(collateralPrice);
    oracle.getUnderlyingPrice.whenCalledWith(zkTokenBorrowed.address).returns(borrowedPrice);
  }

  beforeEach(async () => {
    [root, ...accounts] = await ethers.getSigners();
    const contracts = await loadFixture(liquidateFixture);
    await configure(contracts);
    ({ comptroller, comptrollerLens, zkTokenBorrowed, oracle, zkTokenCollateral} = contracts);
  });

  describe('liquidateCalculateAmountSeize', () => {
    it("fails if borrowed asset price is 0", async () => {
      setOraclePrice(zkTokenBorrowed, 0);
      const [err, result] = await calculateSeizeTokens(comptroller, zkTokenBorrowed, zkTokenCollateral, repayAmount)
      expect(err).to.equal(ComptrollerErrorReporter.Error.PRICE_ERROR);
      expect(result).to.equal(0);
    });

    it("fails if collateral asset price is 0", async () => {
      setOraclePrice(zkTokenCollateral, 0);
      const [err, result] = await calculateSeizeTokens(comptroller, zkTokenBorrowed, zkTokenCollateral, repayAmount)
      expect(err).to.equal(ComptrollerErrorReporter.Error.PRICE_ERROR);
      expect(result).to.equal(0);
    });

    it("reverts if it fails to calculate the exchange rate", async () => {
      zkTokenCollateral.exchangeRateStored.reverts("exchangeRateStored: exchangeRateStoredInternal failed");
      ethers.provider.getBlockNumber();
      /// TODO: Somehow the error message does not get propagated into the resulting tx. Smock bug?
      await expect(
        comptroller.liquidateCalculateSeizeTokens(zkTokenBorrowed.address, zkTokenCollateral.address, repayAmount)
      ).to.be.reverted; // revertedWith("exchangeRateStored: exchangeRateStoredInternal failed");
    });

    [
      [1e18, 1e18, 1e18, 1e18, 1e18],
      [2e18, 1e18, 1e18, 1e18, 1e18],
      [2e18, 2e18, 1.42e18, 1.3e18, 2.45e18],
      [2.789e18, 5.230480842e18, 771.32e18, 1.3e18, 10002.45e18],
      [ 7.009232529961056e+24,2.5278726317240445e+24,2.6177112093242585e+23,1179713989619784000,7.790468414639561e+24 ],
      [rando(0, 1e25), rando(0, 1e25), rando(1, 1e25), rando(1e18, 1.5e18), rando(0, 1e25)]
    ].forEach((testCase) => {
      it(`returns the correct value for ${testCase}`, async () => {
        const [exchangeRate, borrowedPrice, collateralPrice, liquidationIncentive, repayAmount] = testCase.map(x => BigInt(x));

        setOraclePrice(zkTokenCollateral, collateralPrice);
        setOraclePrice(zkTokenBorrowed, borrowedPrice);
        await comptroller._setLiquidationIncentive(liquidationIncentive);
        zkTokenCollateral.exchangeRateStored.returns(exchangeRate);

        const seizeAmount = repayAmount * liquidationIncentive * borrowedPrice / collateralPrice;
        const seizeTokens = seizeAmount / exchangeRate;

        const [err, result] = await calculateSeizeTokens(comptroller, zkTokenBorrowed, zkTokenCollateral, repayAmount);
        expect(err).to.equal(ComptrollerErrorReporter.Error.NO_ERROR);
        expect(Number(result)).to.be.approximately(Number(seizeTokens), 1e7);
      });
    });
  });
});
