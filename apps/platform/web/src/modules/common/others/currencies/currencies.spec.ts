import { describe, expect, it } from "vitest";
import { currenciesDefinition } from "./currencies.definition";
describe("Currencies", () => { it("keeps an independent frontend route", () => expect(currenciesDefinition.route).toContain("others")); });
