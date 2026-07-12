import { describe, expect, it } from "vitest";
import { brandsDefinition } from "./brands.definition.js";
describe("Brands", () => { it("owns an independent table and required fields", () => { expect(brandsDefinition.tableName).toBe("brands"); expect(brandsDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
