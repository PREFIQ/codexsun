import { randomBytes } from "node:crypto";
import { sql, type Kysely, type RawBuilder, type Transaction } from "kysely";
import { getBillingDatabase } from "../../database/billing-database.js";
import type {
  Quotation,
  QuotationContext,
  QuotationLineItem,
  QuotationSavePayload,
  QuotationStatus
} from "./quotation.types.js";

type QuotationDatabase = Record<string, never>;
type QuotationTransaction = Transaction<QuotationDatabase>;

type QuotationHeaderRow = {
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
  generated_sales_invoice_no: string | null;
  id: number;
  quotation_number: string;
  quotation_date: string;
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
  status: QuotationStatus;
  subtotal: string | number;
  tax_amount: string | number;
  tax_type: "cgst-sgst" | "igst";
  terms: string | null;
  updated_at: string;
  uuid: string;
  work_order_id: number | null;
  work_order_no: string | null;
};

type QuotationItemRow = {
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

export type QuotationReferenceState = {
  billingAddress: boolean;
  company: boolean;
  currency: boolean;
  customer: boolean;
  financialYear: boolean;
  ledger: boolean;
  shippingAddress: boolean;
  workOrder: boolean;
};

export class QuotationRepository {
  async list(databaseName: string) {
    const database = await quotationDatabase(databaseName);
    const result = await selectQuotationHeaders().execute(database);
    return Promise.all(result.rows.map((row) => this.hydrate(database, row)));
  }

  async listPage(
    databaseName: string,
    options: { customer: string; page: number; pageSize: number; search: string; status: string }
  ) {
    const database = await quotationDatabase(databaseName);
    const search = `%${options.search.trim()}%`;
    const customer = options.customer.trim().toLowerCase();
    const offset = (options.page - 1) * options.pageSize;
    const result = await selectQuotationHeaders(undefined, {
      customer,
      limit: options.pageSize,
      offset,
      search,
      status: options.status
    }).execute(database);
    const count = await sql<{ total: string | number }>`
      SELECT COUNT(*) AS total FROM billing_quotations s
      INNER JOIN contacts customer ON customer.id=s.customer_id
      LEFT JOIN work_orders work_order ON work_order.id=s.work_order_id
      WHERE s.deleted_at IS NULL
        AND (${options.status}='all' OR s.status=${options.status})
        AND (${customer}='all' OR LOWER(customer.name)=${customer})
        AND (${search}='%%' OR s.quotation_number LIKE ${search} OR customer.name LIKE ${search}
          OR COALESCE(work_order.code,'') LIKE ${search}
          OR DATE_FORMAT(s.quotation_date,'%Y-%m-%d') LIKE ${search}
          OR s.status LIKE ${search} OR CAST(s.amount AS CHAR) LIKE ${search})
    `.execute(database);
    return {
      items: await Promise.all(result.rows.map((row) => this.hydrate(database, row))),
      page: options.page,
      pageSize: options.pageSize,
      total: Number(count.rows[0]?.total ?? 0)
    };
  }

  async get(databaseName: string, uuid: string) {
    const database = await quotationDatabase(databaseName);
    const result = await selectQuotationHeaders(uuid).execute(database);
    const row = result.rows[0];
    return row ? this.hydrate(database, row) : null;
  }

  async context(databaseName: string): Promise<QuotationContext | null> {
    const database = await quotationDatabase(databaseName);
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
    input: QuotationSavePayload
  ): Promise<QuotationReferenceState> {
    const database = await quotationDatabase(databaseName);
    const result = await sql<Record<keyof QuotationReferenceState, number>>`
      SELECT
        EXISTS(SELECT 1 FROM companies WHERE id = ${input.companyId} AND status = 'active') AS company,
        EXISTS(SELECT 1 FROM financial_years WHERE id = ${input.financialYearId} AND status = 'active' AND ${input.date} BETWEEN start_date AND end_date) AS financialYear,
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
    input: QuotationSavePayload
  ): Promise<QuotationSavePayload> {
    const database = await quotationDatabase(databaseName);
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
    const workOrderResult = !input.workOrderId
      ? await sql<{ id: number }>`
            SELECT id FROM work_orders
            WHERE status = 'active'
            ORDER BY CASE WHEN code=${input.workOrderNo} AND ${input.workOrderNo}<>'' THEN 0
              WHEN TRIM(code)='-' THEN 1 ELSE 2 END,id LIMIT 1
          `.execute(database)
      : null;
    const ledgerResult = !input.ledgerId
      ? await sql<{ id: number }>`
            SELECT id FROM ledgers
            WHERE status = 'active'
            ORDER BY CASE WHEN LOWER(name)=LOWER(${input.salesLedger}) AND ${input.salesLedger}<>'' THEN 0
              WHEN TRIM(name)='-' THEN 1 ELSE 2 END,id LIMIT 1
          `.execute(database)
      : null;

    const items: QuotationSavePayload["items"] = [];
    for (const item of input.items) {
      const product =
        item.productId || item.productName
          ? await sql<{
              id: number;
              hsn_code_id: number | null;
              tax_id: number | null;
              unit_id: number | null;
            }>`
              SELECT id, hsn_code_id, gst_tax_id AS tax_id, unit_id FROM products
              WHERE (${item.productId || 0} > 0 AND id=${item.productId || 0}
                OR ${item.productId || 0}=0 AND LOWER(name)=LOWER(${item.productName}))
                AND status = 'active' AND deleted_at IS NULL
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

  async validItemReferenceIds(databaseName: string, input: QuotationSavePayload) {
    const database = await quotationDatabase(databaseName);
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

  async findByQuotationNumber(
    databaseName: string,
    companyId: number,
    financialYearId: number,
    quotationNumber: string
  ) {
    const database = await quotationDatabase(databaseName);
    const result = await sql<{ uuid: string }>`
      SELECT uuid FROM billing_quotations
      WHERE company_id = ${companyId}
        AND financial_year_id = ${financialYearId}
        AND quotation_number = ${quotationNumber}
        AND deleted_at IS NULL
      LIMIT 1
    `.execute(database);
    return result.rows[0]?.uuid ?? null;
  }

  async create(
    databaseName: string,
    input: QuotationSavePayload,
    totals: Pick<Quotation, "amount" | "items" | "subtotal" | "taxAmount">
  ) {
    const database = await quotationDatabase(databaseName);
    const uuid = publicUuid();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await database.transaction().execute(async (transaction) => {
          const lineResult = await sql<{ line_number: number }>`
        SELECT COALESCE(MAX(line_number), 0) + 1 AS line_number
        FROM billing_quotations
        WHERE company_id = ${input.companyId} AND financial_year_id = ${input.financialYearId}
      `.execute(transaction);
          const lineNumber = Number(lineResult.rows[0]?.line_number ?? 1);
          const inserted = await sql`
        INSERT INTO billing_quotations (
          uuid, company_id, financial_year_id, line_number, quotation_number, customer_id,
          billing_address_id, shipping_address_id, work_order_id, ledger_id, tax_type,
          currency_id, quotation_date, subtotal, tax_amount, round_off, amount, terms, notes, status
        ) VALUES (
          ${uuid}, ${input.companyId}, ${input.financialYearId}, ${lineNumber}, ${input.quotationNumber},
          ${input.customerId}, ${input.billingAddressId}, ${input.shippingAddressId},
          ${input.workOrderId}, ${input.ledgerId}, ${input.taxType ?? "cgst-sgst"},
          ${input.currencyId}, ${input.date}, ${totals.subtotal}, ${totals.taxAmount},
          ${input.roundOff ?? 0}, ${totals.amount}, ${input.terms ?? ""}, ${input.notes}, ${input.status}
        )
      `.execute(transaction);
          const quotationId = Number(inserted.insertId);
          await insertItems(transaction, quotationId, totals.items);
          await insertActivity(transaction, quotationId, "created", "create", null, input.status);
        });
        break;
      } catch (error) {
        if (isDuplicateKey(error, "billing_quotations_line_unique") && attempt < 4) continue;
        throw error;
      }
    }
    return this.get(databaseName, uuid);
  }

  async update(
    databaseName: string,
    uuid: string,
    input: QuotationSavePayload,
    totals: Pick<Quotation, "amount" | "items" | "subtotal" | "taxAmount">
  ) {
    const database = await quotationDatabase(databaseName);
    const existing = await internalQuotation(database, uuid);
    if (!existing) return null;
    await database.transaction().execute(async (transaction) => {
      await sql`
        UPDATE billing_quotations SET
          company_id = ${input.companyId}, financial_year_id = ${input.financialYearId},
          quotation_number = ${input.quotationNumber}, customer_id = ${input.customerId},
          billing_address_id = ${input.billingAddressId}, shipping_address_id = ${input.shippingAddressId},
          work_order_id = ${input.workOrderId}, ledger_id = ${input.ledgerId},
          tax_type = ${input.taxType ?? "cgst-sgst"}, currency_id = ${input.currencyId},
          quotation_date = ${input.date}, subtotal = ${totals.subtotal}, tax_amount = ${totals.taxAmount},
          round_off = ${input.roundOff ?? 0}, amount = ${totals.amount}, terms = ${input.terms ?? ""},
          notes = ${input.notes}, status = ${input.status}, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ${existing.id}
      `.execute(transaction);
      await sql`DELETE FROM billing_quotation_items WHERE quotation_id = ${existing.id}`.execute(
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

  async setStatus(databaseName: string, uuid: string, status: QuotationStatus) {
    const database = await quotationDatabase(databaseName);
    const existing = await internalQuotation(database, uuid);
    if (!existing) return null;
    await database.transaction().execute(async (transaction) => {
      await sql`
        UPDATE billing_quotations SET status = ${status},
          confirmed_at = ${status === "confirmed" ? sql`CURRENT_TIMESTAMP(3)` : null},
          cancelled_at = ${status === "cancelled" ? sql`CURRENT_TIMESTAMP(3)` : null},
          updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ${existing.id}
      `.execute(transaction);
      await insertActivity(transaction, existing.id, status, "status", existing.status, status);
    });
    return this.get(databaseName, uuid);
  }

  async setGeneratedSalesInvoice(databaseName: string, uuid: string, invoiceNumber: string) {
    const database = await quotationDatabase(databaseName);
    const existing = await internalQuotation(database, uuid);
    if (!existing) return null;
    await database.transaction().execute(async (transaction) => {
      await sql`
        UPDATE billing_quotations
        SET generated_sales_invoice_no = ${invoiceNumber}, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ${existing.id}
      `.execute(transaction);
      await insertActivity(
        transaction,
        existing.id,
        "converted",
        "convert-to-sale",
        existing.status,
        existing.status
      );
    });
    return this.get(databaseName, uuid);
  }

  async softDelete(databaseName: string, uuid: string) {
    const database = await quotationDatabase(databaseName);
    const existing = await internalQuotation(database, uuid);
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
        UPDATE billing_quotations SET deleted_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ${existing.id}
      `.execute(transaction);
    });
    return { uuid };
  }

  private async hydrate(
    database: Kysely<QuotationDatabase>,
    row: QuotationHeaderRow
  ): Promise<Quotation> {
    const itemsResult = await selectQuotationItems(row.id).execute(database);
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
      financialYearId: row.financial_year_id,
      financialYearName: row.financial_year_name,
      generatedSalesInvoiceNo: row.generated_sales_invoice_no ?? "",
      id: row.uuid,
      quotationNumber: row.quotation_number,
      date: row.quotation_date,
      items: itemsResult.rows.map(toQuotationItem),
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

function isDuplicateKey(error: unknown, keyName: string) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return candidate.code === "ER_DUP_ENTRY" && candidate.message?.includes(keyName) === true;
}

function quotationDatabase(databaseName: string) {
  return getBillingDatabase(databaseName) as unknown as Promise<Kysely<QuotationDatabase>>;
}

function selectQuotationHeaders(
  uuid?: string,
  page?: { customer: string; limit: number; offset: number; search: string; status: string }
) {
  return sql<QuotationHeaderRow>`
    SELECT s.id, s.uuid, s.company_id, company.name AS company_name,
           s.financial_year_id, financial_year.name AS financial_year_name,
           s.line_number, s.quotation_number, s.customer_id, customer.name AS customer_name,
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
           DATE_FORMAT(s.quotation_date, '%Y-%m-%d') AS quotation_date,
            s.subtotal, s.tax_amount, s.round_off, s.amount, s.terms, s.notes, s.status,
            s.generated_sales_invoice_no,
           DATE_FORMAT(s.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at,
           DATE_FORMAT(s.updated_at, '%Y-%m-%dT%H:%i:%s') AS updated_at
    FROM billing_quotations s
    INNER JOIN companies company ON company.id = s.company_id
    INNER JOIN financial_years financial_year ON financial_year.id = s.financial_year_id
    INNER JOIN contacts customer ON customer.id = s.customer_id
    INNER JOIN contacts_addresses billing ON billing.id = s.billing_address_id
    INNER JOIN contacts_addresses shipping ON shipping.id = s.shipping_address_id
    INNER JOIN currencies currency ON currency.id = s.currency_id
    LEFT JOIN work_orders work_order ON work_order.id = s.work_order_id
    LEFT JOIN ledgers ledger ON ledger.id = s.ledger_id
    WHERE s.deleted_at IS NULL ${uuid ? sql`AND s.uuid = ${uuid}` : sql``}
      ${
        page
          ? sql`AND (${page.status}='all' OR s.status=${page.status})
        AND (${page.customer}='all' OR LOWER(customer.name)=${page.customer})
        AND (${page.search}='%%' OR s.quotation_number LIKE ${page.search}
          OR customer.name LIKE ${page.search} OR COALESCE(work_order.code,'') LIKE ${page.search}
          OR DATE_FORMAT(s.quotation_date,'%Y-%m-%d') LIKE ${page.search}
          OR s.status LIKE ${page.search} OR CAST(s.amount AS CHAR) LIKE ${page.search})`
          : sql``
      }
    ORDER BY s.quotation_date DESC, s.line_number DESC
    ${page ? sql`LIMIT ${page.limit} OFFSET ${page.offset}` : sql``}
  `;
}

function selectQuotationItems(quotationId: number) {
  return sql<QuotationItemRow>`
    SELECT item.uuid, item.line_number, item.product_id, product.name AS product_name,
           item.description, item.hsn_code_id, hsn.code AS hsn_code, item.po_no, item.dc_no,
           item.colour_id, colour.name AS colour_name, item.size_id, size.name AS size_name,
           item.quantity, item.unit_id, unit.name AS unit_name, item.rate,
           item.tax_id, item.tax_rate, item.taxable_amount, item.cgst_amount,
           item.sgst_amount, item.igst_amount, item.tax_amount, item.line_total
    FROM billing_quotation_items item
    LEFT JOIN products product ON product.id = item.product_id
    LEFT JOIN hsn_codes hsn ON hsn.id = item.hsn_code_id
    LEFT JOIN colours colour ON colour.id = item.colour_id
    LEFT JOIN sizes size ON size.id = item.size_id
    INNER JOIN units unit ON unit.id = item.unit_id
    LEFT JOIN taxes tax ON tax.id = item.tax_id
    WHERE item.quotation_id = ${quotationId}
    ORDER BY item.line_number
  `;
}

async function internalQuotation(database: Kysely<QuotationDatabase>, uuid: string) {
  const result = await sql<{ id: number; status: QuotationStatus }>`
    SELECT id, status FROM billing_quotations WHERE uuid = ${uuid} AND deleted_at IS NULL LIMIT 1
  `.execute(database);
  return result.rows[0] ?? null;
}

async function insertItems(
  transaction: QuotationTransaction,
  quotationId: number,
  items: QuotationLineItem[]
) {
  for (const item of items) {
    await sql`
      INSERT INTO billing_quotation_items (
        uuid, quotation_id, line_number, product_id, description, hsn_code_id, po_no, dc_no,
        colour_id, size_id, quantity, unit_id, rate, tax_id, tax_rate, taxable_amount,
        cgst_amount, sgst_amount, igst_amount, tax_amount, line_total
      ) VALUES (
        ${publicUuid()}, ${quotationId}, ${item.lineNumber}, ${item.productId}, ${item.description},
        ${item.hsnCodeId}, ${item.poNo ?? ""}, ${item.dcNo ?? ""}, ${item.colourId},
        ${item.sizeId}, ${item.quantity}, ${item.unitId}, ${item.rate}, ${item.taxId},
        ${item.taxRate}, ${item.taxableAmount}, ${item.cgstAmount}, ${item.sgstAmount},
        ${item.igstAmount}, ${item.taxAmount}, ${item.lineTotal}
      )
    `.execute(transaction);
  }
}

async function insertActivity(
  transaction: QuotationTransaction,
  quotationId: number,
  activityType: string,
  action: string,
  previousStatus: QuotationStatus | null,
  newStatus: QuotationStatus | null
) {
  await sql`
    INSERT INTO billing_quotation_activities (
      uuid, quotation_id, activity_type, action, description, previous_status, new_status
    ) VALUES (
      ${publicUuid()}, ${quotationId}, ${activityType}, ${action},
      ${`Quotation ${activityType}.`}, ${previousStatus}, ${newStatus}
    )
  `.execute(transaction);
}

async function existingIds(database: Kysely<QuotationDatabase>, query: RawBuilder<unknown>) {
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

function toQuotationItem(row: QuotationItemRow): QuotationLineItem {
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

function formatAddress(row: QuotationHeaderRow, kind: "billing" | "shipping") {
  const prefix = kind === "billing" ? "billing" : "shipping";
  const value = (name: string) => row[`${prefix}_${name}` as keyof QuotationHeaderRow];
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

function publicUuid() {
  return randomBytes(4).toString("hex");
}

function money(value: string | number | null | undefined) {
  return Number(Number(value ?? 0).toFixed(2));
}
