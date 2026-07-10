import { describe, expect, it } from "vitest";
import { buildSaleTotals, normalizeSaleInput, resolveSaleNumber } from "./sales.service.js";
import { nextBillingDocumentNumber } from "../settings/settings.types.js";

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
        { description: " Cotton Fabric ", hsnCode: " 5208 ", quantity: 2, rate: 125.5, taxRate: 12, unit: " mtr " },
      ],
      notes: " Test ",
      roundOff: 0.4,
      shippingAddress: "Shipping address",
      status: "draft",
    });

    const totals = buildSaleTotals(normalized);

    expect(normalized.currencyCode).toBe("INR");
    expect(normalized.customerEmail).toBe("sales@example.com");
    expect(normalized.invoiceNumber).toBe("SAL-001");
    expect(totals.subtotal).toBe(251);
    expect(totals.taxAmount).toBe(30.12);
    expect(totals.amount).toBe(281.52);
  });

  it("uses the configured next Sales document number when automatic numbering is enabled", () => {
    const input = {
      billingAddress: "",
      currencyCode: "INR",
      customerEmail: "",
      customerName: "Northstar Trading",
      customerPhone: "",
      invoiceNumber: "",
      issuedOn: "2026-07-10",
      items: [],
      notes: "",
      shippingAddress: "",
      status: "draft" as const,
    };

    expect(resolveSaleNumber(input, {
      automatic: true,
      nextNumber: 27,
      padding: 4,
      prefix: "SAL",
      separator: "-",
      suffix: "",
      usePrefix: true,
      useSeparator: true,
      useSuffix: false,
    }).invoiceNumber).toBe("SAL-0027");
  });

  it("advances the automatic series after a higher manually overridden number", () => {
    expect(nextBillingDocumentNumber({
      automatic: true,
      nextNumber: 9,
      padding: 4,
      prefix: "SAL",
      separator: "-",
      suffix: "",
      usePrefix: true,
      useSeparator: true,
      useSuffix: false,
    }, "SAL-0019")).toBe(20);
  });
});
