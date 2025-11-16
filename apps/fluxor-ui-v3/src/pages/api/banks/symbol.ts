import { NextApiRequest, NextApiResponse } from "next";
import { STATUS_INTERNAL_ERROR, STATUS_OK } from "@mrgnlabs/mrgn-state";

/**
 * 银行地址到代币符号的映射表
 */
const BANK_ADDRESS_TO_SYMBOL: Record<string, string> = {
  CK1Qnz6C6uZEiJFrTSkkgV485UuDJidaSxqewzYeCU7x: "SOL",
  CnMFqmJhMdbXPAixtVfwwR3xwTid8zjTanrFbRWboFhx: "USDC",
  FJyfHYZeUzUyNzuPxABdFXMkX8D4fdrqjbLWZi9hjSFg: "USDT",
  FUjZmnqNMTYMdMTzrUR3UJ5hA8v3jMhpqP9RTxeVMU9E: "JitoSOL",
  "7uEFHAWngQ5yd8bNgcUSyG3F5sCmWoyKuGQXjrZt2xDh": "XIN",
  oHy5VfaQbLepwapcWwAhUhCt6ji8FPD81zRuSTA44uN: "BTC",
  "5nnszMQMzVwLEUyFYMoLsPCQ9B58t6emAN1bWLWEsMyq": "ETH",
  A1HA62KfSqM1kSM2FR5xwGbzMdihBsRj8HajSMmEaMPo: "USDT(ETH)",
};

/**
 * API 端点：根据银行地址返回代币符号
 *
 * 请求参数：
 * - address: 银行地址（必填）
 *
 * 响应示例：
 * { "symbol": "SOL" }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const bankAddress = req.query.address;

    if (!bankAddress || typeof bankAddress !== "string") {
      return res.status(400).json({ error: "Bank address is required" });
    }

    // 从映射表中查找对应的代币符号
    const symbol = BANK_ADDRESS_TO_SYMBOL[bankAddress];

    if (!symbol) {
      return res.status(404).json({
        error: "Bank not found",
        address: bankAddress,
      });
    }

    // 返回代币符号
    const response = {
      symbol: symbol,
    };

    // 设置缓存（24小时）
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=300");
    return res.status(STATUS_OK).json(response);
  } catch (error: any) {
    console.error("Error in bank symbol endpoint:", error);
    return res.status(STATUS_INTERNAL_ERROR).json({ error: "Internal server error" });
  }
}
