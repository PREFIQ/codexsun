import { describe, expect, it } from "vitest";
import { unitsDefinition } from "./units.definition.js";
describe("Units", () => { it("owns an independent table and required fields", () => { expect(unitsDefinition.tableName).toBe("units"); expect(unitsDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
