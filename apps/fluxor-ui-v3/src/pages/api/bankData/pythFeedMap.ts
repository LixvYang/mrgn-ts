import { PublicKey } from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";

import { PythPushFeedIdMap } from "@mrgnlabs/marginfi-client-v2";
import { getPythFeedIdMap } from "@mrgnlabs/mrgn-state";
import { getCache, setCache, getCacheBuffer, setCacheBuffer } from "~/lib";

/*
Pyth push oracles have a specific feed id starting with 0x
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const feedIds = req.query.feedIds;
    if (!feedIds || typeof feedIds !== "string") {
      return res.status(200).json({});
      // return res.status(400).json({ error: "Invalid input: expected a feedIds string." });
    }

    // 生成缓存键，基于排序后的 feedIds 确保相同组合生成相同缓存键
    const feedIdsArray = feedIds.split(",").map((feedId) => feedId.trim());
    const sortedFeedIds = [...feedIdsArray].sort();
    const cacheKey = `pyth:feed:map:${sortedFeedIds.join(",")}`;

    // 尝试从缓存获取数据
    const cachedData = await getCacheBuffer(cacheKey);
    if (cachedData) {
      console.log("Cache hit for Pyth feed map:", sortedFeedIds);
      res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=600");
      return res.status(200).json(JSON.parse(cachedData.toString()));
    }

    // console.log("Cache miss for Pyth feed map:", sortedFeedIds);

    const feedIdMap = await getPythFeedIdMap(feedIdsArray.map((feedId) => new PublicKey(feedId)));
    const stringifiedFeedIdMap = stringifyFeedIdMap(feedIdMap);

    // 将数据转换为 buffer 并缓存 10 秒
    const responseBuffer = Buffer.from(JSON.stringify(stringifiedFeedIdMap));
    await setCacheBuffer(cacheKey, responseBuffer, 10);

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=600");
    return res.status(200).json(stringifiedFeedIdMap);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Error fetching data" });
  }
}

function stringifyFeedIdMap(feedIdMap: PythPushFeedIdMap) {
  let feedIdMap2: Record<string, { feedId: string; shardId?: number }> = {};

  feedIdMap.forEach((value, key) => {
    feedIdMap2[key] = { feedId: value.feedId.toBase58(), shardId: value.shardId };
  });
  return feedIdMap2;
}
