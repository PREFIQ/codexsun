import { describe, expect, it } from "vitest";
import { contactTypesDefinition } from "./contact-types.definition.js";
describe("Contact Types", () => { it("owns an independent table and required fields", () => { expect(contactTypesDefinition.tableName).toBe("core_common_contact_types"); expect(contactTypesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
