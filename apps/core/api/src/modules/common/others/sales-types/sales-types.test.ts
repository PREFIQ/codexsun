import { describe, expect, it } from "vitest";
import { salesTypesDefinition } from "./sales-types.definition.js";
describe("Sales Types", () => { it("owns an independent table and required fields", () => { expect(salesTypesDefinition.tableName).toBe("core_common_sales_types"); expect(salesTypesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
