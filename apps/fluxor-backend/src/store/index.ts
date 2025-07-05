import postgres from "postgres";
import { env } from "../config/env";
import { Redis } from "ioredis";

export const redisClient = new Redis(env.REDIS_URL);

// Create a PostgreSQL connection pool
export const sql = postgres(env.DATABASE_URL, {
  max: env.DATABASE_POOL_MAX,
  idle_timeout: 20,
  connect_timeout: 10,

  types: {
    // Add custom type parsers if needed
  },

  onnotice: (notice) => {
    // console.log("Database Notice:", notice.message);
  },
});

// Health check query
export const checkDatabaseConnection = async () => {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
};

const initSqls = [
  `CREATE TABLE IF NOT EXISTS properties (
    key VARCHAR(64) PRIMARY KEY,
    value VARCHAR(256),
    updated_at TIMESTAMP(6)
  );`,
  `CREATE TABLE IF NOT EXISTS mixin_users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6)
  );`,
  `CREATE TABLE IF NOT EXISTS computer_users (
    id BIGSERIAL PRIMARY KEY,
    mixin_user_id VARCHAR(36) NOT NULL,
    mix_address VARCHAR(255) NOT NULL,
    computer_user_id VARCHAR(36) NOT NULL,
    chain_address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6)
  );
  CREATE INDEX IF NOT EXISTS idx_computer_users_mix_address ON computer_users(mix_address);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_computer_users_computer_user_id ON computer_users(computer_user_id);
  CREATE INDEX IF NOT EXISTS idx_computer_users_mixin_user_id ON computer_users(mixin_user_id);`,
  `CREATE TABLE IF NOT EXISTS operates (
    call_trace_id VARCHAR(36) PRIMARY KEY,
    mixin_user_id VARCHAR(36) NOT NULL,
    computer_user_id VARCHAR(36) NOT NULL,
    operate_extra JSONB NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6)
  );
  CREATE INDEX IF NOT EXISTS idx_operates_mixin_user_id ON operates(mixin_user_id);
  CREATE INDEX IF NOT EXISTS idx_operates_computer_user_id ON operates(computer_user_id);
  CREATE INDEX IF NOT EXISTS idx_operates_created_at ON operates(created_at);
  `,
  `
  CREATE TABLE IF NOT EXISTS operate_results (
    computer_user_id VARCHAR(36) NOT NULL,
    call_trace_id VARCHAR(36) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    state VARCHAR(20) NOT NULL,
    raw TEXT,
    reason TEXT,
    nonce_account VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (call_trace_id)
  );
  CREATE INDEX IF NOT EXISTS idx_operate_results_computer_user_id ON operate_results(computer_user_id);
  CREATE INDEX IF NOT EXISTS idx_operate_results_call_trace_id ON operate_results(call_trace_id);
  CREATE INDEX IF NOT EXISTS idx_operate_results_created_at ON operate_results(created_at);
  CREATE INDEX IF NOT EXISTS idx_operate_results_updated_at ON operate_results(updated_at);
  CREATE INDEX IF NOT EXISTS idx_operate_results_state ON operate_results(state);
  `,
];

const init = async () => {
  try {
    for (const s of initSqls) {
      await sql.unsafe(s);
    }
  } catch (error) {
    console.error("Initialization error:", error);
    throw error;
  }
};

init().catch((error) => {
  console.error("Failed to initialize:", error);
  process.exit(1);
});
