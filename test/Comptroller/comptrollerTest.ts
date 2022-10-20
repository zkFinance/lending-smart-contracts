import { constants, Signer } from "ethers";
import * as hre from "hardhat";
import { ethers } from "hardhat";
import { smock, MockContract, FakeContract } from "@defi-wonderland/smock";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import chai from "chai";
const { expect } = chai;
chai.use(smock.matchers);

import {
  Comptroller, Comptroller__factory, PriceOracle, ComptrollerLens, ComptrollerLens__factory,
  ZKToken, EIP20Interface, EIP20Interface__factory, ZGT
} from "../../typechain-types";

import { convertToUnit } from "../../utils/convertToUnit";
import { ComptrollerErrorReporter } from "../../utils/Errors";

type SimpleComptrollerFixture = {
  oracle: FakeContract<PriceOracle>,
  // accessControl: FakeContract<IAccessControlManager>,
  comptrollerLens: MockContract<ComptrollerLens>,
  comptroller: MockContract<Comptroller>
};

async function deploySimpleComptroller(): Promise<SimpleComptrollerFixture> {
  const oracle = await smock.fake<PriceOracle>("PriceOracle");
  // const accessControl = await smock.fake<IAccessControlManager>("AccessControlManager");
  // accessControl.isAllowedToCall.returns(true);
  const ComptrollerLensFactory = await smock.mock<ComptrollerLens__factory>("ComptrollerLens");
  const ComptrollerFactory = await smock.mock<Comptroller__factory>("Comptroller");
  const comptroller = await ComptrollerFactory.deploy();
  const comptrollerLens = await ComptrollerLensFactory.deploy();
  // await comptroller._setAccessControl(accessControl.address);
  await comptroller._setComptrollerLens(comptrollerLens.address);
  await comptroller._setPriceOracle(oracle.address);
  await comptroller._setLiquidationIncentive(convertToUnit("1", 18));
  return { oracle, comptroller, comptrollerLens};
}

function configureOracle(oracle: FakeContract<PriceOracle>) {
  oracle.getUnderlyingPrice.returns(convertToUnit(1, 18));
}

function configureZKToken(zkToken: FakeContract<ZKToken>, comptroller: MockContract<Comptroller>) {
  zkToken.comptroller.returns(comptroller.address);
  zkToken.isZKToken.returns(true);
  zkToken.totalSupply.returns(convertToUnit("1000000", 18));
  zkToken.totalBorrows.returns(convertToUnit("900000", 18));
}

describe("Comptroller", () => {
  let root: Signer;
  let accounts: Signer[];
  
  before(async () => {
    [root, ...accounts] = await ethers.getSigners();
  });

  describe('constructor', () => {
    it("on success it sets admin to creator and pendingAdmin is unset", async () => {
      const { comptroller } = await loadFixture(deploySimpleComptroller);
      expect(await comptroller.admin()).to.equal(await root.getAddress());
      expect(await comptroller.pendingAdmin()).to.equal(constants.AddressZero);
    });
  });

  describe("_setLiquidationIncentive", () => {
    let comptroller: MockContract<Comptroller>;
    const initialIncentive = convertToUnit("1", 18);
    const validIncentive = convertToUnit("1.1", 18);
    const tooSmallIncentive = convertToUnit("0.99999", 18);

    beforeEach(async () => {
      ({ comptroller } = await loadFixture(deploySimpleComptroller));
    });

    it("fails if incentive is less than 1e18", async () => {
      await expect(
        comptroller._setLiquidationIncentive(tooSmallIncentive)
      ).to.be.revertedWith("incentive must be over 1e18");
    });

    it("accepts a valid incentive and emits a NewLiquidationIncentive event", async () => {
      expect(await comptroller.callStatic._setLiquidationIncentive(validIncentive))
        .to.equal(ComptrollerErrorReporter.Error.NO_ERROR);
      expect(await comptroller._setLiquidationIncentive(validIncentive))
        .to.emit(comptroller, "NewLiquidationIncentive")
        .withArgs(initialIncentive, validIncentive);
      expect(await comptroller.liquidationIncentiveMantissa()).to.equal(validIncentive);
    });
  });

  describe('Non zero address check', () => {
    let comptroller: MockContract<Comptroller>;
    
    beforeEach(async () => {
      ({ comptroller } = await loadFixture(deploySimpleComptroller));
    });

    type FuncNames = keyof Comptroller["functions"];

    function testZeroAddress<Func extends FuncNames>(funcName: Func, args: Parameters<Comptroller[Func]>) {
      it("", async () => {
        await expect(
          comptroller[funcName](...args)
        ).to.be.revertedWith("can't be zero address");
      });
    }
    testZeroAddress('_setPriceOracle', [constants.AddressZero]);
    testZeroAddress('_setCollateralFactor', [constants.AddressZero, 0]);
    testZeroAddress('_setZGTSpeeds', [[constants.AddressZero], [0], [0]]);
    testZeroAddress('_setComptrollerLens', [constants.AddressZero]);
  })

  describe("_setComptrollerLens", () => {
    let comptroller: MockContract<Comptroller>;
    let comptrollerLens: MockContract<ComptrollerLens>;

    type Contracts = {
      comptrollerLens: MockContract<ComptrollerLens>,
      comptroller: MockContract<Comptroller>
    };

    async function deploy(): Promise<Contracts> {
      const ComptrollerFactory = await smock.mock<Comptroller__factory>("Comptroller");
      const comptroller = await ComptrollerFactory.deploy();
      const ComptrollerLensFactory = await smock.mock<ComptrollerLens__factory>("ComptrollerLens");
      const comptrollerLens = await ComptrollerLensFactory.deploy();
      return { comptroller, comptrollerLens };
    }

    beforeEach(async () => {
      ({ comptroller, comptrollerLens } = await loadFixture(deploy));
    });

    it("fails if not called by admin", async () => {
      await expect(
        comptroller.connect(accounts[0])._setComptrollerLens(comptrollerLens.address)
      ).to.be.revertedWith("only admin");
    });

    it("should fire an event", async () => {
      const { comptroller, comptrollerLens } = await loadFixture(deploy);
      const oldComptrollerLensAddress = await comptroller.comptrollerLens();
      expect(await comptroller._setComptrollerLens(comptrollerLens.address))
        .to.emit(comptroller, "NewComptrollerLens")
        .withArgs(oldComptrollerLensAddress, comptrollerLens.address);
    });
  });

  describe("_setPriceOracle", () => {
    let comptroller: MockContract<Comptroller>;
    let oracle: FakeContract<PriceOracle>;
    let newOracle: FakeContract<PriceOracle>;

    type Contracts = SimpleComptrollerFixture & {
      newOracle: FakeContract<PriceOracle>;
    };

    async function deploy(): Promise<Contracts> {
      const contracts = await deploySimpleComptroller();
      const newOracle = await smock.fake<PriceOracle>("PriceOracle");
      return { ...contracts, newOracle };
    }

    beforeEach(async () => {
      ({ comptroller, oracle, newOracle } = await loadFixture(deploy));
    });

    it("fails if called by non-admin", async () => {
      await expect(comptroller.connect(accounts[0])._setPriceOracle(oracle.address))
        .to.be.revertedWith("only admin");
      expect(await comptroller.oracle()).to.equal(oracle.address);
    });

    it("accepts a valid price oracle and emits a NewPriceOracle event", async () => {
      expect(await comptroller._setPriceOracle(newOracle.address))
        .to.emit(comptroller, "NewPriceOracle")
        .withArgs(oracle.address, newOracle.address);
      expect(await comptroller.oracle()).to.equal(newOracle.address);
    });
  });

  describe("_setCloseFactor", () => {
    let comptroller: MockContract<Comptroller>;

    beforeEach(async () => {
      ({ comptroller } = await loadFixture(deploySimpleComptroller));
    });

    it("fails if not called by admin", async () => {
      await expect(comptroller.connect(accounts[0])._setCloseFactor(1))
        .to.be.revertedWith("only admin");
    });
  });

  describe("_setCollateralFactor", () => {
    const half = convertToUnit("0.5", 18);
    let comptroller: MockContract<Comptroller>;
    let zkToken: FakeContract<ZKToken>;
    let oracle: FakeContract<PriceOracle>;

    type Contracts = SimpleComptrollerFixture & { zkToken: FakeContract<ZKToken> };

    async function deploy(): Promise<Contracts> {
      const contracts = await deploySimpleComptroller();
      const zkToken = await smock.fake<ZKToken>("ZKToken");
      zkToken.comptroller.returns(contracts.comptroller.address);
      zkToken.isZKToken.returns(true);
      return { zkToken, ...contracts };
    }

    beforeEach(async () => {
      ({ comptroller, oracle, zkToken } = await loadFixture(deploy));
      configureOracle(oracle);
    });

    it("fails if asset is not listed", async () => {
      await expect(
        comptroller._setCollateralFactor(zkToken.address, half)
      ).to.be.revertedWith("market not listed");
    });

    it("fails if factor is set without an underlying price", async () => {
      await comptroller._supportMarket(zkToken.address);
      oracle.getUnderlyingPrice.returns(0);
      expect(await comptroller._setCollateralFactor(zkToken.address, half))
        .to.emit(comptroller, "Failure")
        .withArgs(
          ComptrollerErrorReporter.Error.PRICE_ERROR,
          ComptrollerErrorReporter.FailureInfo.SET_COLLATERAL_FACTOR_WITHOUT_PRICE
        );
    });

    it("succeeds and sets market", async () => {
      await comptroller._supportMarket(zkToken.address);
      expect(await comptroller._setCollateralFactor(zkToken.address, half))
        .to.emit(comptroller, "NewCollateralFactor")
        .withArgs(zkToken.address, "0", half);
    });
  });

  describe("_supportMarket", () => {
    let comptroller: MockContract<Comptroller>;
    let oracle: FakeContract<PriceOracle>;
    let zkToken1: FakeContract<ZKToken>;
    let zkToken2: FakeContract<ZKToken>;
    let token: FakeContract<EIP20Interface>;

    type Contracts = SimpleComptrollerFixture & {
      zkToken1: FakeContract<ZKToken>;
      zkToken2: FakeContract<ZKToken>;
      token: FakeContract<EIP20Interface>;
    };

    async function deploy(): Promise<Contracts> {
      const contracts = await deploySimpleComptroller();
      const zkToken1 = await smock.fake<ZKToken>("ZKToken");
      const zkToken2 = await smock.fake<ZKToken>("ZKToken");
      const token = await smock.fake<EIP20Interface>("EIP20Interface");
      return { ...contracts, zkToken1, zkToken2, token };
    }

    beforeEach(async () => {
      ({ comptroller, oracle, zkToken1, zkToken2, token } = await loadFixture(deploy));
      configureOracle(oracle);
      configureZKToken(zkToken1, comptroller);
      configureZKToken(zkToken2, comptroller);
    });

    it("fails if asset is not a ZKToken", async () => {
      await expect(comptroller._supportMarket(token.address)).to.be.reverted;
    });

    it("succeeds and sets market", async () => {
      expect(await comptroller._supportMarket(zkToken1.address))
        .to.emit(comptroller, "MarketListed")
        .withArgs(zkToken1.address);
    });

    it("cannot list a market a second time", async () => {
      const tx1 = await comptroller._supportMarket(zkToken1.address);
      const tx2 = await comptroller._supportMarket(zkToken1.address);
      expect(tx1).to.emit(comptroller, "MarketListed").withArgs(zkToken1.address);
      expect(tx2).to.emit(comptroller, "Failure")
        .withArgs(
          ComptrollerErrorReporter.Error.MARKET_ALREADY_LISTED,
          ComptrollerErrorReporter.FailureInfo.SUPPORT_MARKET_EXISTS
        );
    });

    it("can list two different markets", async () => {
      const tx1 = await comptroller._supportMarket(zkToken1.address);
      const tx2 = await comptroller._supportMarket(zkToken2.address);
      expect(tx1).to.emit(comptroller, "MarketListed").withArgs(zkToken1.address);
      expect(tx2).to.emit(comptroller, "MarketListed").withArgs(zkToken2.address);
    });
  });

  describe("claimPaused", () => {
    let comptroller: MockContract<Comptroller>;
    let zgt: FakeContract<ZGT>;
  })

  describe("redeemVerify", () => {
    let comptroller: MockContract<Comptroller>;
    let zkToken: FakeContract<ZKToken>;

    type Contracts = SimpleComptrollerFixture & { zkToken: FakeContract<ZKToken> };

    async function deploy(): Promise<Contracts> {
      const contracts = await deploySimpleComptroller();
      const zkToken = await smock.fake<ZKToken>("ZKToken");
      await contracts.comptroller._supportMarket(zkToken.address);
      return { ...contracts, zkToken };
    }

    beforeEach(async () => {
      ({ comptroller, zkToken } = await loadFixture(deploy));
      configureZKToken(zkToken, comptroller);
    });

    it("should allow you to redeem 0 underlying for 0 tokens", async () => {
      await comptroller.redeemVerify(zkToken.address, await accounts[0].getAddress(), 0, 0);
    });

    it("should allow you to redeem 5 underlyig for 5 tokens", async () => {
      await comptroller.redeemVerify(zkToken.address, await accounts[0].getAddress(), 5, 5);
    });

    it("should not allow you to redeem 5 underlying for 0 tokens", async () => {
      await expect(comptroller.redeemVerify(zkToken.address, await accounts[0].getAddress(), 5, 0))
        .to.be.revertedWith("redeemTokens zero");
    });
  });

  describe("claim", () => {
    let comptroller: MockContract<Comptroller>;
    let zgt: FakeContract<ZGT>;
    let zkToken: FakeContract<ZKToken>;

    type Contracts = SimpleComptrollerFixture & { zgt: FakeContract<ZGT>, zkToken: FakeContract<ZKToken> };

    async function deploy(): Promise<Contracts> {
      const contracts = await deploySimpleComptroller();
      const zgt = await smock.fake<ZGT>("ZGT");
      const zkToken = await smock.fake<ZKToken>("ZKToken");
      await contracts.comptroller._supportMarket(zkToken.address);
      return { ...contracts, zgt, zkToken };
    }

    beforeEach(async () => {
      ({ comptroller, zgt, zkToken } = await loadFixture(deploy));
      await comptroller._setZGTClaimingPaused(true)
    });

    it("should not allow you to claim ZGT", async () => {
      await expect(comptroller["claimZGT(address)"](await root.getAddress()))
        .to.be.revertedWith("paused");
    });
  })
});
