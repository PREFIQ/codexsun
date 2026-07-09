import { describe, expect, it } from "vitest";
import { coloursDefinition } from "./colours.definition.js";
describe("Colours", () => { it("owns an independent table and required fields", () => { expect(coloursDefinition.tableName).toBe("core_common_colours"); expect(coloursDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
