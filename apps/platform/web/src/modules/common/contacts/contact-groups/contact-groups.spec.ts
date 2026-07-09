import { describe, expect, it } from "vitest";
import { contactGroupsDefinition } from "./contact-groups.definition";
describe("Contact Groups", () => { it("keeps an independent frontend route", () => expect(contactGroupsDefinition.route).toContain("contacts")); });
