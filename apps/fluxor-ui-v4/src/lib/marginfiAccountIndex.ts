import { Connection, PublicKey } from "@solana/web3.js";

import { lookupKnownMarginfiAccounts } from "~/config/knownMarginfiAccounts";
import { getCache, setCache } from "~/lib/redis";

/**
 * group 级别的 marginfi 账户索引。
 *
 * 背景：marginfi 账户不是 PDA，按 authority 反查只能 getProgramAccounts + memcmp。
 * 每个用户请求都跑一次 gPA 既慢又容易触发 RPC 限额，而一个 group 下的账户数量很少
 * （Mixin Computer group 目前 26 个），所以改成：整组扫一次 → 建 authority -> accounts
 * 映射 → 缓存 → 之后所有用户请求直接查 map。
 *
 * 三层回退：
 *   L1 进程内 Map（最快，随进程重启丢失）
 *   L2 Redis（跨实例共享、可跨重启，未配置 REDIS_URL 时自动跳过）
 *   L3 src/config/knownMarginfiAccounts.ts 的静态快照（RPC 不支持 gPA 时的兜底）
 */

/** MarginfiAccount 账户大小。链上核实：group 4X38G7YH… 下 26 个账户全部为 2312 字节。 */
const MARGINFI_ACCOUNT_SIZE = 2312;
/** 账户布局：[0..8) discriminator, [8..40) group, [40..72) authority */
const GROUP_OFFSET = 8;
const AUTHORITY_OFFSET = 40;

const DEFAULT_TTL_SECONDS = 60;
const parsedTtl = Number(process.env.MARGINFI_ACCOUNT_INDEX_TTL_SECONDS);
const TTL_SECONDS = Number.isFinite(parsedTtl) && parsedTtl > 0 ? parsedTtl : DEFAULT_TTL_SECONDS;

/**
 * 扫描失败后的冷却期。当前 RPC 拒绝索引类请求时 gPA 每次都会抛错，没有这个冷却
 * 就会变成"每个用户请求都打一次注定失败的 RPC"。
 */
const FAILURE_BACKOFF_MS = 30_000;

const CACHE_VERSION = "v1";

type AccountsByAuthority = Record<string, string[]>;

type CacheEntry = {
  byAuthority: AccountsByAuthority;
  fetchedAt: number;
};

const memoryCache = new Map<string, CacheEntry>();
/** 同一个 group 的并发请求共用一次扫描，避免冷启动时打出一堆 gPA。 */
const inflight = new Map<string, Promise<CacheEntry | null>>();
const lastFailureAt = new Map<string, number>();

const redisKey = (group: string) => `mfi:accountIndex:${CACHE_VERSION}:${group}`;

const isFresh = (entry: CacheEntry) => Date.now() - entry.fetchedAt < TTL_SECONDS * 1000;

/**
 * 直接看 REDIS_URL，而不是用 redis.ts 的 isRedisAvailable()：后者在首次 getRedis()
 * 之前恒为 false，拿它当判断会导致 Redis 永远不被初始化。未配置时跳过，避免
 * redis.ts 在每个请求上打 "Redis not available" 警告。
 */
const redisEnabled = () => !!process.env.REDIS_URL;

/** 整组扫描：只取 authority 字段（dataSlice 32 字节），不解码账户全量数据。 */
async function scanGroup(connection: Connection, programId: PublicKey, group: string): Promise<CacheEntry> {
  const accounts = await connection.getProgramAccounts(programId, {
    dataSlice: { offset: AUTHORITY_OFFSET, length: 32 },
    filters: [{ dataSize: MARGINFI_ACCOUNT_SIZE }, { memcmp: { offset: GROUP_OFFSET, bytes: group } }],
  });

  const byAuthority: AccountsByAuthority = {};
  for (const { pubkey, account } of accounts) {
    // dataSize 过滤保证了切片一定是完整的 32 字节，PublicKey 不会因长度不足抛错。
    const authority = new PublicKey(account.data).toBase58();
    const existing = byAuthority[authority];
    if (existing) {
      existing.push(pubkey.toBase58());
    } else {
      byAuthority[authority] = [pubkey.toBase58()];
    }
  }

  return { byAuthority, fetchedAt: Date.now() };
}

async function loadIndex(connection: Connection, programId: PublicKey, group: string): Promise<CacheEntry | null> {
  const cached = memoryCache.get(group);
  if (cached && isFresh(cached)) {
    return cached;
  }

  if (redisEnabled()) {
    // Redis 里的值受 TTL 约束，取到即视为新鲜。
    const fromRedis = await getCache<AccountsByAuthority>(redisKey(group));
    if (fromRedis && typeof fromRedis === "object") {
      const entry: CacheEntry = { byAuthority: fromRedis, fetchedAt: Date.now() };
      memoryCache.set(group, entry);
      return entry;
    }
  }

  // 冷却期内不再重试扫描；有过期副本就先用着，没有就让调用方回落到静态快照。
  const failedAt = lastFailureAt.get(group);
  if (failedAt !== undefined && Date.now() - failedAt < FAILURE_BACKOFF_MS) {
    return cached ?? null;
  }

  let pending = inflight.get(group);
  if (!pending) {
    pending = scanGroup(connection, programId, group)
      .then(async (entry) => {
        memoryCache.set(group, entry);
        lastFailureAt.delete(group);
        if (redisEnabled()) {
          await setCache(redisKey(group), entry.byAuthority, TTL_SECONDS);
        }
        return entry;
      })
      .catch((error) => {
        lastFailureAt.set(group, Date.now());
        console.warn(`marginfi account index scan failed for group ${group}:`, error);
        return null;
      })
      .finally(() => {
        inflight.delete(group);
      });
    inflight.set(group, pending);
  }

  // 扫描失败时继续用过期的内存副本，好过直接失败。
  return (await pending) ?? cached ?? null;
}

/**
 * 返回该 authority 在该 group 下的 marginfi 账户地址。
 *
 * 索引建立成功时结果是权威的 —— 查不到就是真的没有账户，返回空数组。
 * 索引建不起来（比如 RPC 拒绝 getProgramAccounts）才回落到静态快照。
 */
export async function resolveMarginfiAccounts(
  connection: Connection,
  programId: PublicKey,
  group: string,
  authority: string
): Promise<string[]> {
  const index = await loadIndex(connection, programId, group);
  if (index) {
    return index.byAuthority[authority] ?? [];
  }

  return lookupKnownMarginfiAccounts(group, authority) ?? [];
}
