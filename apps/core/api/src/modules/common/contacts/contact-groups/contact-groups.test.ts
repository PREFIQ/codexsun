import { describe, expect, it } from "vitest";
import { contactGroupsDefinition } from "./contact-groups.definition.js";
describe("Contact Groups", () => { it("owns an independent table and required fields", () => { expect(contactGroupsDefinition.tableName).toBe("contact_groups"); expect(contactGroupsDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
