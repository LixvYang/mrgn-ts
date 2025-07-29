import {
  BankMetadata,
  BankMetadataMap,
  loadBankMetadatas,
  loadStakedBankMetadatas,
  loadTokenMetadatas,
  TokenMetadata,
  TokenMetadataMap,
} from "@mrgnlabs/mrgn-common";
import { stagingStaticBankMetadata, stagingStaticTokenMetadata } from "../consts";
import { getConfig } from "../config";
import { AddressLookupTableAccountArgsDto } from "../types";
import { dtoToLutAccount } from "../lib";

export async function fetchMarginfiLuts() {
  const response = await fetch("/api/bankData/lutData", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data: AddressLookupTableAccountArgsDto[] = await response.json();

  const lutAccounts = data.map((lut) => dtoToLutAccount(lut));

  return lutAccounts;
}


export async function fetchMetaData() {
  const marginfiConfig = getConfig().mrgnConfig;
  const isMixin = getConfig().isMixin;

  if (isMixin) {
    const bankMetadataJson = (await import("../consts/mainnet-fluxor-meta.test.json")) as {
      bankMetadata: BankMetadataMap;
      tokenMetadata: TokenMetadataMap;
    };
    return {
      bankMetadataMap: bankMetadataJson.bankMetadata,
      tokenMetadataMap: bankMetadataJson.tokenMetadata,
      bankAddresses: Object.keys(bankMetadataJson.bankMetadata),
    };
  }
  let bankMetadataMap: { [address: string]: BankMetadata };
  let tokenMetadataMap: { [symbol: string]: TokenMetadata };

  if (marginfiConfig.environment === "production") {
    let results = await Promise.all([
      loadBankMetadatas(process.env.NEXT_PUBLIC_BANKS_MAP),
      loadStakedBankMetadatas(
        `${process.env.NEXT_PUBLIC_STAKING_BANKS || "https://storage.googleapis.com/mrgn-public/mrgn-staked-bank-metadata-cache.json"}?t=${new Date().getTime()}`
      ),
      loadTokenMetadatas(process.env.NEXT_PUBLIC_TOKENS_MAP),
      loadTokenMetadatas(
        `${process.env.NEXT_PUBLIC_STAKING_TOKENS || "https://storage.googleapis.com/mrgn-public/mrgn-staked-token-metadata-cache.json"}?t=${new Date().getTime()}`
      ),
    ]);
    bankMetadataMap = { ...results[0], ...results[1] };
    tokenMetadataMap = { ...results[2], ...results[3] };
  } else if (marginfiConfig.environment === "staging") {
    if (process.env.NEXT_PUBLIC_BANKS_MAP && process.env.NEXT_PUBLIC_TOKENS_MAP) {
      let results = await Promise.all([
        loadBankMetadatas(process.env.NEXT_PUBLIC_BANKS_MAP),
        loadTokenMetadatas(process.env.NEXT_PUBLIC_TOKENS_MAP),
        loadTokenMetadatas(
          `${process.env.NEXT_PUBLIC_STAKING_TOKENS || "https://storage.googleapis.com/mrgn-public/mrgn-staked-token-metadata-cache.json"}?t=${new Date().getTime()}`
        ),
      ]);
      bankMetadataMap = results[0];
      tokenMetadataMap = results[1];
    } else {
      bankMetadataMap = stagingStaticBankMetadata;
      tokenMetadataMap = stagingStaticTokenMetadata;
    }
  } else {
    throw new Error("Unknown environment");
  }

  const bankAddresses = Object.keys(bankMetadataMap);
  return {
    bankMetadataMap,
    tokenMetadataMap,
    bankAddresses,
  };
}
