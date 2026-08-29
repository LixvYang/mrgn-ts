/**
 * INPUT: Bank risk-account fixtures for integrated, staked, and trailing banks
 * OUTPUT: Regression coverage for the v0.1.10 remaining-account ordering contract
 * POSITION: Unit test for Marginfi health-account composition
 *
 * SYNC: If this file changes, update this header and ./folder.md
 */
import { PublicKey } from "@solana/web3.js";

import { AssetTag, BankType } from "../../bank";
import { computeHealthAccountMetas } from "./compute.utils";

const key = (seed: number) => new PublicKey(new Uint8Array(32).fill(seed));

function bank(addressSeed: number, assetTag: AssetTag, oracleSeeds: number[]): BankType {
  return {
    address: key(addressSeed),
    oracleKey: key(oracleSeeds[0]),
    config: {
      assetTag,
      oracleKeys: oracleSeeds.map(key),
    },
  } as BankType;
}

test("packs integration and staked oracle accounts in v0.1.10 order", () => {
  const integrationBank = bank(1, AssetTag.JUPLEND, [2, 3]);
  const stakedBank = bank(4, AssetTag.STAKED, [5, 6, 7, 8]);

  expect(computeHealthAccountMetas([integrationBank, stakedBank], undefined, false)).toEqual([
    key(1),
    key(2),
    key(3),
    key(4),
    key(5),
    key(6),
    key(7),
    key(8),
  ]);
});

test("appends withdraw-all bank accounts after the health pack", () => {
  const activeBank = bank(10, AssetTag.DEFAULT, [11]);
  const withdrawnBank = bank(12, AssetTag.DEFAULT, [13]);

  expect(computeHealthAccountMetas([activeBank], undefined, false, [withdrawnBank])).toEqual([
    key(10),
    key(11),
    key(12),
    key(13),
  ]);
});
