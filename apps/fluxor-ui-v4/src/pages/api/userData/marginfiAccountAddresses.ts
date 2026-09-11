import { NextApiRequest, NextApiResponse } from "next";
import { Connection, PublicKey } from "@solana/web3.js";

import config from "~/config/marginfi";
import { resolveMarginfiAccounts } from "~/lib/marginfiAccountIndex";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { authority, group } = req.query;

  if (!authority) {
    return res.status(400).json({ error: "No authority address provided" });
  }

  if (!group) {
    return res.status(400).json({ error: "No group address provided" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.PRIVATE_RPC_ENDPOINT_OVERRIDE) {
    return res.status(400).json({ error: "PRIVATE_RPC_ENDPOINT_OVERRIDE is not set" });
  }

  let authorityPk: PublicKey;
  let groupPk: PublicKey;
  try {
    authorityPk = new PublicKey(authority);
    groupPk = new PublicKey(group);
  } catch {
    return res.status(400).json({ error: "Invalid authority or group address" });
  }

  try {
    const connection = new Connection(process.env.PRIVATE_RPC_ENDPOINT_OVERRIDE);

    // 不再每个请求跑一次 getProgramAccounts：按 group 建一次索引并缓存，这里只是查 map。
    // 索引建不起来（RPC 拒绝索引类请求）时内部会回落到 knownMarginfiAccounts 静态快照。
    const marginfiAccounts = await resolveMarginfiAccounts(
      connection,
      config.mfiConfig.programId,
      groupPk.toBase58(),
      authorityPk.toBase58()
    );

    res.status(200).json({ marginfiAccounts });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error processing request" });
  }
}
