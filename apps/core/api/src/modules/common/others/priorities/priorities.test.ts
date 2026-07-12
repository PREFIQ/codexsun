import { describe, expect, it } from "vitest";
import { prioritiesDefinition } from "./priorities.definition.js";
describe("Priorities", () => { it("owns an independent table and required fields", () => { expect(prioritiesDefinition.tableName).toBe("priorities"); expect(prioritiesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
