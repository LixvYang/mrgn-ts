import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { propertyStore } from "./property";
import { PropertyValue } from "../types/property";
import { sql } from "./index";

describe("PropertyStore Integration Tests", () => {
  beforeEach(async () => {
    try {
      await sql`TRUNCATE TABLE properties`;
    } catch (error) {
      console.error("Failed to truncate table:", error);
    }
  });

  afterAll(async () => {
    try {
      await sql`TRUNCATE TABLE properties`;
      await sql.end();
    } catch (error) {
      console.error("Failed to cleanup:", error);
    }
  });

  describe("Basic CRUD operations", () => {
    it("should be able to save and get properties", async () => {
      const key = "test.key";
      const value = "test-value";

      await propertyStore.save(key, value);
      const result = await propertyStore.get(key);

      expect(result).toBe(value);
    });

    it("should be able to update existing properties", async () => {
      const key = "test.key";
      const initialValue = "initial-value";
      const updatedValue = "updated-value";

      await propertyStore.save(key, initialValue);
      await propertyStore.save(key, updatedValue);
      const result = await propertyStore.get(key);

      expect(result).toBe(updatedValue);
    });

    it("should be able to delete properties", async () => {
      const key = "test.key";
      const value = "test-value";

      await propertyStore.save(key, value);
      await propertyStore.delete(key);
      const result = await propertyStore.get(key);

      expect(result).toBeNull();
    });

    it("should return null for non-existent properties", async () => {
      const result = await propertyStore.get("non.existent.key");
      expect(result).toBeNull();
    });
  });

  describe("Batch operations", () => {
    it("should be able to batch save properties", async () => {
      const properties = [
        { key: "batch.key1", value: "value1" },
        { key: "batch.key2", value: "value2" },
        { key: "batch.key3", value: "value3" },
      ];

      await propertyStore.batchSave(properties);

      const results = await propertyStore.list();
      expect(results.size).toBe(3);
      expect(results.get("batch.key1")).toBe("value1");
      expect(results.get("batch.key2")).toBe("value2");
      expect(results.get("batch.key3")).toBe("value3");
    });

    it("should be able to get properties by prefix", async () => {
      const properties = [
        { key: "prefix.key1", value: "value1" },
        { key: "prefix.key2", value: "value2" },
        { key: "other.key", value: "value3" },
      ];

      await propertyStore.batchSave(properties);

      const results = await propertyStore.getByPrefix("prefix.");
      expect(results.size).toBe(2);
      expect(results.get("prefix.key1")).toBe("value1");
      expect(results.get("prefix.key2")).toBe("value2");
    });

    it("should be able to delete properties by prefix", async () => {
      const properties = [
        { key: "delete.key1", value: "value1" },
        { key: "delete.key2", value: "value2" },
        { key: "keep.key", value: "value3" },
      ];

      await propertyStore.batchSave(properties);
      await propertyStore.deleteByPrefix("delete.");

      const results = await propertyStore.list();
      expect(results.size).toBe(1);
      expect(results.get("keep.key")).toBe("value3");
    });
  });

  describe("Special value handling", () => {
    it("should be able to handle different types of values", async () => {
      const testCases: Array<{ key: string; value: PropertyValue }> = [
        { key: "string.test", value: "string-value" },
        { key: "number.test", value: 123 },
        { key: "boolean.test", value: true },
        { key: "null.test", value: null },
      ];

      await propertyStore.batchSave(testCases);

      for (const { key, value } of testCases) {
        const result = await propertyStore.get(key);
        expect(result).toBe(value);
      }
    });
  });

  describe("Metadata and helper methods", () => {
    it("should be able to check if a property exists", async () => {
      const key = "exists.test";

      expect(await propertyStore.exists(key)).toBe(false);

      await propertyStore.save(key, "value");
      expect(await propertyStore.exists(key)).toBe(true);
    });

    it("should be able to get the update time", async () => {
      const key = "timestamp.test";

      const now = new Date();
      await propertyStore.save(key, "value");
      const timestamp = await propertyStore.getUpdatedAt(key);

      expect(timestamp).toBeInstanceOf(Date);

      const timeDiff = Math.abs(timestamp!.getTime() - now.getTime());
      expect(timeDiff).toBeLessThan(2000);
    });

    it("should return null for the update time of a non-existent property", async () => {
      const timestamp = await propertyStore.getUpdatedAt("non.existent.key");
      expect(timestamp).toBeNull();
    });
  });
});
