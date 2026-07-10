import { describe, expect, it } from "vitest";
import { hsnCodesDefinition } from "./hsn-codes.definition";
describe("HSN Codes", () => { it("keeps an independent frontend route", () => expect(hsnCodesDefinition.route).toContain("products")); });
