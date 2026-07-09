import { describe, expect, it } from "vitest";
import { addressTypesDefinition } from "./address-types.definition";
describe("Address Types", () => { it("keeps an independent frontend route", () => expect(addressTypesDefinition.route).toContain("contacts")); });
