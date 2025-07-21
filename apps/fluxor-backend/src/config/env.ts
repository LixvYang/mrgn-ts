import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.string().default("3000"),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  DATABASE_POOL_MAX: z.coerce.number().default(10),
  FLUXOR_RPC_URL: z.string().optional(),
  MIXIN_BOT_CLIENT_ID: z.string().optional(),
  MIXIN_BOT_SESSION_ID: z.string().optional(),
  MIXIN_BOT_SERVER_PUBLIC_KEY: z.string().optional(),
  MIXIN_BOT_SESSION_PRIVATE_KEY: z.string().optional(),
  NEXT_PUBLIC_MARGINFI_ENVIRONMENT: z.string().optional(),
  NEXT_PUBLIC_MARGINFI_GROUP_OVERRIDE: z.string().optional(),
  NEXT_PUBLIC_MARGINFI_PROGRAM_OVERRIDE: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = typeof env;
