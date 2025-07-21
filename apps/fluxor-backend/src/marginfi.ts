import {
  Bank,
  BankRaw,
  MarginfiClient,
  MarginfiConfig,
  MarginfiGroup,
  MarginfiProgram,
  MintData,
  OraclePrice,
  PythPushFeedIdMap,
  BankConfig,
  findOracleKey,
  parseOracleSetup,
  parsePriceInfo,
  OracleSetup,
  buildFeedIdMap,
} from "@mrgnlabs/marginfi-client-v2";
import {
  decodeSwitchboardPullFeedData,
  findPoolAddress,
  findPoolStakeAddress,
  getStakeAccount,
  StakeAccount,
} from "@mrgnlabs/marginfi-client-v2/dist/vendor";
import { fetchGroupData, fetchStateMetaData } from "@mrgnlabs/marginfi-v2-ui-state";
import { Commitment, Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { env } from "./config/env";
import {
  BankMetadataMap,
  chunkedGetRawMultipleAccountInfoOrdered,
  loadBankMetadatas,
  median,
  MintLayout,
  RawMint,
} from "@mrgnlabs/mrgn-common";
import BigNumber from "bignumber.js";
import config from "./config/marginfi";

interface OracleData {
  oracleKey: string;
  oracleSetup: OracleSetup;
  maxAge: number;
  mint: PublicKey;
}

interface OracleDataWithTimestamp extends OracleData {
  timestamp: BigNumber;
}

// const marginfiConfig: MarginfiConfig = {
//   environment: "production",
//   cluster: "mainnet-beta",
//   programId: new PublicKey("MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA"),
//   groupPk: new PublicKey("4X38G7YHpS1jjc7hAKvT2dzcGuTCaZfhyDx56Qs9Tk51"),
// };

const connection: Connection = new Connection(
  env.FLUXOR_RPC_URL || "https://mainnet.helius-rpc.com/?api-key=01JTPF9HNNCBJ3ZF028K2JA3T3"
);

const { bankMetadataMap, tokenMetadataMap } = await fetchStateMetaData(config.mfiConfig);
const bankAddresses = Object.keys(bankMetadataMap).map((address) => new PublicKey(address));

export const marginfiClient = await MarginfiClient.fetch(config.mfiConfig, {} as any, connection, {
  preloadedBankAddresses: bankAddresses,
  readOnly: true,
  bundleSimRpcEndpoint: undefined,
  bankMetadataMap: bankMetadataMap,
  processTransactionStrategy: undefined,
  fetchGroupDataOverride: fetchGroupData2,
  mixinPublicKey: undefined,
});

// const clientBanks = [...marginfiClient.banks.values()];

// clientBanks.forEach((bank) => {
//   console.log(bank.address.toBase58());
//   console.log(bank);
// });

export async function fetchGroupData2(
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

  const feedIdMap = await fetchPythFeedMap2(program, groupAddress);
  const oraclePrices = await fetchOraclePrices2(program, bankDatasKeyed, feedIdMap);

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
    bankDatasKeyed.map(({ address: bankAddress }, index) => {
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

export async function fetchPythFeedMap2(
  program: MarginfiProgram,
  groupAddress: PublicKey
): Promise<Map<string, PublicKey>> {
  try {
    // 获取所有属于该 group 的银行账户
    let bankAddresses = (
      await program.provider.connection.getProgramAccounts(program.programId, {
        filters: [{ memcmp: { offset: 8 + 32 + 1, bytes: groupAddress.toBase58() } }],
        dataSlice: { length: 0, offset: 0 },
      })
    ).map((bank) => bank.pubkey.toBase58());

    // 过滤掉特定的银行地址
    const filteredBankAddresses = bankAddresses.filter((bankAddress) => !bankAddress.includes("3jt43us"));

    // 获取银行账户数据
    const banksAis = await chunkedGetRawMultipleAccountInfoOrdered(program.provider.connection, filteredBankAddresses);
    let banksMap: { address: PublicKey; data: BankRaw }[] = banksAis.map((account, index) => ({
      address: new PublicKey(filteredBankAddresses[index]),
      data: Bank.decodeBankRaw(account.data, program.idl),
    }));

    // 构建 feed ID map
    return await buildFeedIdMap(
      banksMap.map((b) => b.data.config),
      program.provider.connection
    );
  } catch (error) {
    console.error("Error in fetchPythFeedMap2:", error);
    throw error;
  }
}

export async function fetchOraclePrices2(
  program: MarginfiProgram,
  banksMap: { address: PublicKey; data: BankRaw }[],
  feedIdMap: Map<string, PublicKey>
): Promise<OraclePrice[]> {
  const SWITCHBOARD_CROSSSBAR_API = process.env.SWITCHBOARD_CROSSSBAR_API || "https://crossbar.switchboard.xyz";
  const IS_SWB_STAGE = SWITCHBOARD_CROSSSBAR_API === "https://staging.crossbar.switchboard.xyz";
  const STAKING_BANKS =
    process.env.NEXT_PUBLIC_STAKING_BANKS ||
    "https://storage.googleapis.com/mrgn-public/mrgn-staked-bank-metadata-cache.json";
  const S_MAXAGE_TIME = 10;

  let updatedOraclePriceByBank = new Map<string, OraclePrice>();

  try {
    // 获取所有银行的 Oracle 账户信息
    const requestedOraclesData = banksMap.map((b) => {
      const oracleKey = findOracleKey(BankConfig.fromAccountParsed(b.data.config), feedIdMap).toBase58();

      return {
        bankAddress: b.address,
        mint: b.data.mint,
        oracleKey,
        oracleSetup: parseOracleSetup(b.data.config.oracleSetup),
        maxAge: b.data.config.oracleMaxAge,
      };
    });

    // 获取所有 Oracle 账户数据
    const oracleAis = await chunkedGetRawMultipleAccountInfoOrdered(program.provider.connection, [
      ...requestedOraclesData.map((oracleData) => oracleData.oracleKey),
    ]);

    let swbPullOraclesStale: { data: OracleDataWithTimestamp; feedHash: string; bankAddress: PublicKey }[] = [];
    let pythStakedCollateralOracles: { data: OraclePrice; mint: PublicKey; key: string }[] = [];

    for (const index in requestedOraclesData) {
      const oracleData = requestedOraclesData[index];
      const priceDataRaw = oracleAis[index];
      let oraclePrice = parsePriceInfo(oracleData.oracleSetup, priceDataRaw.data);

      if (oraclePrice.priceRealtime.price.isNaN()) {
        oraclePrice = {
          ...oraclePrice,
          priceRealtime: {
            price: new BigNumber(0),
            confidence: new BigNumber(0),
            lowestPrice: new BigNumber(0),
            highestPrice: new BigNumber(0),
          },
          priceWeighted: {
            price: new BigNumber(0),
            confidence: new BigNumber(0),
            lowestPrice: new BigNumber(0),
            highestPrice: new BigNumber(0),
          },
        };
      }

      const currentTime = Math.round(Date.now() / 1000);
      const oracleTime = oraclePrice.timestamp.toNumber();
      const maxAge = oracleData.maxAge + S_MAXAGE_TIME;
      const isStale = currentTime - oracleTime > maxAge;

      if (oracleData.oracleSetup === OracleSetup.StakedWithPythPush) {
        pythStakedCollateralOracles.push({
          data: oraclePrice,
          key: oracleData.bankAddress.toBase58(),
          mint: oracleData.mint,
        });
        continue;
      }

      if (oracleData.oracleSetup === OracleSetup.SwitchboardPull && isStale) {
        const feedHash = Buffer.from(decodeSwitchboardPullFeedData(priceDataRaw.data).feed_hash).toString("hex");
        swbPullOraclesStale.push({
          data: { ...oracleData, timestamp: oraclePrice.timestamp },
          feedHash: feedHash,
          bankAddress: oracleData.bankAddress,
        });
        continue;
      }

      updatedOraclePriceByBank.set(oracleData.bankAddress.toBase58(), oraclePrice);
    }

    // 处理 staked collateral oracles
    if (pythStakedCollateralOracles.length > 0) {
      const bankMetadataMap = await loadBankMetadatas(`${STAKING_BANKS}?time=${new Date().getTime()}`);
      const stakedCollatMap: Record<
        string,
        {
          bankAddress: PublicKey;
          mint: PublicKey;
          stakePoolAddress: PublicKey;
          poolAddress: PublicKey;
          oracle: OraclePrice;
        }
      > = {};
      const solPools: string[] = [];
      const mints: string[] = [];

      pythStakedCollateralOracles.forEach((bankObj) => {
        const { key: bankAddress } = bankObj;
        const bankMetadata = bankMetadataMap[bankAddress];
        if (bankMetadata && bankMetadata.validatorVoteAccount) {
          const poolAddress = findPoolAddress(new PublicKey(bankMetadata.validatorVoteAccount));
          const stakePoolAddress = findPoolStakeAddress(poolAddress);

          stakedCollatMap[bankAddress] = {
            bankAddress: new PublicKey(bankAddress),
            mint: new PublicKey(bankMetadata.tokenAddress),
            stakePoolAddress,
            poolAddress,
            oracle: bankObj.data,
          };
          solPools.push(stakePoolAddress.toBase58());
          mints.push(bankMetadata.tokenAddress);
        }
      });

      const dataAis = await chunkedGetRawMultipleAccountInfoOrdered(program.provider.connection, [
        ...mints,
        ...solPools,
      ]);
      const stakePoolsAis: StakeAccount[] = dataAis.slice(mints.length).map((ai) => getStakeAccount(ai.data));
      const lstMintsAis: RawMint[] = dataAis.slice(0, mints.length).map((mintAi) => MintLayout.decode(mintAi.data));

      const lstMintRecord: Record<string, RawMint> = Object.fromEntries(mints.map((mint, i) => [mint, lstMintsAis[i]]));
      const solPoolsRecord: Record<string, StakeAccount> = Object.fromEntries(
        solPools.map((poolKey, i) => [poolKey, stakePoolsAis[i]])
      );

      for (const index in stakedCollatMap) {
        const { bankAddress, mint, stakePoolAddress, poolAddress, oracle } = stakedCollatMap[index];
        const stakeAccount = solPoolsRecord[stakePoolAddress.toBase58()];
        const tokenSupply = lstMintRecord[mint.toBase58()].supply;

        const stakeActual = Number(stakeAccount.stake.delegation.stake);

        if (oracle) {
          const adjustPrice = (price: BigNumber, stakeActual: number, tokenSupply: bigint) => {
            return Number(tokenSupply) === 0
              ? price
              : new BigNumber((price.toNumber() * (stakeActual - LAMPORTS_PER_SOL)) / Number(tokenSupply));
          };

          const adjustPriceComponent = (priceComponent: any, stakeActual: number, tokenSupply: bigint) => ({
            price: adjustPrice(priceComponent.price, stakeActual, tokenSupply),
            confidence: priceComponent.confidence,
            lowestPrice: adjustPrice(priceComponent.lowestPrice, stakeActual, tokenSupply),
            highestPrice: adjustPrice(priceComponent.highestPrice, stakeActual, tokenSupply),
          });

          const oraclePrice = {
            timestamp: oracle.timestamp,
            priceRealtime: adjustPriceComponent(oracle.priceRealtime, stakeActual, tokenSupply),
            priceWeighted: adjustPriceComponent(oracle.priceWeighted, stakeActual, tokenSupply),
          };

          updatedOraclePriceByBank.set(bankAddress.toBase58(), oraclePrice);
        }
      }
    }

    // 处理过期的 Switchboard 数据
    if (swbPullOraclesStale.length > 0) {
      const feedHashes = swbPullOraclesStale.map((value) => value.feedHash);
      const feedHashMintMap = new Map<string, PublicKey>();
      swbPullOraclesStale.forEach(({ data: { mint }, feedHash }) => {
        feedHashMintMap.set(feedHash, mint);
      });

      try {
        const feedHashesString = feedHashes.join(",");
        const response = await fetch(`${SWITCHBOARD_CROSSSBAR_API}/simulate/${feedHashesString}`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const payload = await response.json();
          for (const {
            data: { timestamp },
            bankAddress,
            feedHash,
          } of swbPullOraclesStale) {
            const feedResponse = payload.find((feed: any) => feed.feedHash === feedHash);
            let crossbarPrice;

            if (feedResponse) {
              const medianPrice = new BigNumber(median(feedResponse.results));
              crossbarPrice = {
                timestamp: new BigNumber(Math.floor(new Date().getTime() / 1000)),
                priceRealtime: {
                  price: medianPrice,
                  confidence: new BigNumber(0),
                  lowestPrice: medianPrice,
                  highestPrice: medianPrice,
                },
                priceWeighted: {
                  price: medianPrice,
                  confidence: new BigNumber(0),
                  lowestPrice: medianPrice,
                  highestPrice: medianPrice,
                },
              };
            } else {
              crossbarPrice = {
                timestamp,
                priceRealtime: {
                  price: new BigNumber(0),
                  confidence: new BigNumber(0),
                  lowestPrice: new BigNumber(0),
                  highestPrice: new BigNumber(0),
                },
                priceWeighted: {
                  price: new BigNumber(0),
                  confidence: new BigNumber(0),
                  lowestPrice: new BigNumber(0),
                  highestPrice: new BigNumber(0),
                },
              };
            }

            updatedOraclePriceByBank.set(bankAddress.toBase58(), crossbarPrice);
          }
        }
      } catch (error) {
        console.error("Error fetching from Switchboard:", error);
        // 如果 Switchboard 请求失败,使用零价格
        for (const {
          data: { timestamp },
          bankAddress,
        } of swbPullOraclesStale) {
          const zeroPrice = {
            timestamp,
            priceRealtime: {
              price: new BigNumber(0),
              confidence: new BigNumber(0),
              lowestPrice: new BigNumber(0),
              highestPrice: new BigNumber(0),
            },
            priceWeighted: {
              price: new BigNumber(0),
              confidence: new BigNumber(0),
              lowestPrice: new BigNumber(0),
              highestPrice: new BigNumber(0),
            },
          };
          updatedOraclePriceByBank.set(bankAddress.toBase58(), zeroPrice);
        }
      }
    }

    return requestedOraclesData.map((value) => updatedOraclePriceByBank.get(value.bankAddress.toBase58())!);
  } catch (error) {
    console.error("Error in fetchOraclePrices2:", error);
    throw error;
  }
}
