import { describe, expect, it } from "vitest";
import { bankNamesDefinition } from "./bank-names.definition";
describe("Bank Names", () => { it("keeps an independent frontend route", () => expect(bankNamesDefinition.route).toContain("contacts")); });
