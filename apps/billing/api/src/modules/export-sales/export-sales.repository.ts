import { randomBytes } from "node:crypto";
import { sql, type Kysely, type RawBuilder, type Transaction } from "kysely";
import { getBillingDatabase } from "../../database/billing-database.js";
import type {
  ExportSale,
  ExportSaleContext,
  ExportSaleEinvoiceDetails,
  ExportSaleEwayDetails,
  ExportSaleLineItem,
  ExportSaleSavePayload,
  ExportSaleStatus
} from "./export-sales.types.js";

type ExportSalesDatabase = Record<string, never>;
type ExportSalesTransaction = Transaction<ExportSalesDatabase>;

type ExportSaleHeaderRow = {
  amount: string | number;
  billing_address_id: number;
  billing_address_line1: string;
  billing_address_line2: string | null;
  billing_city: string | null;
  billing_country: string | null;
  billing_district: string | null;
  billing_pincode: string | null;
  billing_state: string | null;
  company_id: number;
  company_name: string;
  created_at: string;
  currency_code: string;
  currency_id: number;
  customer_email: string | null;
  customer_id: number;
  customer_name: string;
  customer_phone: string | null;
  financial_year_id: number;
  financial_year_name: string;
  id: number;
  invoice_number: string;
  issued_on: string;
  ledger_id: number | null;
  ledger_name: string | null;
  line_number: number;
  notes: string | null;
  round_off: string | number;
  shipping_address_id: number;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_country: string | null;
  shipping_district: string | null;
  shipping_pincode: string | null;
  shipping_state: string | null;
  status: ExportSaleStatus;
  subtotal: string | number;
  tax_amount: string | number;
  tax_type: "cgst-sgst" | "igst";
  terms: string | null;
  updated_at: string;
  uuid: string;
  work_order_id: number | null;
  work_order_no: string | null;
};

type ExportSaleItemRow = {
  cgst_amount: string | number;
  colour_id: number | null;
  colour_name: string | null;
  dc_no: string | null;
  description: string;
  hsn_code: string | null;
  hsn_code_id: number | null;
  igst_amount: string | number;
  line_number: number;
  line_total: string | number;
  po_no: string | null;
  product_id: number | null;
  product_name: string | null;
  quantity: string | number;
  rate: string | number;
  sgst_amount: string | number;
  size_id: number | null;
  size_name: string | null;
  tax_amount: string | number;
  tax_id: number | null;
  tax_rate: string | number;
  taxable_amount: string | number;
  unit_id: number;
  unit_name: string;
  uuid: string;
};

export type ExportSaleReferenceState = {
  billingAddress: boolean;
  company: boolean;
  currency: boolean;
  customer: boolean;
  financialYear: boolean;
  ledger: boolean;
  shippingAddress: boolean;
  workOrder: boolean;
};

export class ExportSalesRepository {
  async list(databaseName: string) {
    const database = await exportSalesDatabase(databaseName);
    const result = await selectExportSaleHeaders().execute(database);
    return Promise.all(result.rows.map((row) => this.hydrate(database, row)));
  }

  async get(databaseName: string, uuid: string) {
    const database = await exportSalesDatabase(databaseName);
    const result = await selectExportSaleHeaders(uuid).execute(database);
    const row = result.rows[0];
    return row ? this.hydrate(database, row) : null;
  }

  async context(databaseName: string): Promise<ExportSaleContext | null> {
    const database = await exportSalesDatabase(databaseName);
    const result = await sql<{
      company_id: number;
      company_name: string;
      currency_code: string;
      currency_id: number;
      financial_year_id: number;
      financial_year_name: string;
    }>`
      SELECT d.company_id,
             c.name AS company_name,
             d.financial_year_id,
             f.name AS financial_year_name,
             currency.id AS currency_id,
             currency.name AS currency_code
      FROM default_company_settings d
      INNER JOIN companies c ON c.id = d.company_id AND c.status = 'active'
      INNER JOIN financial_years f ON f.id = d.financial_year_id AND f.status = 'active'
      INNER JOIN currencies currency ON UPPER(currency.name) = 'INR' AND currency.status = 'active'
      WHERE d.singleton_key = 1 AND d.status = 'active'
      LIMIT 1
    `.execute(database);
    const row = result.rows[0];
    return row
      ? {
          companyId: row.company_id,
          companyName: row.company_name,
          currencyCode: row.currency_code,
          currencyId: row.currency_id,
          financialYearId: row.financial_year_id,
          financialYearName: row.financial_year_name
        }
      : null;
  }

  async referenceState(
    databaseName: string,
    input: ExportSaleSavePayload
  ): Promise<ExportSaleReferenceState> {
    const database = await exportSalesDatabase(databaseName);
    const result = await sql<Record<keyof ExportSaleReferenceState, number>>`
      SELECT
        EXISTS(SELECT 1 FROM companies WHERE id = ${input.companyId} AND status = 'active') AS company,
        EXISTS(SELECT 1 FROM financial_years WHERE id = ${input.financialYearId} AND status = 'active' AND ${input.issuedOn} BETWEEN start_date AND end_date) AS financialYear,
        EXISTS(SELECT 1 FROM contacts WHERE id = ${input.customerId} AND status = 'active') AS customer,
        EXISTS(SELECT 1 FROM contacts_addresses WHERE id = ${input.billingAddressId} AND parent_id = ${input.customerId}) AS billingAddress,
        EXISTS(SELECT 1 FROM contacts_addresses WHERE id = ${input.shippingAddressId} AND parent_id = ${input.customerId}) AS shippingAddress,
        ${input.workOrderId ? sql`EXISTS(SELECT 1 FROM work_orders WHERE id = ${input.workOrderId} AND status = 'active')` : sql`1`} AS workOrder,
        ${input.ledgerId ? sql`EXISTS(SELECT 1 FROM ledgers WHERE id = ${input.ledgerId} AND status = 'active')` : sql`1`} AS ledger,
        EXISTS(SELECT 1 FROM currencies WHERE id = ${input.currencyId} AND status = 'active') AS currency
    `.execute(database);
    const row = result.rows[0];
    return {
      billingAddress: Boolean(row?.billingAddress),
      company: Boolean(row?.company),
      currency: Boolean(row?.currency),
      customer: Boolean(row?.customer),
      financialYear: Boolean(row?.financialYear),
      ledger: Boolean(row?.ledger),
      shippingAddress: Boolean(row?.shippingAddress),
      workOrder: Boolean(row?.workOrder)
    };
  }

  async resolveMissingReferences(
    databaseName: string,
    input: ExportSaleSavePayload
  ): Promise<ExportSaleSavePayload> {
    const database = await exportSalesDatabase(databaseName);
    const context = await this.context(databaseName);
    const contactResult =
      input.customerId > 0
        ? null
        : await sql<{ id: number }>`
            SELECT id FROM contacts
            WHERE LOWER(name) = LOWER(${input.customerName}) AND status = 'active'
            LIMIT 1
          `.execute(database);
    const customerId = input.customerId || Number(contactResult?.rows[0]?.id ?? 0);
    const addressResult =
      customerId > 0 && (!input.billingAddressId || !input.shippingAddressId)
        ? await sql<{ id: number }>`
            SELECT id FROM contacts_addresses
            WHERE parent_id = ${customerId}
            ORDER BY is_default DESC, sort_order, id
          `.execute(database)
        : null;
    const addressIds = addressResult?.rows.map((row) => Number(row.id)) ?? [];
    const workOrderResult =
      !input.workOrderId && input.workOrderNo
        ? await sql<{ id: number }>`
            SELECT id FROM work_orders
            WHERE code = ${input.workOrderNo} AND status = 'active' LIMIT 1
          `.execute(database)
        : null;
    const ledgerResult =
      !input.ledgerId && input.salesLedger
        ? await sql<{ id: number }>`
            SELECT id FROM ledgers
            WHERE LOWER(name) = LOWER(${input.salesLedger}) AND status = 'active' LIMIT 1
          `.execute(database)
        : null;

    const items: ExportSaleSavePayload["items"] = [];
    for (const item of input.items) {
      const product =
        !item.productId && item.productName
          ? await sql<{
              id: number;
              hsn_code_id: number | null;
              tax_id: number | null;
              unit_id: number | null;
            }>`
              SELECT id, hsn_code_id, tax_id, unit_id FROM products
              WHERE LOWER(name) = LOWER(${item.productName}) AND status = 'active' AND deleted_at IS NULL
              LIMIT 1
            `.execute(database)
          : null;
      const hsn =
        !item.hsnCodeId && item.hsnCode
          ? await sql<{
              id: number;
            }>`SELECT id FROM hsn_codes WHERE code = ${item.hsnCode} AND status = 'active' LIMIT 1`.execute(
              database
            )
          : null;
      const colour =
        !item.colourId && item.colour
          ? await sql<{
              id: number;
            }>`SELECT id FROM colours WHERE LOWER(name) = LOWER(${item.colour}) AND status = 'active' LIMIT 1`.execute(
              database
            )
          : null;
      const size =
        !item.sizeId && item.size
          ? await sql<{
              id: number;
            }>`SELECT id FROM sizes WHERE LOWER(name) = LOWER(${item.size}) AND status = 'active' LIMIT 1`.execute(
              database
            )
          : null;
      const unit =
        !item.unitId && item.unit
          ? await sql<{
              id: number;
            }>`SELECT id FROM units WHERE LOWER(name) = LOWER(${item.unit}) AND status = 'active' LIMIT 1`.execute(
              database
            )
          : null;
      const tax = !item.taxId
        ? await sql<{
            id: number;
          }>`SELECT id FROM taxes WHERE rate_percent = ${item.taxRate} AND status = 'active' LIMIT 1`.execute(
            database
          )
        : null;
      const productRow = product?.rows[0];
      items.push({
        ...item,
        colourId: item.colourId ?? colour?.rows[0]?.id ?? null,
        hsnCodeId: item.hsnCodeId ?? productRow?.hsn_code_id ?? hsn?.rows[0]?.id ?? null,
        productId: item.productId ?? productRow?.id ?? null,
        sizeId: item.sizeId ?? size?.rows[0]?.id ?? null,
        taxId: item.taxId ?? productRow?.tax_id ?? tax?.rows[0]?.id ?? null,
        unitId: item.unitId || productRow?.unit_id || unit?.rows[0]?.id || 0
      });
    }

    return {
      ...input,
      billingAddressId: input.billingAddressId || addressIds[0] || 0,
      companyId: input.companyId || context?.companyId || 0,
      currencyCode: input.currencyCode || context?.currencyCode || "INR",
      currencyId: input.currencyId || context?.currencyId || 0,
      customerId,
      financialYearId: input.financialYearId || context?.financialYearId || 0,
      items,
      ledgerId: input.ledgerId ?? ledgerResult?.rows[0]?.id ?? null,
      shippingAddressId: input.shippingAddressId || addressIds[1] || addressIds[0] || 0,
      workOrderId: input.workOrderId ?? workOrderResult?.rows[0]?.id ?? null
    };
  }

  async validItemReferenceIds(databaseName: string, input: ExportSaleSavePayload) {
    const database = await exportSalesDatabase(databaseName);
    return {
      colours: await existingIds(database, sql`SELECT id FROM colours WHERE status = 'active'`),
      hsnCodes: await existingIds(database, sql`SELECT id FROM hsn_codes WHERE status = 'active'`),
      products: await existingIds(
        database,
        sql`SELECT id FROM products WHERE status = 'active' AND deleted_at IS NULL`
      ),
      sizes: await existingIds(database, sql`SELECT id FROM sizes WHERE status = 'active'`),
      taxes: await existingIds(database, sql`SELECT id FROM taxes WHERE status = 'active'`),
      units: await existingIds(database, sql`SELECT id FROM units WHERE status = 'active'`),
      requested: {
        colours: nonNullIds(input.items.map((item) => item.colourId)),
        hsnCodes: nonNullIds(input.items.map((item) => item.hsnCodeId)),
        products: nonNullIds(input.items.map((item) => item.productId)),
        sizes: nonNullIds(input.items.map((item) => item.sizeId)),
        taxes: nonNullIds(input.items.map((item) => item.taxId)),
        units: nonNullIds(input.items.map((item) => item.unitId))
      }
    };
  }

  async findByInvoiceNumber(
    databaseName: string,
    companyId: number,
    financialYearId: number,
    invoiceNumber: string
  ) {
    const database = await exportSalesDatabase(databaseName);
    const result = await sql<{ uuid: string }>`
      SELECT uuid FROM billing_export_sales
      WHERE company_id = ${companyId}
        AND financial_year_id = ${financialYearId}
        AND invoice_number = ${invoiceNumber}
        AND deleted_at IS NULL
      LIMIT 1
    `.execute(database);
    return result.rows[0]?.uuid ?? null;
  }

  async create(
    databaseName: string,
    input: ExportSaleSavePayload,
    totals: Pick<ExportSale, "amount" | "items" | "subtotal" | "taxAmount">
  ) {
    const database = await exportSalesDatabase(databaseName);
    const uuid = publicUuid();
    await database.transaction().execute(async (transaction) => {
      const lineResult = await sql<{ line_number: number }>`
        SELECT COALESCE(MAX(line_number), 0) + 1 AS line_number
        FROM billing_export_sales
        WHERE company_id = ${input.companyId} AND financial_year_id = ${input.financialYearId}
      `.execute(transaction);
      const lineNumber = Number(lineResult.rows[0]?.line_number ?? 1);
      const inserted = await sql`
        INSERT INTO billing_export_sales (
          uuid, company_id, financial_year_id, line_number, invoice_number, customer_id,
          billing_address_id, shipping_address_id, work_order_id, ledger_id, tax_type,
          currency_id, issued_on, subtotal, tax_amount, round_off, amount, terms, notes, status
        ) VALUES (
          ${uuid}, ${input.companyId}, ${input.financialYearId}, ${lineNumber}, ${input.invoiceNumber},
          ${input.customerId}, ${input.billingAddressId}, ${input.shippingAddressId},
          ${input.workOrderId}, ${input.ledgerId}, ${input.taxType ?? "cgst-sgst"},
          ${input.currencyId}, ${input.issuedOn}, ${totals.subtotal}, ${totals.taxAmount},
          ${input.roundOff ?? 0}, ${totals.amount}, ${input.terms ?? ""}, ${input.notes}, ${input.status}
        )
      `.execute(transaction);
      const exportSaleId = Number(inserted.insertId);
      await insertItems(transaction, exportSaleId, totals.items);
      await insertActivity(transaction, exportSaleId, "created", "create", null, input.status);
    });
    return this.get(databaseName, uuid);
  }

  async update(
    databaseName: string,
    uuid: string,
    input: ExportSaleSavePayload,
    totals: Pick<ExportSale, "amount" | "items" | "subtotal" | "taxAmount">
  ) {
    const database = await exportSalesDatabase(databaseName);
    const existing = await internalExportSale(database, uuid);
    if (!existing) return null;
    await database.transaction().execute(async (transaction) => {
      await sql`
        UPDATE billing_export_sales SET
          company_id = ${input.companyId}, financial_year_id = ${input.financialYearId},
          invoice_number = ${input.invoiceNumber}, customer_id = ${input.customerId},
          billing_address_id = ${input.billingAddressId}, shipping_address_id = ${input.shippingAddressId},
          work_order_id = ${input.workOrderId}, ledger_id = ${input.ledgerId},
          tax_type = ${input.taxType ?? "cgst-sgst"}, currency_id = ${input.currencyId},
          issued_on = ${input.issuedOn}, subtotal = ${totals.subtotal}, tax_amount = ${totals.taxAmount},
          round_off = ${input.roundOff ?? 0}, amount = ${totals.amount}, terms = ${input.terms ?? ""},
          notes = ${input.notes}, status = ${input.status}, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ${existing.id}
      `.execute(transaction);
      await sql`DELETE FROM billing_export_sales_items WHERE export_sale_id = ${existing.id}`.execute(
        transaction
      );
      await insertItems(transaction, existing.id, totals.items);
      await insertActivity(
        transaction,
        existing.id,
        "updated",
        "update",
        existing.status,
        input.status
      );
    });
    return this.get(databaseName, uuid);
  }

  async setStatus(databaseName: string, uuid: string, status: ExportSaleStatus) {
    const database = await exportSalesDatabase(databaseName);
    const existing = await internalExportSale(database, uuid);
    if (!existing) return null;
    await database.transaction().execute(async (transaction) => {
      await sql`
        UPDATE billing_export_sales SET status = ${status},
          confirmed_at = ${status === "confirmed" ? sql`CURRENT_TIMESTAMP(3)` : null},
          cancelled_at = ${status === "cancelled" ? sql`CURRENT_TIMESTAMP(3)` : null},
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ${existing.id}
      `.execute(transaction);
      await insertActivity(transaction, existing.id, status, "status", existing.status, status);
    });
    return this.get(databaseName, uuid);
  }

  async softDelete(databaseName: string, uuid: string) {
    const database = await exportSalesDatabase(databaseName);
    const existing = await internalExportSale(database, uuid);
    if (!existing) return null;
    await database.transaction().execute(async (transaction) => {
      await insertActivity(
        transaction,
        existing.id,
        "deleted",
        "soft-delete",
        existing.status,
        null
      );
      await sql`
        UPDATE billing_export_sales SET deleted_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ${existing.id}
      `.execute(transaction);
    });
    return { uuid };
  }

  async updateCompliance(
    databaseName: string,
    uuid: string,
    patch: { einvoice?: ExportSaleEinvoiceDetails; eway?: ExportSaleEwayDetails }
  ) {
    const database = await exportSalesDatabase(databaseName);
    const existing = await internalExportSale(database, uuid);
    if (!existing) return null;
    await database.transaction().execute(async (transaction) => {
      if (patch.einvoice) await upsertEinvoice(transaction, existing.id, patch.einvoice);
      if (patch.eway) await upsertEway(transaction, existing.id, patch.eway);
      await sql`UPDATE billing_export_sales SET updated_at = CURRENT_TIMESTAMP(3) WHERE id = ${existing.id}`.execute(
        transaction
      );
      await insertActivity(
        transaction,
        existing.id,
        "compliance",
        "generate",
        existing.status,
        existing.status
      );
    });
    return this.get(databaseName, uuid);
  }

  private async hydrate(
    database: Kysely<ExportSalesDatabase>,
    row: ExportSaleHeaderRow
  ): Promise<ExportSale> {
    const itemsResult = await selectExportSaleItems(row.id).execute(database);
    const einvoiceResult = await sql<{
      ack_date: string | null;
      ack_number: string | null;
      irn: string;
      signed_qr: string | null;
      status: "not-generated" | "generated";
    }>`
      SELECT irn, ack_number, DATE_FORMAT(ack_date, '%Y-%m-%dT%H:%i:%s') AS ack_date,
             signed_qr, status
      FROM billing_export_sales_einvoices WHERE export_sale_id = ${row.id} ORDER BY id DESC LIMIT 1
    `.execute(database);
    const ewayResult = await sql<{
      bill_date: string;
      bill_number: string;
      notes: string | null;
      part: "Part A" | "Part B";
      status: "not-generated" | "generated";
      transport_gst: string | null;
      transport_id: number | null;
      transport_name: string | null;
      vehicle_number: string | null;
    }>`
      SELECT e.bill_number, DATE_FORMAT(e.bill_date, '%Y-%m-%d') AS bill_date, e.part,
             e.transport_id, t.name AS transport_name, t.gst AS transport_gst,
             e.vehicle_number, e.status, e.notes
      FROM billing_export_sales_eway_bills e
      LEFT JOIN transports t ON t.id = e.transport_id
      WHERE e.export_sale_id = ${row.id} ORDER BY e.id DESC LIMIT 1
    `.execute(database);
    const einvoice = einvoiceResult.rows[0];
    const eway = ewayResult.rows[0];
    return {
      amount: money(row.amount),
      billingAddress: formatAddress(row, "billing"),
      billingAddressId: row.billing_address_id,
      companyId: row.company_id,
      companyName: row.company_name,
      createdAt: row.created_at,
      currencyCode: row.currency_code,
      currencyId: row.currency_id,
      customerEmail: row.customer_email ?? "",
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone ?? "",
      einvoice: einvoice
        ? {
            ackDate: einvoice.ack_date ?? "",
            ackNo: einvoice.ack_number ?? "",
            irn: einvoice.irn,
            signedQr: einvoice.signed_qr ?? "",
            status: einvoice.status
          }
        : defaultEinvoice(),
      eway: eway
        ? {
            billDate: eway.bill_date,
            billNo: eway.bill_number,
            notes: eway.notes ?? "",
            part: eway.part,
            status: eway.status,
            transport: eway.transport_name ?? "",
            transportGst: eway.transport_gst ?? "",
            transportId: eway.transport_id,
            vehicleNo: eway.vehicle_number ?? ""
          }
        : defaultEway(),
      financialYearId: row.financial_year_id,
      financialYearName: row.financial_year_name,
      id: row.uuid,
      invoiceNumber: row.invoice_number,
      issuedOn: row.issued_on,
      items: itemsResult.rows.map(toExportSaleItem),
      ledgerId: row.ledger_id,
      lineNumber: row.line_number,
      notes: row.notes ?? "",
      roundOff: money(row.round_off),
      salesLedger: row.ledger_name ?? "",
      shippingAddress: formatAddress(row, "shipping"),
      shippingAddressId: row.shipping_address_id,
      status: row.status,
      subtotal: money(row.subtotal),
      taxAmount: money(row.tax_amount),
      taxType: row.tax_type,
      terms: row.terms ?? "",
      updatedAt: row.updated_at,
      workOrderId: row.work_order_id,
      workOrderNo: row.work_order_no ?? ""
    };
  }
}

function exportSalesDatabase(databaseName: string) {
  return getBillingDatabase(databaseName) as unknown as Promise<Kysely<ExportSalesDatabase>>;
}

function selectExportSaleHeaders(uuid?: string) {
  return sql<ExportSaleHeaderRow>`
    SELECT s.id, s.uuid, s.company_id, company.name AS company_name,
           s.financial_year_id, financial_year.name AS financial_year_name,
           s.line_number, s.invoice_number, s.customer_id, customer.name AS customer_name,
           customer.primary_email AS customer_email, customer.primary_phone AS customer_phone,
           s.billing_address_id, billing.address_line1 AS billing_address_line1,
           billing.address_line2 AS billing_address_line2, billing.city_name AS billing_city,
           billing.district_name AS billing_district, billing.state_name AS billing_state,
           billing.pincode_name AS billing_pincode, billing.country_name AS billing_country,
           s.shipping_address_id, shipping.address_line1 AS shipping_address_line1,
           shipping.address_line2 AS shipping_address_line2, shipping.city_name AS shipping_city,
           shipping.district_name AS shipping_district, shipping.state_name AS shipping_state,
           shipping.pincode_name AS shipping_pincode, shipping.country_name AS shipping_country,
           s.work_order_id, work_order.code AS work_order_no, s.ledger_id,
           ledger.name AS ledger_name, s.tax_type, s.currency_id, currency.name AS currency_code,
           DATE_FORMAT(s.issued_on, '%Y-%m-%d') AS issued_on,
           s.subtotal, s.tax_amount, s.round_off, s.amount, s.terms, s.notes, s.status,
           DATE_FORMAT(s.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at,
           DATE_FORMAT(s.updated_at, '%Y-%m-%dT%H:%i:%s') AS updated_at
    FROM billing_export_sales s
    INNER JOIN companies company ON company.id = s.company_id
    INNER JOIN financial_years financial_year ON financial_year.id = s.financial_year_id
    INNER JOIN contacts customer ON customer.id = s.customer_id
    INNER JOIN contacts_addresses billing ON billing.id = s.billing_address_id
    INNER JOIN contacts_addresses shipping ON shipping.id = s.shipping_address_id
    INNER JOIN currencies currency ON currency.id = s.currency_id
    LEFT JOIN work_orders work_order ON work_order.id = s.work_order_id
    LEFT JOIN ledgers ledger ON ledger.id = s.ledger_id
    WHERE s.deleted_at IS NULL ${uuid ? sql`AND s.uuid = ${uuid}` : sql``}
    ORDER BY s.issued_on DESC, s.line_number DESC
  `;
}

function selectExportSaleItems(exportSaleId: number) {
  return sql<ExportSaleItemRow>`
    SELECT item.uuid, item.line_number, item.product_id, product.name AS product_name,
           item.description, item.hsn_code_id, hsn.code AS hsn_code, item.po_no, item.dc_no,
           item.colour_id, colour.name AS colour_name, item.size_id, size.name AS size_name,
           item.quantity, item.unit_id, unit.name AS unit_name, item.rate,
           item.tax_id, item.tax_rate, item.taxable_amount, item.cgst_amount,
           item.sgst_amount, item.igst_amount, item.tax_amount, item.line_total
    FROM billing_export_sales_items item
    LEFT JOIN products product ON product.id = item.product_id
    LEFT JOIN hsn_codes hsn ON hsn.id = item.hsn_code_id
    LEFT JOIN colours colour ON colour.id = item.colour_id
    LEFT JOIN sizes size ON size.id = item.size_id
    INNER JOIN units unit ON unit.id = item.unit_id
    LEFT JOIN taxes tax ON tax.id = item.tax_id
    WHERE item.export_sale_id = ${exportSaleId}
    ORDER BY item.line_number
  `;
}

async function internalExportSale(database: Kysely<ExportSalesDatabase>, uuid: string) {
  const result = await sql<{ id: number; status: ExportSaleStatus }>`
    SELECT id, status FROM billing_export_sales WHERE uuid = ${uuid} AND deleted_at IS NULL LIMIT 1
  `.execute(database);
  return result.rows[0] ?? null;
}

async function insertItems(
  transaction: ExportSalesTransaction,
  exportSaleId: number,
  items: ExportSaleLineItem[]
) {
  for (const item of items) {
    await sql`
      INSERT INTO billing_export_sales_items (
        uuid, export_sale_id, line_number, product_id, description, hsn_code_id, po_no, dc_no,
        colour_id, size_id, quantity, unit_id, rate, tax_id, tax_rate, taxable_amount,
        cgst_amount, sgst_amount, igst_amount, tax_amount, line_total
      ) VALUES (
        ${publicUuid()}, ${exportSaleId}, ${item.lineNumber}, ${item.productId}, ${item.description},
        ${item.hsnCodeId}, ${item.poNo ?? ""}, ${item.dcNo ?? ""}, ${item.colourId},
        ${item.sizeId}, ${item.quantity}, ${item.unitId}, ${item.rate}, ${item.taxId},
        ${item.taxRate}, ${item.taxableAmount}, ${item.cgstAmount}, ${item.sgstAmount},
        ${item.igstAmount}, ${item.taxAmount}, ${item.lineTotal}
      )
    `.execute(transaction);
  }
}

async function insertActivity(
  transaction: ExportSalesTransaction,
  exportSaleId: number,
  activityType: string,
  action: string,
  previousStatus: ExportSaleStatus | null,
  newStatus: ExportSaleStatus | null
) {
  await sql`
    INSERT INTO billing_export_sales_activities (
      uuid, export_sale_id, activity_type, action, description, previous_status, new_status
    ) VALUES (
      ${publicUuid()}, ${exportSaleId}, ${activityType}, ${action},
      ${`Export sales ${activityType}.`}, ${previousStatus}, ${newStatus}
    )
  `.execute(transaction);
}

async function upsertEinvoice(
  transaction: ExportSalesTransaction,
  exportSaleId: number,
  value: ExportSaleEinvoiceDetails
) {
  await sql`DELETE FROM billing_export_sales_einvoices WHERE export_sale_id = ${exportSaleId}`.execute(
    transaction
  );
  if (value.status === "not-generated" && !value.irn) return;
  await sql`
    INSERT INTO billing_export_sales_einvoices (
      uuid, export_sale_id, irn, ack_number, ack_date, signed_qr, status, generated_at
    ) VALUES (
      ${publicUuid()}, ${exportSaleId}, ${value.irn}, ${value.ackNo || null}, ${value.ackDate || null},
      ${value.signedQr || null}, ${value.status},
      ${value.status === "generated" ? sql`CURRENT_TIMESTAMP(3)` : null}
    )
  `.execute(transaction);
}

async function upsertEway(
  transaction: ExportSalesTransaction,
  exportSaleId: number,
  value: ExportSaleEwayDetails
) {
  await sql`DELETE FROM billing_export_sales_eway_bills WHERE export_sale_id = ${exportSaleId}`.execute(
    transaction
  );
  if (value.status === "not-generated" && !value.billNo) return;
  await sql`
    INSERT INTO billing_export_sales_eway_bills (
      uuid, export_sale_id, bill_number, bill_date, part, transport_id, vehicle_number,
      status, notes, generated_at
    ) VALUES (
      ${publicUuid()}, ${exportSaleId}, ${value.billNo}, ${value.billDate}, ${value.part},
      ${value.transportId}, ${value.vehicleNo || null}, ${value.status}, ${value.notes || null},
      ${value.status === "generated" ? sql`CURRENT_TIMESTAMP(3)` : null}
    )
  `.execute(transaction);
}

async function existingIds(database: Kysely<ExportSalesDatabase>, query: RawBuilder<unknown>) {
  const result = await query.execute(database);
  return new Set((result.rows as Array<{ id: number }>).map((row) => Number(row.id)));
}

function nonNullIds(values: Array<number | null>) {
  return [
    ...new Set(
      values.filter(
        (value): value is number =>
          typeof value === "number" && Number.isInteger(value) && value > 0
      )
    )
  ];
}

function toExportSaleItem(row: ExportSaleItemRow): ExportSaleLineItem {
  return {
    cgstAmount: money(row.cgst_amount),
    colour: row.colour_name ?? "",
    colourId: row.colour_id,
    dcNo: row.dc_no ?? "",
    description: row.description,
    hsnCode: row.hsn_code ?? "",
    hsnCodeId: row.hsn_code_id,
    id: row.uuid,
    igstAmount: money(row.igst_amount),
    lineNumber: row.line_number,
    lineTotal: money(row.line_total),
    poNo: row.po_no ?? "",
    productId: row.product_id,
    productName: row.product_name ?? "",
    quantity: Number(row.quantity),
    rate: Number(row.rate),
    sgstAmount: money(row.sgst_amount),
    size: row.size_name ?? "",
    sizeId: row.size_id,
    taxAmount: money(row.tax_amount),
    taxId: row.tax_id,
    taxRate: Number(row.tax_rate),
    taxableAmount: money(row.taxable_amount),
    unit: row.unit_name,
    unitId: row.unit_id
  };
}

function formatAddress(row: ExportSaleHeaderRow, kind: "billing" | "shipping") {
  const prefix = kind === "billing" ? "billing" : "shipping";
  const value = (name: string) => row[`${prefix}_${name}` as keyof ExportSaleHeaderRow];
  return [
    value("address_line1"),
    value("address_line2"),
    [value("city"), value("district")].filter(Boolean).join(", "),
    [value("state"), value("pincode")].filter(Boolean).join(" - "),
    value("country")
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

function defaultEway(): ExportSaleEwayDetails {
  return {
    billDate: "",
    billNo: "",
    notes: "",
    part: "Part B",
    status: "not-generated",
    transport: "",
    transportGst: "",
    transportId: null,
    vehicleNo: ""
  };
}

function defaultEinvoice(): ExportSaleEinvoiceDetails {
  return { ackDate: "", ackNo: "", irn: "", signedQr: "", status: "not-generated" };
}

function publicUuid() {
  return randomBytes(4).toString("hex");
}

function money(value: string | number | null | undefined) {
  return Number(Number(value ?? 0).toFixed(2));
}
