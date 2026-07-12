import { describe, expect, it } from "vitest";
import { PAYMENT_TERMS_COLLECTION_PATH } from "./payment-terms.routes.js";

describe("Payment Terms module contract", () => {
  it("owns its route", () =>
    expect(PAYMENT_TERMS_COLLECTION_PATH).toBe("/core/common/others/payment-terms"));
});
