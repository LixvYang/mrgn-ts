/**
 * INPUT: Bank configuration serializer and a legacy-compatible configuration payload
 * OUTPUT: Regression coverage for v0.1.10 optional bank configuration fields
 * POSITION: Unit test for the bank configuration serialization boundary
 *
 * SYNC: If this file changes, update this header and ./folder.md
 */
import { BankConfigOpt, OperationalState, OracleSetup } from "../types";
import { parseOperationalState } from "./deserialize.utils";
import { serializeBankConfigOpt, serializeOperationalState, serializeOracleSetupToIndex } from "./serialize.utils";

test("serializes omitted v0.1.10 bank configuration fields as null", () => {
  const legacyConfig: BankConfigOpt = {
    assetWeightInit: null,
    assetWeightMaint: null,
    liabilityWeightInit: null,
    liabilityWeightMaint: null,
    depositLimit: null,
    borrowLimit: null,
    operationalState: null,
    interestRateConfig: null,
    riskTier: null,
    assetTag: null,
    totalAssetValueInitLimit: null,
    oracleMaxConfidence: null,
    oracleMaxAge: null,
    permissionlessBadDebtSettlement: null,
    freezeSettings: null,
    tokenlessRepaymentsAllowed: null,
  };

  expect(serializeBankConfigOpt(legacyConfig)).toMatchObject({
    liquidationLiquidatorFee: null,
    liquidationInsuranceFee: null,
    circuitBreakerEnabled: null,
    cbDeviationBpsTiers: null,
    cbTierDurationsSeconds: null,
    cbEscalationWindowMult: null,
    cbEmaAlphaBps: null,
    cbWindowSeconds: null,
    cbWindowMaxUpBps: null,
    cbWindowMaxDownBps: null,
  });
});

test("serializes every v0.1.10 oracle setup to its on-chain discriminant", () => {
  expect(
    [
      OracleSetup.FixedKamino,
      OracleSetup.FixedDrift,
      OracleSetup.JuplendPythPull,
      OracleSetup.JuplendSwitchboardPull,
      OracleSetup.FixedJuplend,
    ].map(serializeOracleSetupToIndex)
  ).toEqual([13, 14, 15, 16, 17]);
});

test("round-trips v0.1.10 bank operational states", () => {
  const states = [
    OperationalState.Uninitialized,
    OperationalState.ReduceOnlyWithBorrowingPower,
    OperationalState.CircuitBroken,
  ];

  expect(states.map((state) => parseOperationalState(serializeOperationalState(state)))).toEqual(states);
});
