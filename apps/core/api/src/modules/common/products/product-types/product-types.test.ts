import { describe, expect, it } from "vitest";
import { productTypesDefinition } from "./product-types.definition.js";
describe("Product Types", () => { it("owns an independent table and required fields", () => { expect(productTypesDefinition.tableName).toBe("product_types"); expect(productTypesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
