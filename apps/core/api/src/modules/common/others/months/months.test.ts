import { describe, expect, it } from "vitest";
import { monthsDefinition } from "./months.definition.js";
describe("Months", () => { it("owns an independent table and required fields", () => { expect(monthsDefinition.tableName).toBe("months"); expect(monthsDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
