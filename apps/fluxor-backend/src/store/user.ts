import { sql } from "./index";
import { ComputerUser, MixinUser } from "../types/user";

export class PostgresComputerUserStore {
  async upsert(user: ComputerUser): Promise<void> {
    await sql`
      INSERT INTO computer_users (
        mixin_user_id,
        mix_address,
        computer_user_id,
        chain_address,
        created_at,
        updated_at
      ) VALUES (
        ${user.mixin_user_id},
        ${user.mix_address},
        ${user.computer_user_id},
        ${user.chain_address},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (computer_user_id) DO UPDATE SET
        mixin_user_id = EXCLUDED.mixin_user_id,
        mix_address = EXCLUDED.mix_address,
        chain_address = EXCLUDED.chain_address,
        updated_at = CURRENT_TIMESTAMP
    `;
  }

  async getByMixAddress(mixAddress: string): Promise<ComputerUser | null> {
    const [user] = await sql<ComputerUser[]>`
      SELECT * FROM computer_users
      WHERE mix_address = ${mixAddress}
      LIMIT 1
    `;
    return user || null;
  }

  async list(): Promise<ComputerUser[]> {
    return await sql<ComputerUser[]>`
      SELECT * FROM computer_users
      ORDER BY created_at DESC
    `;
  }
}

export class PostgresMixinUserStore {
  async upsert(user: MixinUser): Promise<void> {
    await sql`
      INSERT INTO mixin_users (
        id,
        name,
        created_at,
        updated_at
      ) VALUES (
        ${user.id},
        ${user.name},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = CURRENT_TIMESTAMP
    `;
  }

  async getById(id: string): Promise<MixinUser | null> {
    const [user] = await sql<MixinUser[]>`
      SELECT * FROM mixin_users
      WHERE id = ${id}
      LIMIT 1
    `;
    return user || null;
  }

  async list(): Promise<MixinUser[]> {
    return await sql<MixinUser[]>`
      SELECT * FROM mixin_users
      ORDER BY created_at DESC
    `;
  }
}

// 创建单例实例
export const computerUserStore = new PostgresComputerUserStore();
export const mixinUserStore = new PostgresMixinUserStore();
