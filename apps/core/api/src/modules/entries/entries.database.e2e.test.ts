import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDbE2e = process.env.CODEXSUN_DB_E2E === "1";
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const masterDb = `codexsun_core_entries_e2e_${suffix}`;

describe.skipIf(!runDbE2e)("core entries database e2e", () => {
  beforeAll(() => {
    process.env.JWT_SECRET ||= "core-entries-e2e-secret";
    process.env.DB_MASTER_NAME = masterDb;
  });

  afterAll(async () => {
    const { closeCoreDatabase } = await import("../../database/core-database.js");
    const { createConnection } = await import("mysql2/promise");
    await closeCoreDatabase();

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
        url: "/core/entries/support/contacts"
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
        url: "/core/entries/support/products"
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
        url: "/core/entries/quotations"
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
        url: "/core/entries/quotations"
      });
      expect(quotationTwo.statusCode).toBe(200);
      const secondQuotation = (quotationTwo.json() as { data: { id: string } }).data;

      const converted = await app.inject({
        headers,
        method: "POST",
        payload: { quotationIds: [firstQuotation.id, secondQuotation.id] },
        url: "/core/entries/quotations/convert-to-sales"
      });
      expect(converted.statusCode).toBe(200);
      const sales = (converted.json() as { data: { documentNo: string; id: string; lines: Array<{ quantity: number }>; source: { sourceQuotationNos: string[] } | null } }).data;

      expect(sales.documentNo).toContain("SAL-");
      expect(sales.lines).toHaveLength(1);
      expect(sales.lines[0]?.quantity).toBe(15);
      expect(sales.source?.sourceQuotationNos).toEqual(["QUO-0001", "QUO-0002"]);

      const refreshedQuotation = await app.inject({ headers, method: "GET", url: `/core/entries/quotations/${firstQuotation.id}` });
      expect(refreshedQuotation.statusCode).toBe(200);
      const refreshedQuotationBody = refreshedQuotation.json() as { data: { generatedSalesDocumentNo: string | null } };
      expect(refreshedQuotationBody.data.generatedSalesDocumentNo).toBe(sales.documentNo);

      const commentAdded = await app.inject({
        headers,
        method: "POST",
        payload: { body: "Customer approved the invoice." },
        url: `/core/entries/sales/${sales.id}/comments`
      });
      expect(commentAdded.statusCode).toBe(200);
      const commentBody = commentAdded.json() as { data: { comments: Array<{ body: string }> } };
      expect(commentBody.data.comments[0]?.body).toBe("Customer approved the invoice.");
    } finally {
      await app.close();
    }
  }, 30000);
});
