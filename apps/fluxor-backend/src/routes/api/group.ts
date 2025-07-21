import { Elysia } from "elysia";
import { marginfiClient } from "../../marginfi";
import { redisClient } from "../../store";
import { PublicKey } from "@solana/web3.js";
import { Bank, MarginfiGroup } from "@mrgnlabs/marginfi-client-v2";
import { logger } from "../../config/logger";

export const groupRouter = new Elysia({ prefix: "/group" }).get("/:groupAddress", async ({ params }) => {
  try {
    const groupAddress = new PublicKey(params.groupAddress);
    const hashKey = `hash:group:${groupAddress.toBase58()}`;
    const groupData = await redisClient.hgetall(hashKey);

    const marginfiGroup = JSON.parse(groupData.group || "{}");
    const banksObj = JSON.parse(groupData.banks || "{}");
    const priceInfosObj = JSON.parse(groupData.priceInfos || "{}");
    const tokenDatasObj = JSON.parse(groupData.tokenDatas || "{}");
    const feedIdMapObj = JSON.parse(groupData.feedIdMap || "{}");

    return {
      marginfiGroup,
      banks: banksObj || {},
      priceInfos: priceInfosObj || {},
      tokenDatas: tokenDatasObj || {},
      feedIdMap: feedIdMapObj || {},
    };
  } catch (error) {
    logger.error("Error fetching group data:", error);
    throw error;
  }
});
