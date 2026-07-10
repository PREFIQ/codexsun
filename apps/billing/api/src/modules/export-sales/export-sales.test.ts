import { describe, expect, it } from "vitest";
import { buildExportSaleTotals, normalizeSaleInput } from "./export-sales.service.js";

describe("sales module contract", () => {
  it("normalizes and totals item rows for invoice workflows", () => {
    const normalized = normalizeSaleInput({
      billingAddress: "Billing address",
      currencyCode: "inr",
      customerEmail: " SALES@EXAMPLE.COM ",
      customerName: " Northstar Trading ",
      customerPhone: " 9999999999 ",
      invoiceNumber: " sal-001 ",
      issuedOn: "2026-07-09",
      items: [
        { description: " Cotton Fabric ", hsnCode: " 5208 ", productName: " Cotton Fabric ", quantity: 2, rate: 125.5, taxRate: 12, unit: " mtr " },
      ],
      notes: " Test ",
      roundOff: 0.4,
      shippingAddress: "Shipping address",
      status: "draft",
    });

    const totals = buildExportSaleTotals(normalized);

    expect(normalized.currencyCode).toBe("INR");
    expect(normalized.customerEmail).toBe("sales@example.com");
    expect(normalized.invoiceNumber).toBe("SAL-001");
    expect(totals.subtotal).toBe(251);
    expect(totals.taxAmount).toBe(30.12);
    expect(totals.amount).toBe(281.52);
  });
});
