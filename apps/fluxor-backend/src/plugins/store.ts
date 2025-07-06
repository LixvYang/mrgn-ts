import { Elysia } from "elysia";
import { propertyStore, PropertyStore } from "../store/property";
import { computerUserStore, mixinUserStore, PostgresComputerUserStore, PostgresMixinUserStore } from "../store/user";

export type Store = {
  property: PropertyStore;
  computerUser: PostgresComputerUserStore;
  mixinUser: PostgresMixinUserStore;
};

// 创建插件
export const store = new Elysia().decorate("store", {
  property: propertyStore,
  computerUser: computerUserStore,
  mixinUser: mixinUserStore,
});
