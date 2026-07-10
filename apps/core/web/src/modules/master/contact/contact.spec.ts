import { describe, expect, it } from "vitest";
import { contactDefinition } from "./contact.definition";
describe("Contact master page", () => { it("has a route", () => { expect(contactDefinition.route).toBeTruthy(); }); });
