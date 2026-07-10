import { describe, expect, it } from "vitest";
import { contactDefinition } from "./contact.definition.js";
describe("Contact master", () => { it("owns its table", () => { expect(contactDefinition.tableName).toBe("core_master_contacts"); }); });
