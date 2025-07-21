import { PublicKey, Commitment } from "@solana/web3.js";
import BigNumber from "bignumber.js";

import {
  Bank,
  BankConfig,
  BankRaw,
  EmodeEntry,
  EmodeFlags,
  AssetTag,
  EmodeTag,
  MarginfiGroup,
  MarginfiProgram,
  MintData,
  OperationalState,
  OraclePrice,
  PythPushFeedIdMap,
  RiskTier,
  OracleSetup,
  InterestRateConfig,
} from "@mrgnlabs/marginfi-client-v2";
import { BankMetadataMap, chunkedGetRawMultipleAccountInfoOrdered } from "@mrgnlabs/mrgn-common";
import BN from "bn.js";
import { EmodeSettings } from "@mrgnlabs/marginfi-client-v2/dist/models/emode-settings";

async function fetchGroupDataFromFluxorApi(
  program: MarginfiProgram,
  groupAddress: PublicKey,
  commitment?: Commitment,
  bankAddresses?: PublicKey[],
  bankMetadataMap?: BankMetadataMap
): Promise<{
  marginfiGroup: MarginfiGroup;
  banks: Map<string, Bank>;
  priceInfos: Map<string, OraclePrice>;
  tokenDatas: Map<string, MintData>;
  feedIdMap: PythPushFeedIdMap;
}> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_FLUXOR_API_URL}/group/${groupAddress.toBase58()}`);
  const data: GroupInfo = await response.json();

  const marginfiGroup: MarginfiGroup = new MarginfiGroup(
    new PublicKey(data.marginfiGroup.admin),
    new PublicKey(data.marginfiGroup.address)
  );
  const banks: Map<string, Bank> = new Map(
    Object.entries(data.banks).map(([key, bank]: [string, BankR]) => {
      const interestRateConfig: InterestRateConfig = {
        insuranceFeeFixedApr: new BigNumber(bank.config.interestRateConfig.insuranceFeeFixedApr),
        maxInterestRate: new BigNumber(bank.config.interestRateConfig.maxInterestRate),
        insuranceIrFee: new BigNumber(bank.config.interestRateConfig.insuranceIrFee),
        optimalUtilizationRate: new BigNumber(bank.config.interestRateConfig.optimalUtilizationRate),
        plateauInterestRate: new BigNumber(bank.config.interestRateConfig.plateauInterestRate),
        protocolFixedFeeApr: new BigNumber(bank.config.interestRateConfig.protocolFixedFeeApr),
        protocolIrFee: new BigNumber(bank.config.interestRateConfig.protocolIrFee),
        protocolOriginationFee: new BigNumber(bank.config.interestRateConfig.protocolOriginationFee),
      };
      return [
        key,
        new Bank(
          new PublicKey(bank.address),
          new PublicKey(bank.mint),
          bank.mintDecimals,
          new PublicKey(bank.group),
          new BigNumber(bank.assetShareValue),
          new BigNumber(bank.liabilityShareValue),
          new PublicKey(bank.liquidityVault),
          bank.liquidityVaultBump,
          bank.liquidityVaultAuthorityBump,
          new PublicKey(bank.insuranceVault),
          bank.insuranceVaultBump,
          bank.insuranceVaultAuthorityBump,
          new BigNumber(bank.collectedInsuranceFeesOutstanding),
          new PublicKey(bank.feeVault),
          bank.feeVaultBump,
          bank.feeVaultAuthorityBump,
          new BigNumber(bank.collectedGroupFeesOutstanding),
          new BN(bank.lastUpdate),
          new BankConfig(
            new BigNumber(bank.config.assetWeightInit),
            new BigNumber(bank.config.assetWeightMaint),
            new BigNumber(bank.config.liabilityWeightInit),
            new BigNumber(bank.config.liabilityWeightMaint),
            new BigNumber(bank.config.depositLimit),
            new BigNumber(bank.config.borrowLimit),
            bank.config.riskTier as RiskTier,
            new BigNumber(bank.config.totalAssetValueInitLimit),
            bank.config.assetTag as AssetTag,
            bank.config.oracleSetup as OracleSetup,
            bank.config.oracleKeys.map((key) => new PublicKey(key)),
            bank.config.oracleMaxAge,
            interestRateConfig,
            bank.config.operationalState
          ),
          new BigNumber(bank.totalAssetShares),
          new BigNumber(bank.totalLiabilityShares),
          bank.emissionsActiveBorrowing,
          bank.emissionsActiveLending,
          bank.emissionsRate,
          new PublicKey(bank.emissionsMint),
          new BigNumber(bank.emissionsRemaining),
          new PublicKey(bank.oracleKey),
          new EmodeSettings(
            bank.emode.emodeTag as EmodeTag,
            bank.emode.timestamp,
            bank.emode.flags as EmodeFlags[],
            bank.emode.emodeEntries as EmodeEntry[]
          ),
          bank.tokenSymbol
        ),
      ];
    })
  );

  const convertedPriceInfos = new Map(
    Object.entries(data.priceInfos).map(([key, priceInfo]: [string, any]) => {
      return [
        key,
        {
          priceRealtime: {
            price: new BigNumber(priceInfo.priceRealtime.price),
            confidence: new BigNumber(priceInfo.priceRealtime.confidence),
            lowestPrice: new BigNumber(priceInfo.priceRealtime.lowestPrice),
            highestPrice: new BigNumber(priceInfo.priceRealtime.highestPrice),
          },
          priceWeighted: {
            price: new BigNumber(priceInfo.priceWeighted.price),
            confidence: new BigNumber(priceInfo.priceWeighted.confidence),
            lowestPrice: new BigNumber(priceInfo.priceWeighted.lowestPrice),
            highestPrice: new BigNumber(priceInfo.priceWeighted.highestPrice),
          },
          timestamp: priceInfo.timestamp ? new BigNumber(priceInfo.timestamp) : null,
        } as OraclePrice,
      ];
    })
  );

  const convertedTokenDatas = new Map(
    Object.entries(data.tokenDatas).map(([key, tokenData]: [string, any]) => {
      return [
        key,
        {
          mint: new PublicKey(tokenData.mint),
          tokenProgram: new PublicKey(tokenData.tokenProgram),
          feeBps: tokenData.feeBps,
          emissionTokenProgram: tokenData.emissionTokenProgram ? new PublicKey(tokenData.emissionTokenProgram) : null,
        } as MintData,
      ];
    })
  );

  const convertedFeedIdMap = new Map(
    Object.entries(data.feedIdMap).map(([key, value]: [string, unknown]) => {
      return [key, new PublicKey(value as string)];
    })
  );

  return {
    marginfiGroup: marginfiGroup,
    banks: banks,
    priceInfos: convertedPriceInfos,
    tokenDatas: convertedTokenDatas,
    feedIdMap: convertedFeedIdMap,
  };
}

export interface GroupInfo {
  marginfiGroup: MarginfiGroupR;
  banks: { [key: string]: BankR };
  priceInfos: { [key: string]: PriceInfoR };
  tokenDatas: { [key: string]: TokenDataR };
  feedIdMap: Record<string, string>;
}

export interface BankR {
  address: string;
  tokenSymbol: string;
  group: string;
  mint: string;
  mintDecimals: number;
  assetShareValue: string;
  liabilityShareValue: string;
  liquidityVault: string;
  liquidityVaultBump: number;
  liquidityVaultAuthorityBump: number;
  insuranceVault: string;
  insuranceVaultBump: number;
  insuranceVaultAuthorityBump: number;
  collectedInsuranceFeesOutstanding: string;
  feeVault: string;
  feeVaultBump: number;
  feeVaultAuthorityBump: number;
  collectedGroupFeesOutstanding: string;
  lastUpdate: number;
  config: Config;
  totalAssetShares: string;
  totalLiabilityShares: string;
  emissionsActiveBorrowing: boolean;
  emissionsActiveLending: boolean;
  emissionsRate: number;
  emissionsMint: string;
  emissionsRemaining: string;
  oracleKey: string;
  emode: Emode;
}

export interface Config {
  assetWeightInit: string;
  assetWeightMaint: string;
  liabilityWeightInit: string;
  liabilityWeightMaint: string;
  depositLimit: string;
  borrowLimit: string;
  riskTier: RiskTier;
  operationalState: OperationalState;
  totalAssetValueInitLimit: string;
  assetTag: number;
  oracleSetup: string;
  oracleKeys: string[];
  oracleMaxAge: number;
  interestRateConfig: InterestRateConfig;
}

export interface InterestRateConfigR {
  insuranceFeeFixedApr: string;
  maxInterestRate: string;
  insuranceIrFee: string;
  optimalUtilizationRate: string;
  plateauInterestRate: string;
  protocolFixedFeeApr: string;
  protocolIrFee: string;
  protocolOriginationFee: string;
}

export interface Emode {
  emodeTag: number;
  timestamp: number;
  flags: any[];
  emodeEntries: any[];
}

export interface MarginfiGroupR {
  admin: string;
  address: string;
}

export interface PriceInfoR {
  priceRealtime: Price;
  priceWeighted: Price;
  timestamp: string;
}

export interface Price {
  price: string;
  confidence: string;
  lowestPrice: string;
  highestPrice: string;
}

export interface TokenDataR {
  mint: string;
  tokenProgram: string;
  feeBps: number;
  emissionTokenProgram: null;
}

async function fetchGroupData(
  program: MarginfiProgram,
  groupAddress: PublicKey,
  commitment?: Commitment,
  bankAddresses?: PublicKey[],
  bankMetadataMap?: BankMetadataMap
): Promise<{
  marginfiGroup: MarginfiGroup;
  banks: Map<string, Bank>;
  priceInfos: Map<string, OraclePrice>;
  tokenDatas: Map<string, MintData>;
  feedIdMap: PythPushFeedIdMap;
}> {
  // Fetch & shape all accounts of Bank type (~ bank discovery)
  let bankDatasKeyed: { address: PublicKey; data: BankRaw }[] = [];
  if (bankAddresses && bankAddresses.length > 0) {
    let bankAccountsData = await program.account.bank.fetchMultiple(bankAddresses);
    for (let i = 0; i < bankAccountsData.length; i++) {
      if (bankAccountsData[i] !== null) {
        bankDatasKeyed.push({
          address: bankAddresses[i],
          data: bankAccountsData[i] as any as BankRaw,
        });
      }
    }
  } else {
    let bankAccountsData = await program.account.bank.all([
      { memcmp: { offset: 8 + 32 + 1, bytes: groupAddress.toBase58() } },
    ]);
    bankDatasKeyed = bankAccountsData.map((account: any) => ({
      address: account.publicKey,
      data: account.account as any as BankRaw,
    }));
  }

  async function fetchPythFeedMap() {
    const feedIdMapRaw: Record<string, string> = await fetch(
      `/api/oracle/pythFeedMap?groupPk=${groupAddress.toBase58()}`
    ).then((response) => response.json());
    const feedIdMap: Map<string, PublicKey> = new Map(
      Object.entries(feedIdMapRaw).map(([key, value]) => [key, new PublicKey(value)])
    );
    return feedIdMap;
  }

  async function fetchOraclePrices() {
    const bankDataKeysStr = bankDatasKeyed.map((b) => b.address.toBase58());
    const response = await fetch(`/api/oracle/price?banks=${bankDataKeysStr.join(",")}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch oracle prices");
    }

    const responseBody = await response.json();

    if (!responseBody) {
      throw new Error("Failed to fetch oracle prices");
    }

    const oraclePrices = responseBody.map((oraclePrice: any) => ({
      priceRealtime: {
        price: BigNumber(oraclePrice.priceRealtime.price),
        confidence: BigNumber(oraclePrice.priceRealtime.confidence),
        lowestPrice: BigNumber(oraclePrice.priceRealtime.lowestPrice),
        highestPrice: BigNumber(oraclePrice.priceRealtime.highestPrice),
      },
      priceWeighted: {
        price: BigNumber(oraclePrice.priceWeighted.price),
        confidence: BigNumber(oraclePrice.priceWeighted.confidence),
        lowestPrice: BigNumber(oraclePrice.priceWeighted.lowestPrice),
        highestPrice: BigNumber(oraclePrice.priceWeighted.highestPrice),
      },
      timestamp: oraclePrice.timestamp ? BigNumber(oraclePrice.timestamp) : null,
    })) as OraclePrice[];

    return oraclePrices;
  }

  const [feedIdMap, oraclePrices] = await Promise.all([fetchPythFeedMap(), fetchOraclePrices()]);

  const mintKeys = bankDatasKeyed.map((b) => b.data.mint);
  const emissionMintKeys = bankDatasKeyed
    .map((b) => b.data.emissionsMint)
    .filter((pk) => !pk.equals(PublicKey.default)) as PublicKey[];

  // Batch-fetch the group account and all the oracle accounts as per the banks retrieved above
  const allAis = await chunkedGetRawMultipleAccountInfoOrdered(program.provider.connection, [
    groupAddress.toBase58(),
    ...mintKeys.map((pk) => pk.toBase58()),
    ...emissionMintKeys.map((pk) => pk.toBase58()),
  ]); // NOTE: This will break if/when we start having more than 1 oracle key per bank

  const groupAi = allAis.shift();
  const mintAis = allAis.splice(0, mintKeys.length);
  const emissionMintAis = allAis.splice(0);

  // Unpack raw data for group and oracles, and build the `Bank`s map
  if (!groupAi) throw new Error("Failed to fetch the on-chain group data");
  const marginfiGroup = MarginfiGroup.fromBuffer(groupAddress, groupAi.data, program.idl);

  const banks = new Map(
    bankDatasKeyed.map(({ address, data }) => {
      const bankMetadata = bankMetadataMap ? bankMetadataMap[address.toBase58()] : undefined;
      const bank = Bank.fromAccountParsed(address, data, feedIdMap, bankMetadata);

      return [address.toBase58(), bank];
    })
  );

  const tokenDatas = new Map(
    bankDatasKeyed.map(({ address: bankAddress, data: bankData }, index) => {
      const mintAddress = mintKeys[index];
      const mintDataRaw = mintAis[index];
      if (!mintDataRaw) throw new Error(`Failed to fetch mint account for bank ${bankAddress.toBase58()}`);
      let emissionTokenProgram: PublicKey | null = null;
      if (!bankData.emissionsMint.equals(PublicKey.default)) {
        const emissionMintDataRawIndex = emissionMintKeys.findIndex((pk) => pk.equals(bankData.emissionsMint));
        emissionTokenProgram = emissionMintDataRawIndex >= 0 ? emissionMintAis[emissionMintDataRawIndex].owner : null;
      }
      // TODO: parse extension data to see if there is a fee
      return [
        bankAddress.toBase58(),
        { mint: mintAddress, tokenProgram: mintDataRaw.owner, feeBps: 0, emissionTokenProgram },
      ];
    })
  );

  const priceInfos = new Map(
    bankDatasKeyed.map(({ address: bankAddress, data: bankData }, index) => {
      const priceData = oraclePrices[index];
      if (!priceData) throw new Error(`Failed to fetch price oracle account for bank ${bankAddress.toBase58()}`);
      return [bankAddress.toBase58(), priceData as OraclePrice];
    })
  );

  return {
    marginfiGroup,
    banks,
    priceInfos,
    tokenDatas,
    feedIdMap,
  };
}

export { fetchGroupData, fetchGroupDataFromFluxorApi };
