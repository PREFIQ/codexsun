import { describe, expect, it } from "vitest";
import { taxesDefinition } from "./taxes.definition.js";
describe("Taxes", () => { it("owns an independent table and required fields", () => { expect(taxesDefinition.tableName).toBe("taxes"); expect(taxesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
