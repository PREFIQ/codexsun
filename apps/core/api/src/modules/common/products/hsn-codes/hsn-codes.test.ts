import { describe, expect, it } from "vitest";
import { hsnCodesDefinition } from "./hsn-codes.definition.js";
describe("HSN Codes", () => { it("owns an independent table and required fields", () => { expect(hsnCodesDefinition.tableName).toBe("hsn_codes"); expect(hsnCodesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
