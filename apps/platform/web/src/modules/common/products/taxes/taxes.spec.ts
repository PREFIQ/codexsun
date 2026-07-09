import { describe, expect, it } from "vitest";
import { taxesDefinition } from "./taxes.definition";
describe("Taxes", () => { it("keeps an independent frontend route", () => expect(taxesDefinition.route).toContain("products")); });
