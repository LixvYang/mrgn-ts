import { PublicKey } from "@solana/web3.js";
import { marginfiClient } from "../marginfi";
import { Bank, MarginfiGroup, MintData, OraclePrice } from "@mrgnlabs/marginfi-client-v2";
import { chunkedGetRawMultipleAccountInfoOrdered } from "@mrgnlabs/mrgn-common";
import { fetchOraclePrices2, fetchPythFeedMap2 } from "../marginfi";
import { redisClient } from "../store";
import { logger } from "../config/logger";

export async function refreshGroupData(groupAddress: PublicKey) {
  try {
    const program = marginfiClient.program;

    let bankAccountsData = await program.account.bank.all([
      { memcmp: { offset: 8 + 32 + 1, bytes: groupAddress.toBase58() } },
    ]);
    const bankDatasKeyed = bankAccountsData.map((account: any) => ({
      address: account.publicKey,
      data: account.account,
    }));

    const feedIdMap = await fetchPythFeedMap2(program, groupAddress);
    const oraclePrices = await fetchOraclePrices2(program, bankDatasKeyed, feedIdMap);

    const mintKeys = bankDatasKeyed.map((b) => b.data.mint);
    const emissionMintKeys = bankDatasKeyed
      .map((b) => b.data.emissionsMint)
      .filter((pk) => !pk.equals(PublicKey.default)) as PublicKey[];

    const allAis = await chunkedGetRawMultipleAccountInfoOrdered(program.provider.connection, [
      groupAddress.toBase58(),
      ...mintKeys.map((pk) => pk.toBase58()),
      ...emissionMintKeys.map((pk) => pk.toBase58()),
    ]);

    const groupAi = allAis.shift();
    const mintAis = allAis.splice(0, mintKeys.length);
    const emissionMintAis = allAis.splice(0);

    if (!groupAi) throw new Error("Failed to fetch the on-chain group data");
    const marginfiGroup = MarginfiGroup.fromBuffer(groupAddress, groupAi.data, program.idl);

    const banks: Map<string, Bank> = new Map(
      bankDatasKeyed.map(({ address, data }) => {
        const bankMetadata = marginfiClient.bankMetadataMap
          ? marginfiClient.bankMetadataMap[address.toBase58()]
          : undefined;
        const bank = Bank.fromAccountParsed(address, data, feedIdMap, bankMetadata);
        return [address.toBase58(), bank];
      })
    );

    const tokenDatas: Map<string, MintData> = new Map(
      bankDatasKeyed.map(({ address: bankAddress, data: bankData }, index) => {
        const mintAddress = mintKeys[index];
        const mintDataRaw = mintAis[index];
        if (!mintDataRaw) throw new Error(`Failed to fetch mint account for bank ${bankAddress.toBase58()}`);
        let emissionTokenProgram: PublicKey | null = null;
        if (!bankData.emissionsMint.equals(PublicKey.default)) {
          const emissionMintDataRawIndex = emissionMintKeys.findIndex((pk) => pk.equals(bankData.emissionsMint));
          emissionTokenProgram = emissionMintDataRawIndex >= 0 ? emissionMintAis[emissionMintDataRawIndex].owner : null;
        }
        return [
          bankAddress.toBase58(),
          { mint: mintAddress, tokenProgram: mintDataRaw.owner, feeBps: 0, emissionTokenProgram },
        ];
      })
    );

    const priceInfos: Map<string, OraclePrice> = new Map(
      bankDatasKeyed.map(({ address: bankAddress }, index) => {
        const priceData = oraclePrices[index];
        if (!priceData) throw new Error(`Failed to fetch price oracle account for bank ${bankAddress.toBase58()}`);
        return [bankAddress.toBase58(), priceData];
      })
    );

    const hashKey = `hash:group:${groupAddress.toBase58()}`;

    const banksObj = Object.fromEntries(banks);

    const priceInfosObj = Object.fromEntries(priceInfos);

    const tokenDatasObj = Object.fromEntries(tokenDatas);

    const feedIdMapObj = Object.fromEntries(
      Array.from(feedIdMap.entries()).map(([key, value]) => [key, value.toBase58()])
    );

    await redisClient.hset(
      hashKey,
      "group",
      JSON.stringify(marginfiGroup),
      "banks",
      JSON.stringify(banksObj),
      "priceInfos",
      JSON.stringify(priceInfosObj),
      "tokenDatas",
      JSON.stringify(tokenDatasObj),
      "feedIdMap",
      JSON.stringify(feedIdMapObj)
    );

    logger.info(`Updated group data for ${groupAddress.toBase58()}`);

    return {
      marginfiGroup,
      banks: banksObj,
      priceInfos: priceInfosObj,
      tokenDatas: tokenDatasObj,
      feedIdMap: feedIdMapObj,
    };
  } catch (error) {
    logger.error(`Error refreshing group data for ${groupAddress.toBase58()}:`, error);
    throw error;
  }
}

export async function startGroupDataRefreshTask() {
  const groupAddress = marginfiClient.config.groupPk;

  // 立即执行一次
  await refreshGroupData(groupAddress);

  // // 每5秒执行一次
  // setInterval(async () => {
  //   try {
  //     await refreshGroupData(groupAddress);
  //   } catch (error) {
  //     logger.error("Error in group data refresh task:", error);
  //   }
  // }, 5000);
}
