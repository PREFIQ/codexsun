import { describe, expect, it } from "vitest";
import { stockRejectionTypesDefinition } from "./stock-rejection-types.definition.js";
describe("Stock Rejection Types", () => { it("owns an independent table and required fields", () => { expect(stockRejectionTypesDefinition.tableName).toBe("core_common_stock_rejection_types"); expect(stockRejectionTypesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
