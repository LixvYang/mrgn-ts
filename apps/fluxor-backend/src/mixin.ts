import { MixinApi } from "@mixin.dev/mixin-node-sdk";
import { env } from "./config/env";

const keystore = {
  app_id: env.MIXIN_BOT_CLIENT_ID!,
  session_id: env.MIXIN_BOT_SESSION_ID!,
  server_public_key: env.MIXIN_BOT_SERVER_PUBLIC_KEY!,
  session_private_key: env.MIXIN_BOT_SESSION_PRIVATE_KEY!,
};

export const mixinBot = MixinApi({ keystore });
