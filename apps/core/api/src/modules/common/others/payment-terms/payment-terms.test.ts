import { describe, expect, it } from "vitest";
import { paymentTermsDefinition } from "./payment-terms.definition.js";
describe("Payment Terms", () => { it("owns an independent table and required fields", () => { expect(paymentTermsDefinition.tableName).toBe("payment_terms"); expect(paymentTermsDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
