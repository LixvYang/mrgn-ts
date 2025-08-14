import { Connection } from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";

import { vendor } from "@mrgnlabs/marginfi-client-v2";
import { chunkedGetRawMultipleAccountInfoOrdered } from "@mrgnlabs/mrgn-common";
import { getCache, setCache, getCacheBuffer, setCacheBuffer } from "~/lib";

/*
Pyth push oracles have a specific feed id starting with 0x
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const oracleKeysRaw = req.query.oracleKeys;

    if (!oracleKeysRaw || typeof oracleKeysRaw !== "string") {
      return res.status(200).json(new Map<string, { feedId: string }>());
      // return res.status(400).json({ error: "Invalid input: expected a oracleKeys string." });
    }

    if (!process.env.PRIVATE_RPC_ENDPOINT_OVERRIDE) {
      return res.status(400).json({ error: "Invalid input: expected a private rpc endpoint." });
    }

    // 生成缓存键，基于排序后的 oracleKeys 确保相同组合生成相同缓存键
    const oracleKeys = oracleKeysRaw.split(",").map((key) => key.trim());
    const sortedOracleKeys = [...oracleKeys].sort();
    const cacheKey = `swb:oracle:map:${sortedOracleKeys.join(",")}`;

    // 尝试从缓存获取数据
    const cachedData = await getCacheBuffer(cacheKey);
    if (cachedData) {
      res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=599");
      return res.status(200).json(JSON.parse(cachedData.toString()));
    }

    const feedIdMap: Record<string, { feedId: string }> = {};

    const connection = new Connection(process.env.PRIVATE_RPC_ENDPOINT_OVERRIDE);

    const oracleAis = await chunkedGetRawMultipleAccountInfoOrdered(connection, oracleKeys);

    oracleAis.forEach((oracleAi: any, idx: number) => {
      const feedHash = Buffer.from(vendor.decodeSwitchboardPullFeedData(oracleAi.data).feed_hash).toString("hex");
      const oracleKey = oracleKeys[idx];

      feedIdMap[oracleKey] = { feedId: feedHash };
    });

    // 将数据转换为 buffer 并缓存 60 秒
    const responseBuffer = Buffer.from(JSON.stringify(feedIdMap));
    await setCacheBuffer(cacheKey, responseBuffer, 60);

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=599");
    return res.status(200).json(feedIdMap);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Error fetching data" });
  }
}
