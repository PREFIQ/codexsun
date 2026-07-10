import { describe, expect, it } from "vitest";
import { exportSalesSchema } from "./export-sales.schema";

describe("sales schema", () => {
  it("requires a complete invoice payload", () => {
    const result = exportSalesSchema.safeParse({
      billingAddress: "Billing",
      currencyCode: "INR",
      customerEmail: "sales@example.com",
      customerName: "Northstar Trading",
      customerPhone: "9999999999",
      invoiceNumber: "SAL-001",
      issuedOn: "2026-07-09",
      items: [
        { description: "Cotton fabric", hsnCode: "5208", quantity: 2, rate: 125.5, taxRate: 12, unit: "MTR" },
      ],
      notes: "",
      roundOff: 0,
      shippingAddress: "Shipping",
      status: "draft",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty item list", () => {
    expect(
      exportSalesSchema.safeParse({
        billingAddress: "Billing",
        currencyCode: "INR",
        customerEmail: "sales@example.com",
        customerName: "Northstar Trading",
        customerPhone: "9999999999",
        invoiceNumber: "SAL-001",
        issuedOn: "2026-07-09",
        items: [],
        notes: "",
        roundOff: 0,
        shippingAddress: "Shipping",
        status: "draft",
      }).success,
    ).toBe(false);
  });
});
