export type PropertyValue = string | number | boolean | null;

export interface Property {
  key: string;
  value: PropertyValue;
  updated_at: Date;
}
