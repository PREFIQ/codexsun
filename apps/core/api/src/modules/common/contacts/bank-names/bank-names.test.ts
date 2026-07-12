import { describe, expect, it } from "vitest";
import { bankNamesDefinition } from "./bank-names.definition.js";
describe("Bank Names", () => { it("owns an independent table and required fields", () => { expect(bankNamesDefinition.tableName).toBe("bank_names"); expect(bankNamesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
