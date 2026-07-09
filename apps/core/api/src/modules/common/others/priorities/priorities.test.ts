import { describe, expect, it } from "vitest";
import { prioritiesDefinition } from "./priorities.definition.js";
describe("Priorities", () => { it("owns an independent table and required fields", () => { expect(prioritiesDefinition.tableName).toBe("core_common_priorities"); expect(prioritiesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
