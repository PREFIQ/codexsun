import { describe, expect, it } from "vitest";
import { paymentTermsDefinition } from "./payment-terms.definition";
describe("Payment Terms", () => { it("keeps an independent frontend route", () => expect(paymentTermsDefinition.route).toContain("others")); });
