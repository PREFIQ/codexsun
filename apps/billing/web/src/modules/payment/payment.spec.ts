import { describe, expect, it } from "vitest";
import { emptyPayment } from "./payment.types";
describe("payment module", () => { it("starts as a draft with a payment date", () => { const value = emptyPayment(); expect(value.status).toBe("draft"); expect(value.paymentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); }); });
