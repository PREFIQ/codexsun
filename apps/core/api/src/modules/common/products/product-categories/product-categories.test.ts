import { describe, expect, it } from "vitest";
import { productCategoriesDefinition } from "./product-categories.definition.js";
describe("Product Categories", () => { it("owns an independent table and required fields", () => { expect(productCategoriesDefinition.tableName).toBe("core_common_product_categories"); expect(productCategoriesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
