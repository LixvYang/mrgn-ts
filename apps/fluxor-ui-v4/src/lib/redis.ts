import Redis from "ioredis";

// Redis 连接实例
let redis: Redis | null = null;

// Redis URL 配置
const REDIS_URL = process.env.REDIS_URL;

// 是否启用 Redis（只有设置了 REDIS_URL 才启用）
const isRedisEnabled = !!REDIS_URL;

/**
 * 初始化 Redis 连接
 */
function initializeRedis(): Redis | null {
  if (!isRedisEnabled) {
    console.log("Redis is disabled. Set REDIS_URL environment variable to enable.");
    return null;
  }

  if (redis) {
    return redis;
  }

  try {
    const config: any = {
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      maxLoadingTimeout: 10000,
    };

    redis = new Redis(REDIS_URL!, config);

    redis.on("connect", () => {
      console.log("Redis connected successfully");
    });

    redis.on("error", (error) => {
      console.error("Redis connection error:", error);
    });

    redis.on("close", () => {
      console.log("Redis connection closed");
    });

    return redis;
  } catch (error) {
    console.error("Failed to initialize Redis:", error);
    return null;
  }
}

/**
 * 获取 Redis 实例
 */
function getRedis(): Redis | null {
  if (!isRedisEnabled) {
    return null;
  }

  if (!redis) {
    return initializeRedis();
  }

  return redis;
}

/**
 * 关闭 Redis 连接
 */
function closeRedis(): void {
  if (redis) {
    redis.disconnect();
    redis = null;
  }
}

/**
 * 检查 Redis 是否可用
 */
function isRedisAvailable(): boolean {
  return isRedisEnabled && redis !== null;
}

/**
 * 设置缓存值
 */
async function setCache(key: string, value: any, ttl?: number): Promise<void> {
  const redisInstance = getRedis();
  if (!redisInstance) {
    console.warn("Redis not available, skipping cache set");
    return;
  }

  try {
    const serializedValue = typeof value === "string" ? value : JSON.stringify(value);
    if (ttl) {
      await redisInstance.setex(key, ttl, serializedValue);
    } else {
      await redisInstance.set(key, serializedValue);
    }
  } catch (error) {
    console.error("Failed to set cache:", error);
  }
}

/**
 * 设置缓存值（Buffer 格式）
 */
async function setCacheBuffer(key: string, value: Buffer, ttl?: number): Promise<void> {
  const redisInstance = getRedis();
  if (!redisInstance) {
    console.warn("Redis not available, skipping cache set");
    return;
  }

  try {
    if (ttl) {
      await redisInstance.setex(key, ttl, value);
    } else {
      await redisInstance.set(key, value);
    }
  } catch (error) {
    console.error("Failed to set cache buffer:", error);
  }
}

/**
 * 获取缓存值
 */
async function getCache<T = any>(key: string): Promise<T | null> {
  const redisInstance = getRedis();
  if (!redisInstance) {
    console.warn("Redis not available, skipping cache get");
    return null;
  }

  try {
    const value = await redisInstance.get(key);
    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  } catch (error) {
    console.error("Failed to get cache:", error);
    return null;
  }
}

/**
 * 获取缓存值（Buffer 格式）
 */
async function getCacheBuffer(key: string): Promise<Buffer | null> {
  const redisInstance = getRedis();
  if (!redisInstance) {
    console.warn("Redis not available, skipping cache get");
    return null;
  }

  try {
    const value = await redisInstance.get(key);
    if (value === null) {
      return null;
    }

    // 将字符串转换为 Buffer
    return Buffer.from(value, "utf8");
  } catch (error) {
    console.error("Failed to get cache buffer:", error);
    return null;
  }
}

/**
 * 删除缓存
 */
async function deleteCache(key: string): Promise<void> {
  const redisInstance = getRedis();
  if (!redisInstance) {
    console.warn("Redis not available, skipping cache delete");
    return;
  }

  try {
    await redisInstance.del(key);
  } catch (error) {
    console.error("Failed to delete cache:", error);
  }
}

/**
 * 检查键是否存在
 */
async function existsCache(key: string): Promise<boolean> {
  const redisInstance = getRedis();
  if (!redisInstance) {
    return false;
  }

  try {
    const result = await redisInstance.exists(key);
    return result === 1;
  } catch (error) {
    console.error("Failed to check cache existence:", error);
    return false;
  }
}

/**
 * 设置缓存过期时间
 */
async function expireCache(key: string, ttl: number): Promise<void> {
  const redisInstance = getRedis();
  if (!redisInstance) {
    console.warn("Redis not available, skipping cache expire");
    return;
  }

  try {
    await redisInstance.expire(key, ttl);
  } catch (error) {
    console.error("Failed to set cache expire:", error);
  }
}

/**
 * 获取 Redis 连接状态
 */
function getRedisStatus(): { isServer: boolean; isEnabled: boolean; isConnected: boolean; hasUrl: boolean } {
  return {
    isServer: true,
    isEnabled: isRedisEnabled,
    isConnected: redis !== null,
    hasUrl: !!REDIS_URL,
  };
}

export {
  initializeRedis,
  getRedis,
  closeRedis,
  isRedisAvailable,
  setCache,
  setCacheBuffer,
  getCache,
  getCacheBuffer,
  deleteCache,
  existsCache,
  expireCache,
  getRedisStatus,
};
