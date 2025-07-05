export const env = {
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || "0.0.0.0",
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/fluxor?TimeZone=Asia/Shanghai",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  DATABASE_POOL_MIN: Number(process.env.DATABASE_POOL_MIN || 1),
  DATABASE_POOL_MAX: Number(process.env.DATABASE_POOL_MAX || 10),
  API_PREFIX: process.env.API_PREFIX || "",
  NODE_ENV: process.env.NODE_ENV || "development",
  MIXIN_BOT_CLIENT_ID: process.env.MIXIN_BOT_CLIENT_ID,
  MIXIN_BOT_CLIENT_SECRET: process.env.MIXIN_BOT_CLIENT_SECRET,
  MIXIN_BOT_SESSION_ID: process.env.MIXIN_BOT_SESSION_ID,
  MIXIN_BOT_SERVER_PUBLIC_KEY: process.env.MIXIN_BOT_SERVER_PUBLIC_KEY,
  MIXIN_BOT_SESSION_PRIVATE_KEY: process.env.MIXIN_BOT_SESSION_PRIVATE_KEY,
} as const;

export type Env = typeof env;
