import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDbE2e = process.env.CODEXSUN_DB_E2E === "1";
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const masterDb = `codexsun_billing_entries_e2e_${suffix}`;

describe.skipIf(!runDbE2e)("billing entries database e2e", () => {
  beforeAll(() => {
    process.env.JWT_SECRET ||= "billing-entries-e2e-secret";
    process.env.DB_MASTER_NAME = masterDb;
  });

  afterAll(async () => {
    const { closeAllBillingDatabases } = await import("../../database/billing-database.js");
    const { createConnection } = await import("mysql2/promise");
    await closeAllBillingDatabases();

    const connection = await createConnection({
      host: process.env.DB_HOST ?? "127.0.0.1",
      password: process.env.DB_PASSWORD ?? "",
      port: Number(process.env.DB_PORT ?? 3306),
      timezone: "Z",
      user: process.env.DB_USER ?? "root"
    });
    try {
      await connection.query(`DROP DATABASE IF EXISTS \`${masterDb}\``);
    } finally {
      await connection.end();
    }
  });

  it("creates quotations and converts them into one consolidated sales invoice", async () => {
    const { createApp } = await import("../../app.js");
    const app = await createApp();
    try {
      const headers = { "x-tenant-id": "tenant-sales" };

      const contactCreated = await app.inject({
        headers,
        method: "POST",
        payload: {
          code: "CUS-001",
          gstin: "33ABCDE1234F1Z5",
          name: "Acme Fabrics",
        },
        url: "/billing/entries/support/contacts"
      });
      expect(contactCreated.statusCode).toBe(200);
      const contact = (contactCreated.json() as { data: { id: string; name: string } }).data;

      const productCreated = await app.inject({
        headers,
        method: "POST",
        payload: {
          code: "TSHIRT",
          hsnCode: "61091000",
          name: "Cotton T-Shirt",
          price: 250,
          taxRate: 5,
          unitName: "Nos"
        },
        url: "/billing/entries/support/products"
      });
      expect(productCreated.statusCode).toBe(200);
      const product = (productCreated.json() as { data: { id: string; name: string } }).data;

      const quotationOne = await app.inject({
        headers,
        method: "POST",
        payload: {
          customerId: contact.id,
          customerName: contact.name,
          documentDate: "2026-07-09",
          documentNo: "QUO-0001",
          lines: [
            {
              productId: product.id,
              productName: product.name,
              quantity: 10,
              rate: 250,
              taxRate: 5,
              unitName: "Nos"
            }
          ],
          placeOfSupply: "cgst-sgst"
        },
        url: "/billing/entries/quotations"
      });
      expect(quotationOne.statusCode).toBe(200);
      const firstQuotation = (quotationOne.json() as { data: { id: string } }).data;

      const quotationTwo = await app.inject({
        headers,
        method: "POST",
        payload: {
          customerId: contact.id,
          customerName: contact.name,
          documentDate: "2026-07-09",
          documentNo: "QUO-0002",
          lines: [
            {
              productId: product.id,
              productName: product.name,
              quantity: 5,
              rate: 250,
              taxRate: 5,
              unitName: "Nos"
            }
          ],
          placeOfSupply: "cgst-sgst"
        },
        url: "/billing/entries/quotations"
      });
      expect(quotationTwo.statusCode).toBe(200);
      const secondQuotation = (quotationTwo.json() as { data: { id: string } }).data;

      const converted = await app.inject({
        headers,
        method: "POST",
        payload: { quotationIds: [firstQuotation.id, secondQuotation.id] },
        url: "/billing/entries/quotations/convert-to-sales"
      });
      expect(converted.statusCode).toBe(200);
      const sales = (converted.json() as { data: { documentNo: string; id: string; lines: Array<{ quantity: number }>; source: { sourceQuotationNos: string[] } | null } }).data;

      expect(sales.documentNo).toContain("SAL-");
      expect(sales.lines).toHaveLength(1);
      expect(sales.lines[0]?.quantity).toBe(15);
      expect(sales.source?.sourceQuotationNos).toEqual(["QUO-0001", "QUO-0002"]);

      const refreshedQuotation = await app.inject({ headers, method: "GET", url: `/billing/entries/quotations/${firstQuotation.id}` });
      expect(refreshedQuotation.statusCode).toBe(200);
      const refreshedQuotationBody = refreshedQuotation.json() as { data: { generatedSalesDocumentNo: string | null } };
      expect(refreshedQuotationBody.data.generatedSalesDocumentNo).toBe(sales.documentNo);

      const commentAdded = await app.inject({
        headers,
        method: "POST",
        payload: { body: "Customer approved the invoice." },
        url: `/billing/entries/sales/${sales.id}/comments`
      });
      expect(commentAdded.statusCode).toBe(200);
      const commentBody = commentAdded.json() as { data: { comments: Array<{ body: string }> } };
      expect(commentBody.data.comments[0]?.body).toBe("Customer approved the invoice.");
    } finally {
      await app.close();
    }
  }, 30000);

  it("creates and reads purchase and export sales entries through their own routes", async () => {
    const { createApp } = await import("../../app.js");
    const app = await createApp();
    try {
      const headers = { "x-tenant-id": "tenant-purchase-export" };

      const contactCreated = await app.inject({
        headers,
        method: "POST",
        payload: {
          code: "PAR-001",
          gstin: "33ABCDE1234F1Z5",
          name: "Global Textiles",
        },
        url: "/billing/entries/support/contacts"
      });
      expect(contactCreated.statusCode).toBe(200);
      const contact = (contactCreated.json() as { data: { id: string; name: string } }).data;

      const productCreated = await app.inject({
        headers,
        method: "POST",
        payload: {
          code: "FABRIC",
          hsnCode: "52081900",
          name: "Cotton Fabric",
          price: 180,
          taxRate: 12,
          unitName: "Mtr"
        },
        url: "/billing/entries/support/products"
      });
      expect(productCreated.statusCode).toBe(200);
      const product = (productCreated.json() as { data: { id: string; name: string } }).data;

      const purchaseCreated = await app.inject({
        headers,
        method: "POST",
        payload: {
          customerId: contact.id,
          customerName: contact.name,
          documentDate: "2026-07-09",
          lines: [
            {
              productId: product.id,
              productName: product.name,
              quantity: 12,
              rate: 180,
              taxRate: 12,
              unitName: "Mtr"
            }
          ],
          placeOfSupply: "cgst-sgst",
          supplierBillDate: "2026-07-08",
          supplierBillNo: "SUP-8891"
        },
        url: "/billing/entries/purchases"
      });
      expect(purchaseCreated.statusCode).toBe(200);
      const purchase = (purchaseCreated.json() as { data: { documentNo: string; id: string; supplierBillDate: string | null; supplierBillNo: string | null } }).data;
      expect(purchase.documentNo).toContain("PUR-");
      expect(purchase.supplierBillNo).toBe("SUP-8891");
      expect(purchase.supplierBillDate).toBe("2026-07-08");

      const exportCreated = await app.inject({
        headers,
        method: "POST",
        payload: {
          customerId: contact.id,
          customerName: contact.name,
          documentDate: "2026-07-09",
          lines: [
            {
              productId: product.id,
              productName: product.name,
              quantity: 4,
              rate: 240,
              taxRate: 0,
              unitName: "Mtr"
            }
          ],
          placeOfSupply: "igst"
        },
        url: "/billing/entries/export-sales"
      });
      expect(exportCreated.statusCode).toBe(200);
      const exportSales = (exportCreated.json() as { data: { documentNo: string; id: string; kind: string } }).data;
      expect(exportSales.documentNo).toContain("EXP-");
      expect(exportSales.kind).toBe("exportSales");

      const purchaseList = await app.inject({ headers, method: "GET", url: "/billing/entries/purchases" });
      expect(purchaseList.statusCode).toBe(200);
      const purchaseListBody = purchaseList.json() as { data: Array<{ id: string }> };
      expect(purchaseListBody.data.some((item) => item.id === purchase.id)).toBe(true);

      const exportShow = await app.inject({ headers, method: "GET", url: `/billing/entries/export-sales/${exportSales.id}` });
      expect(exportShow.statusCode).toBe(200);
      const exportShowBody = exportShow.json() as { data: { id: string; kind: string } };
      expect(exportShowBody.data.id).toBe(exportSales.id);
      expect(exportShowBody.data.kind).toBe("exportSales");
    } finally {
      await app.close();
    }
  }, 30000);
});
