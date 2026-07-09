import { describe, expect, it } from "vitest";
import { stylesDefinition } from "./styles.definition.js";
describe("Styles", () => { it("owns an independent table and required fields", () => { expect(stylesDefinition.tableName).toBe("core_common_styles"); expect(stylesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
