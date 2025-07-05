import Elysia, { t } from "elysia";
import { ComputerUser, MixinUser } from "../../types/user";
import { Store, store } from "../../plugins/store";
import { loggerMiddleware } from "../../middleware/logger";
import { Logger } from "pino";

export const computer = new Elysia({ prefix: "/computer" })
  .use(store)
  .use(loggerMiddleware)
  .get("/", async ({ store, logger }: { store: Store; logger: Logger }) => {
    try {
      logger.info("Getting all computer users");
      const users = await store.computerUser.list();
      return { users };
    } catch (error) {
      console.error("Failed to list computer users:", error);
      throw error;
    }
  })
  .get("/computer/:mixAddress", async ({ params, store }) => {
    try {
      const user = await store.computerUser.getByMixAddress(params.mixAddress);
      if (!user) {
        throw new Error("User not found");
      }
      return { user };
    } catch (error) {
      console.error("Failed to get computer user:", error);
      throw error;
    }
  })
  .model(
    "computerUser",
    t.Object({
      mixin_user_id: t.String(),
      mix_address: t.String(),
      computer_user_id: t.String(),
      chain_address: t.String(),
    })
  )
  .post(
    "/computer",
    async ({ body, store }) => {
      try {
        await store.computerUser.upsert(body as ComputerUser);
        return { success: true };
      } catch (error) {
        console.error("Failed to upsert computer user:", error);
        throw error;
      }
    },
    {
      body: "computerUser",
    }
  )
  .get("/mixin", async ({ store }) => {
    try {
      const users = await store.mixinUser.list();
      return { users };
    } catch (error) {
      console.error("Failed to list mixin users:", error);
      throw error;
    }
  })
  .get("/mixin/:id", async ({ params, store }) => {
    try {
      const user = await store.mixinUser.getById(params.id);
      if (!user) {
        throw new Error("User not found");
      }
      return { user };
    } catch (error) {
      console.error("Failed to get mixin user:", error);
      throw error;
    }
  })
  .model(
    "mixinUser",
    t.Object({
      id: t.String(),
      name: t.String(),
    })
  )
  .post(
    "/mixin",
    async ({ body, store }) => {
      try {
        await store.mixinUser.upsert(body as MixinUser);
        return { success: true };
      } catch (error) {
        console.error("Failed to upsert mixin user:", error);
        throw error;
      }
    },
    {
      body: "mixinUser",
    }
  );
