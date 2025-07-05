import Elysia, { t } from "elysia";
import { propertyStore } from "../../store/property";

export const property = new Elysia({ prefix: "/property" })
  .decorate("store", {
    property: propertyStore,
  })
  .get("/", async ({ store }) => {
    const properties = await store.property.list();
    return Object.fromEntries(properties);
  })

  .get(
    "/:key",
    async ({ params: { key }, store }) => {
      const value = await store.property.get(key);
      if (value === null) {
        throw new Error("Property not found");
      }
      return { key, value };
    },
    {
      params: t.Object({
        key: t.String(),
      }),
    }
  )

  .get(
    "/prefix/:prefix",
    async ({ params: { prefix }, store }) => {
      const properties = await store.property.getByPrefix(prefix);
      return Object.fromEntries(properties);
    },
    {
      params: t.Object({
        prefix: t.String(),
      }),
    }
  )
  .model(
    "post",
    t.Object({
      key: t.String(),
      value: t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]),
    })
  )
  .post(
    "/",
    async ({ body, store }) => {
      const { key, value } = body;
      await store.property.save(key, value);
      return { message: "Property saved successfully" };
    },
    {
      body: "post",
    }
  )

  .post(
    "/batch",
    async ({ body, store }) => {
      await store.property.batchSave(body.properties);
      return { message: "Properties saved successfully" };
    },
    {
      body: t.Object({
        properties: t.Array(
          t.Object({
            key: t.String(),
            value: t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]),
          })
        ),
      }),
    }
  )

  .delete(
    "/:key",
    async ({ params: { key }, store }) => {
      await store.property.delete(key);
      return { message: "Property deleted successfully" };
    },
    {
      params: t.Object({
        key: t.String(),
      }),
    }
  )

  .delete(
    "/prefix/:prefix",
    async ({ params: { prefix }, store }) => {
      await store.property.deleteByPrefix(prefix);
      return { message: "Properties deleted successfully" };
    },
    {
      params: t.Object({
        prefix: t.String(),
      }),
    }
  )

  .get(
    "/:key/exists",
    async ({ params: { key }, store }) => {
      const exists = await store.property.exists(key);
      return { exists };
    },
    {
      params: t.Object({
        key: t.String(),
      }),
    }
  )

  .get(
    "/:key/updated-at",
    async ({ params: { key }, store }) => {
      const updatedAt = await store.property.getUpdatedAt(key);
      if (updatedAt === null) {
        throw new Error("Property not found");
      }
      return { updatedAt };
    },
    {
      params: t.Object({
        key: t.String(),
      }),
    }
  );
