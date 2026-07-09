import { describe, expect, it } from "vitest";
import { sizesDefinition } from "./sizes.definition.js";
describe("Sizes", () => { it("owns an independent table and required fields", () => { expect(sizesDefinition.tableName).toBe("core_common_sizes"); expect(sizesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
