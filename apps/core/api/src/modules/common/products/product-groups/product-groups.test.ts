import { describe, expect, it } from "vitest";
import { productGroupsDefinition } from "./product-groups.definition.js";
describe("Product Groups", () => { it("owns an independent table and required fields", () => { expect(productGroupsDefinition.tableName).toBe("core_common_product_groups"); expect(productGroupsDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
