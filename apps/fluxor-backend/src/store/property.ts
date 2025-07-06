import { sql } from "./index";
import { PropertyValue } from "../types/property";

export class PropertyStore {
  private serializeValue(value: PropertyValue): string | null {
    if (value === null) {
      return null;
    }
    return String(value);
  }

  private deserializeValue(value: string | null): PropertyValue {
    if (value === null) {
      return null;
    }
    if (value === "true") return true;
    if (value === "false") return false;
    if (!isNaN(Number(value))) return Number(value);
    return value;
  }

  async get(key: string): Promise<PropertyValue | null> {
    try {
      const [property] = await sql<Array<{ value: string | null }>>`
        SELECT value FROM properties WHERE key = ${key}
      `;
      return property ? this.deserializeValue(property.value) : null;
    } catch (error) {
      console.error("Failed to get property:", error);
      throw error;
    }
  }

  async save(key: string, value: PropertyValue): Promise<void> {
    try {
      const serializedValue = this.serializeValue(value);
      await sql`
        INSERT INTO properties (key, value, updated_at)
        VALUES (
          ${key}, 
          ${serializedValue}, 
          (SELECT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')
        )
        ON CONFLICT (key) 
        DO UPDATE SET 
          value = ${serializedValue},
          updated_at = (SELECT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')
      `;
    } catch (error) {
      console.error("Failed to save property:", error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await sql`
        DELETE FROM properties WHERE key = ${key}
      `;
    } catch (error) {
      console.error("Failed to delete property:", error);
      throw error;
    }
  }

  async list(): Promise<Map<string, PropertyValue>> {
    try {
      const properties = await sql<Array<{ key: string; value: string | null }>>`
        SELECT key, value FROM properties
      `;

      const propertyMap = new Map<string, PropertyValue>();
      for (const prop of properties) {
        propertyMap.set(prop.key, this.deserializeValue(prop.value));
      }
      return propertyMap;
    } catch (error) {
      console.error("Failed to list properties:", error);
      throw error;
    }
  }

  async batchSave(properties: Array<{ key: string; value: PropertyValue }>): Promise<void> {
    try {
      await sql.begin(async (sql) => {
        for (const { key, value } of properties) {
          const serializedValue = this.serializeValue(value);
          await sql`
            INSERT INTO properties (key, value, updated_at)
            VALUES (
              ${key}, 
              ${serializedValue}, 
              (SELECT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')
            )
            ON CONFLICT (key) 
            DO UPDATE SET 
              value = ${serializedValue},
              updated_at = (SELECT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')
          `;
        }
      });
    } catch (error) {
      console.error("Failed to batch save properties:", error);
      throw error;
    }
  }

  async getByPrefix(prefix: string): Promise<Map<string, PropertyValue>> {
    try {
      const properties = await sql<Array<{ key: string; value: string | null }>>`
        SELECT key, value FROM properties 
        WHERE key LIKE ${prefix + "%"}
      `;

      const propertyMap = new Map<string, PropertyValue>();
      for (const prop of properties) {
        propertyMap.set(prop.key, this.deserializeValue(prop.value));
      }
      return propertyMap;
    } catch (error) {
      console.error("Failed to get properties by prefix:", error);
      throw error;
    }
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    try {
      await sql`
        DELETE FROM properties 
        WHERE key LIKE ${prefix + "%"}
      `;
    } catch (error) {
      console.error("Failed to delete properties by prefix:", error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const [result] = await sql<[{ exists: boolean }]>`
        SELECT EXISTS(
          SELECT 1 FROM properties WHERE key = ${key}
        ) as exists
      `;
      return result.exists;
    } catch (error) {
      console.error("Failed to check property existence:", error);
      throw error;
    }
  }

  async getUpdatedAt(key: string): Promise<Date | null> {
    try {
      const [property] = await sql<Array<{ updated_at: Date | null }>>`
        SELECT updated_at AT TIME ZONE 'Asia/Shanghai' as updated_at 
        FROM properties 
        WHERE key = ${key}
      `;
      return property?.updated_at ?? null;
    } catch (error) {
      console.error("Failed to get property updated time:", error);
      throw error;
    }
  }
}

export const propertyStore = new PropertyStore();
