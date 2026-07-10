import { describe, expect, it } from "vitest";
import { productDefinition } from "./product.definition.js";
describe("Product master", () => { it("owns its table", () => { expect(productDefinition.tableName).toBe("core_master_products"); }); });
