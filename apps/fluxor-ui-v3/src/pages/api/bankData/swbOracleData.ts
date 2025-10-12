import BigNumber from "bignumber.js";
import { NextApiRequest, NextApiResponse } from "next";

import { NetworkClient, XINAssetID } from "@mixin.dev/mixin-node-sdk";
import { OraclePrice, OraclePriceDto, vendor } from "@mrgnlabs/marginfi-client-v2";
import { median, medianString } from "@mrgnlabs/mrgn-common";
import { getCache, setCache, getCacheBuffer, setCacheBuffer } from "~/lib";

const SWITCHBOARD_CROSSSBAR_API = process.env.SWITCHBOARD_CROSSSBAR_API || "https://crossbar.switchboard.xyz";

const S_MAXAGE_TIME = 10;
const STALE_WHILE_REVALIDATE_TIME = 15;

const Mixin_BTC_ASSET_ID = "c6d0c728-2624-429b-8e0d-d9d19b6592fa";
const Mixin_ETH_ASSET_ID = "43d61dcd-e413-450d-80b8-101d5e903357";
const Mixin_USDT_TRON_ASSET_ID = "b91e18ff-a9ae-3dc7-8679-e935d9a4b34b";
const Mixin_USDT_ETH_ASSET_ID = "4d8c508b-91c5-375b-92b0-ee702ed2dac5";

const FEED_ID_MIXIN_ASSET_MAP: Record<string, string> = {
  "3a763682892910586fed762422247c344565edbfe2788116391771d79e09dc4c": XINAssetID,
  ad79d0898d2c490a3a368d99092899948add87ac3cc8ee8820bf5430665fdd70: XINAssetID,
  "10ede18aafa08c2597bd5fd9be758a92854a9939a662e82b7bfaa369e66cc036": Mixin_BTC_ASSET_ID,
  "73acb2b31c7ac7d1fc441cb5cdc29cc36e0d0daeb77606b0ef8c05f9e762c10b": Mixin_ETH_ASSET_ID,
  "25c91b194efc5b63b518e2adb0f4621bcbfba39c20aa6a6f787ad8d9802bf9b2": Mixin_USDT_TRON_ASSET_ID,
  "92fd69b07be4c16afd6ce313e4ce4acceaa44fd0ea2d2f2e36ab55ae0e868cff": Mixin_USDT_ETH_ASSET_ID,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const feedIdsRaw = req.query.feedIds;

  if (!feedIdsRaw || typeof feedIdsRaw !== "string") {
    return res.status(200).json({});
    // return res.status(400).json({ error: "Invalid input: expected an array of feed base58-encoded addresses." });
  }

  const feedHashes = feedIdsRaw.split(",").map((feedId) => feedId.trim());

  try {
    // 生成缓存键，基于排序后的 feedIds 确保相同组合生成相同缓存键
    const sortedFeedHashes = [...feedHashes].sort();
    const cacheKey = `swb:oracle:data:${sortedFeedHashes.join(",")}`;

    // 尝试从缓存获取数据
    const cachedData = await getCacheBuffer(cacheKey);
    if (cachedData) {
      res.setHeader(
        "Cache-Control",
        `s-maxage=${S_MAXAGE_TIME}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_TIME}`
      );
      return res.status(200).json(JSON.parse(cachedData.toString()));
    }

    // 缓存未命中，调用远程 API
    const crossbarPrices = await handleFetchCrossbarPrices(feedHashes);
    // console.log("crossbarPrices:", crossbarPrices);

    // 将数据转换为 buffer 并缓存 10 秒
    const responseBuffer = Buffer.from(JSON.stringify(crossbarPrices));
    await setCacheBuffer(cacheKey, responseBuffer, 10);

    res.setHeader("Cache-Control", `s-maxage=${S_MAXAGE_TIME}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_TIME}`);
    return res.status(200).json(crossbarPrices);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Error fetching data" });
  }
}

async function handleFetchCrossbarPrices(feedHashes: string[]): Promise<Record<string, OraclePriceDto>> {
  try {
    // main crossbar
    const payload: vendor.CrossbarSimulatePayload = [];
    let brokenFeeds: string[] = [];

    const { payload: mainPayload, brokenFeeds: mainBrokenFeeds } = await fetchCrossbarPrices(
      feedHashes,
      SWITCHBOARD_CROSSSBAR_API
    );

    payload.push(...mainPayload);
    brokenFeeds = mainBrokenFeeds;

    if (!mainBrokenFeeds.length) {
      return await crossbarPayloadToOraclePricePerFeedHash(payload);
    }

    if (process.env.SWITCHBOARD_CROSSSBAR_API_FALLBACK) {
      // fallback crossbar
      const { payload: fallbackPayload, brokenFeeds: fallbackBrokenFeeds } = await fetchCrossbarPrices(
        brokenFeeds,
        process.env.SWITCHBOARD_CROSSSBAR_API_FALLBACK,
        process.env.SWITCHBOARD_CROSSSBAR_API_FALLBACK_USERNAME,
        process.env.SWITCHBOARD_CROSSSBAR_API_FALLBACK_BEARER
      );
      payload.push(...fallbackPayload);
      brokenFeeds = fallbackBrokenFeeds;
      if (!fallbackBrokenFeeds.length) {
        return await crossbarPayloadToOraclePricePerFeedHash(payload);
      }
    }

    if (brokenFeeds.length) {
      const formattedFeeds = brokenFeeds.map((feed) => `\`${feed}\``).join(", ");
      console.log(`Couldn't fetch from crossbar feeds: ${formattedFeeds}`);
    }

    return await crossbarPayloadToOraclePricePerFeedHash(payload);
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Couldn't fetch from crossbar");
  }
}

async function fetchCrossbarPrices(
  feedHashes: string[],
  endpoint: string,
  username?: string,
  bearer?: string
): Promise<{ payload: vendor.CrossbarSimulatePayload; brokenFeeds: string[] }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 8000);

  const isAuth = username && bearer;

  const isCrossbarMain = endpoint.includes("switchboard.xyz");

  const basicAuth = isAuth ? Buffer.from(`${username}:${bearer}`).toString("base64") : undefined;

  try {
    // 确保每个 feedHash 都有 0x 前缀
    const feedHashesWithPrefix = feedHashes.map((feedHash) => (feedHash.startsWith("0x") ? feedHash : `0x${feedHash}`));
    const feedHashesString = feedHashesWithPrefix.join(",");

    const response = await fetch(`${endpoint}/simulate/${feedHashesString}`, {
      headers: {
        Authorization: basicAuth ? `Basic ${basicAuth}` : "",
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const payload = (await response.json()) as vendor.CrossbarSimulatePayload;

    const brokenFeeds = payload
      .filter((feed) => {
        const result = feed.results[0];
        return result === null || result === undefined || isNaN(Number(result));
      })
      .map((feed) => feed.feedHash);

    const finalPayload = payload.filter((feed) => !brokenFeeds.includes(feed.feedHash));

    return { payload: finalPayload, brokenFeeds: brokenFeeds };
  } catch (error) {
    const errorMessage = isCrossbarMain ? "Couldn't fetch from crossbar" : "Couldn't fetch from fallback crossbar";
    console.log("Error:", errorMessage);
    for (const feedHash of feedHashes) {
      if (FEED_ID_MIXIN_ASSET_MAP[feedHash]) {
        try {
          const resp = await NetworkClient().fetchAsset(FEED_ID_MIXIN_ASSET_MAP[feedHash]);
          const priceUsd = resp?.price_usd;
          if (priceUsd && !isNaN(Number(priceUsd))) {
            // 如果feedHash以0x开头，则删除0x前缀
            const cleanFeedHash = feedHash.startsWith("0x") ? feedHash.slice(2) : feedHash;
            return {
              payload: [
                {
                  feedHash: cleanFeedHash,
                  results: [Number(priceUsd)],
                },
              ],
              brokenFeeds: [],
            };
          }
        } catch (e) {
          console.error("Failed to fetch XIN price from mixin.one", feedHash, e);
        }
      }
    }

    return { payload: [], brokenFeeds: feedHashes };
  }
}

async function crossbarPayloadToOraclePricePerFeedHash(
  payload: vendor.CrossbarSimulatePayload
): Promise<Record<string, OraclePriceDto>> {
  // 并发处理每个 feedResponse
  return Promise.all(
    payload.map(async (feedResponse) => {
      const oraclePrice = await crossbarFeedResultToOraclePrice(feedResponse);
      // 如果feedHash以0x开头，则删除0x前缀
      const cleanFeedHash = feedResponse.feedHash.startsWith("0x")
        ? feedResponse.feedHash.slice(2)
        : feedResponse.feedHash;
      return [cleanFeedHash, stringifyOraclePrice(oraclePrice)] as [string, OraclePriceDto];
    })
  ).then((entries) => Object.fromEntries(entries));
}

// 变为 async，支持 XIN_FEED_ID 特殊处理
async function crossbarFeedResultToOraclePrice(feedResponse: vendor.FeedResponse): Promise<OraclePrice> {
  let medianPrice = new BigNumber(0);
  if (feedResponse.results.length > 0 && typeof feedResponse.results[0] === "string") {
    medianPrice = new BigNumber(medianString(feedResponse.results.map((result) => result.toString())));
  } else {
    medianPrice = new BigNumber(median(feedResponse.results));
  }

  if (FEED_ID_MIXIN_ASSET_MAP[feedResponse.feedHash] && medianPrice.isZero()) {
    try {
      const resp = await NetworkClient().fetchAsset(FEED_ID_MIXIN_ASSET_MAP[feedResponse.feedHash]);
      const priceUsd = resp?.price_usd;
      if (priceUsd && !isNaN(Number(priceUsd))) {
        medianPrice = new BigNumber(priceUsd);
      }
    } catch (e) {
      console.error("Failed to fetch XIN price from mixin.one", e);
    }
  }

  const priceRealtime = {
    price: medianPrice,
    confidence: new BigNumber(0),
    lowestPrice: medianPrice,
    highestPrice: medianPrice,
  };

  const priceWeighted = {
    price: medianPrice,
    confidence: new BigNumber(0),
    lowestPrice: medianPrice,
    highestPrice: medianPrice,
  };

  return {
    priceRealtime,
    priceWeighted,
    timestamp: new BigNumber(Math.floor(new Date().getTime() / 1000)),
  };
}

function stringifyOraclePrice(oraclePrice: OraclePrice): OraclePriceDto {
  return {
    priceRealtime: {
      price: oraclePrice.priceRealtime.price.toString(),
      confidence: oraclePrice.priceRealtime.confidence.toString(),
      lowestPrice: oraclePrice.priceRealtime.lowestPrice.toString(),
      highestPrice: oraclePrice.priceRealtime.highestPrice.toString(),
    },
    priceWeighted: {
      price: oraclePrice.priceWeighted.price.toString(),
      confidence: oraclePrice.priceWeighted.confidence.toString(),
      lowestPrice: oraclePrice.priceWeighted.lowestPrice.toString(),
      highestPrice: oraclePrice.priceWeighted.highestPrice.toString(),
    },
    timestamp: oraclePrice.timestamp.toString(),
  };
}
