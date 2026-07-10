import { describe, expect, it } from "vitest";
import { contactTypesDefinition } from "./contact-types.definition";
describe("Contact Types", () => { it("keeps an independent frontend route", () => expect(contactTypesDefinition.route).toContain("contacts")); });
