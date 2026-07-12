import { describe, expect, it } from "vitest";
import { warehousesDefinition } from "./warehouses.definition.js";
describe("Warehouses", () => { it("owns an independent table and required fields", () => { expect(warehousesDefinition.tableName).toBe("warehouses"); expect(warehousesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
