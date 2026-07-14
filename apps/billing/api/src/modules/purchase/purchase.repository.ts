import { randomBytes } from "node:crypto";
import { sql, type Kysely, type RawBuilder, type Transaction } from "kysely";
import { getBillingDatabase } from "../../database/billing-database.js";
import type {
  Purchase,
  PurchaseContext,
  PurchaseLineItem,
  PurchaseSavePayload,
  PurchaseStatus
} from "./purchase.types.js";

type PurchaseDatabase = Record<string, never>;
type PurchaseTransaction = Transaction<PurchaseDatabase>;

type PurchaseHeaderRow = {
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
  supplier_email: string | null;
  supplier_id: number;
  supplier_name: string;
  supplier_phone: string | null;
  supplier_bill_date: string | null;
  supplier_bill_number: string | null;
  financial_year_id: number;
  financial_year_name: string;
  generated_sales_invoice_no: string | null;
  id: number;
  purchase_number: string;
  purchase_date: string;
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
  status: PurchaseStatus;
  subtotal: string | number;
  tax_amount: string | number;
  tax_type: "cgst-sgst" | "igst";
  terms: string | null;
  updated_at: string;
  uuid: string;
  work_order_id: number | null;
  work_order_no: string | null;
};

type PurchaseItemRow = {
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

export type PurchaseReferenceState = {
  billingAddress: boolean;
  company: boolean;
  currency: boolean;
  supplier: boolean;
  financialYear: boolean;
  ledger: boolean;
  shippingAddress: boolean;
  workOrder: boolean;
};

export class PurchaseRepository {
  async list(databaseName: string) {
    const database = await purchaseDatabase(databaseName);
    const result = await selectPurchaseHeaders().execute(database);
    return Promise.all(result.rows.map((row) => this.hydrate(database, row)));
  }

  async get(databaseName: string, uuid: string) {
    const database = await purchaseDatabase(databaseName);
    const result = await selectPurchaseHeaders(uuid).execute(database);
    const row = result.rows[0];
    return row ? this.hydrate(database, row) : null;
  }

  async context(databaseName: string): Promise<PurchaseContext | null> {
    const database = await purchaseDatabase(databaseName);
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
    input: PurchaseSavePayload
  ): Promise<PurchaseReferenceState> {
    const database = await purchaseDatabase(databaseName);
    const result = await sql<Record<keyof PurchaseReferenceState, number>>`
      SELECT
        EXISTS(SELECT 1 FROM companies WHERE id = ${input.companyId} AND status = 'active') AS company,
        EXISTS(SELECT 1 FROM financial_years WHERE id = ${input.financialYearId} AND status = 'active' AND ${input.issuedOn} BETWEEN start_date AND end_date) AS financialYear,
        EXISTS(SELECT 1 FROM contacts WHERE id = ${input.supplierId} AND status = 'active') AS supplier,
        EXISTS(SELECT 1 FROM contacts_addresses WHERE id = ${input.billingAddressId} AND parent_id = ${input.supplierId}) AS billingAddress,
        EXISTS(SELECT 1 FROM contacts_addresses WHERE id = ${input.shippingAddressId} AND parent_id = ${input.supplierId}) AS shippingAddress,
        ${input.workOrderId ? sql`EXISTS(SELECT 1 FROM work_orders WHERE id = ${input.workOrderId} AND status = 'active')` : sql`1`} AS workOrder,
        ${input.ledgerId ? sql`EXISTS(SELECT 1 FROM ledgers WHERE id = ${input.ledgerId} AND status = 'active')` : sql`1`} AS ledger,
        EXISTS(SELECT 1 FROM currencies WHERE id = ${input.currencyId} AND status = 'active') AS currency
    `.execute(database);
    const row = result.rows[0];
    return {
      billingAddress: Boolean(row?.billingAddress),
      company: Boolean(row?.company),
      currency: Boolean(row?.currency),
      supplier: Boolean(row?.supplier),
      financialYear: Boolean(row?.financialYear),
      ledger: Boolean(row?.ledger),
      shippingAddress: Boolean(row?.shippingAddress),
      workOrder: Boolean(row?.workOrder)
    };
  }

  async resolveMissingReferences(
    databaseName: string,
    input: PurchaseSavePayload
  ): Promise<PurchaseSavePayload> {
    const database = await purchaseDatabase(databaseName);
    const context = await this.context(databaseName);
    const contactResult =
      input.supplierId > 0
        ? null
        : await sql<{ id: number }>`
            SELECT id FROM contacts
            WHERE LOWER(name) = LOWER(${input.supplierName}) AND status = 'active'
            LIMIT 1
          `.execute(database);
    const supplierId = input.supplierId || Number(contactResult?.rows[0]?.id ?? 0);
    const addressResult =
      supplierId > 0 && (!input.billingAddressId || !input.shippingAddressId)
        ? await sql<{ id: number }>`
            SELECT id FROM contacts_addresses
            WHERE parent_id = ${supplierId}
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

    const items: PurchaseSavePayload["items"] = [];
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
      supplierId,
      financialYearId: input.financialYearId || context?.financialYearId || 0,
      items,
      ledgerId: input.ledgerId ?? ledgerResult?.rows[0]?.id ?? null,
      shippingAddressId: input.shippingAddressId || addressIds[1] || addressIds[0] || 0,
      workOrderId: input.workOrderId ?? workOrderResult?.rows[0]?.id ?? null
    };
  }

  async validItemReferenceIds(databaseName: string, input: PurchaseSavePayload) {
    const database = await purchaseDatabase(databaseName);
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

  async findByPurchaseNumber(
    databaseName: string,
    companyId: number,
    financialYearId: number,
    invoiceNumber: string
  ) {
    const database = await purchaseDatabase(databaseName);
    const result = await sql<{ uuid: string }>`
      SELECT uuid FROM billing_purchases
      WHERE company_id = ${companyId}
        AND financial_year_id = ${financialYearId}
        AND purchase_number = ${invoiceNumber}
        AND deleted_at IS NULL
      LIMIT 1
    `.execute(database);
    return result.rows[0]?.uuid ?? null;
  }

  async create(
    databaseName: string,
    input: PurchaseSavePayload,
    totals: Pick<Purchase, "amount" | "items" | "subtotal" | "taxAmount">
  ) {
    const database = await purchaseDatabase(databaseName);
    const uuid = publicUuid();
    await database.transaction().execute(async (transaction) => {
      const lineResult = await sql<{ line_number: number }>`
        SELECT COALESCE(MAX(line_number), 0) + 1 AS line_number
        FROM billing_purchases
        WHERE company_id = ${input.companyId} AND financial_year_id = ${input.financialYearId}
      `.execute(transaction);
      const lineNumber = Number(lineResult.rows[0]?.line_number ?? 1);
      const inserted = await sql`
        INSERT INTO billing_purchases (
          uuid, company_id, financial_year_id, line_number, purchase_number, supplier_id,
          supplier_bill_number, supplier_bill_date,
          billing_address_id, shipping_address_id, work_order_id, ledger_id, tax_type,
          currency_id, purchase_date, subtotal, tax_amount, round_off, amount, terms, notes, status
        ) VALUES (
          ${uuid}, ${input.companyId}, ${input.financialYearId}, ${lineNumber}, ${input.invoiceNumber},
          ${input.supplierId}, ${input.supplierBillNo ?? null}, ${input.supplierBillDate || null},
          ${input.billingAddressId}, ${input.shippingAddressId},
          ${input.workOrderId}, ${input.ledgerId}, ${input.taxType ?? "cgst-sgst"},
          ${input.currencyId}, ${input.issuedOn}, ${totals.subtotal}, ${totals.taxAmount},
          ${input.roundOff ?? 0}, ${totals.amount}, ${input.terms ?? ""}, ${input.notes}, ${input.status}
        )
      `.execute(transaction);
      const purchaseId = Number(inserted.insertId);
      await insertItems(transaction, purchaseId, totals.items);
      await insertActivity(transaction, purchaseId, "created", "create", null, input.status);
    });
    return this.get(databaseName, uuid);
  }

  async update(
    databaseName: string,
    uuid: string,
    input: PurchaseSavePayload,
    totals: Pick<Purchase, "amount" | "items" | "subtotal" | "taxAmount">
  ) {
    const database = await purchaseDatabase(databaseName);
    const existing = await internalPurchase(database, uuid);
    if (!existing) return null;
    await database.transaction().execute(async (transaction) => {
      await sql`
        UPDATE billing_purchases SET
          company_id = ${input.companyId}, financial_year_id = ${input.financialYearId},
          purchase_number = ${input.invoiceNumber}, supplier_id = ${input.supplierId},
          supplier_bill_number = ${input.supplierBillNo ?? null},
          supplier_bill_date = ${input.supplierBillDate || null},
          billing_address_id = ${input.billingAddressId}, shipping_address_id = ${input.shippingAddressId},
          work_order_id = ${input.workOrderId}, ledger_id = ${input.ledgerId},
          tax_type = ${input.taxType ?? "cgst-sgst"}, currency_id = ${input.currencyId},
          purchase_date = ${input.issuedOn}, subtotal = ${totals.subtotal}, tax_amount = ${totals.taxAmount},
          round_off = ${input.roundOff ?? 0}, amount = ${totals.amount}, terms = ${input.terms ?? ""},
          notes = ${input.notes}, status = ${input.status}, updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ${existing.id}
      `.execute(transaction);
      await sql`DELETE FROM billing_purchase_items WHERE purchase_id = ${existing.id}`.execute(
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

  async setStatus(databaseName: string, uuid: string, status: PurchaseStatus) {
    const database = await purchaseDatabase(databaseName);
    const existing = await internalPurchase(database, uuid);
    if (!existing) return null;
    await database.transaction().execute(async (transaction) => {
      await sql`
        UPDATE billing_purchases SET status = ${status},
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
    const database = await purchaseDatabase(databaseName);
    const existing = await internalPurchase(database, uuid);
    if (!existing) return null;
    await database.transaction().execute(async (transaction) => {
      await sql`
        UPDATE billing_purchases
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
    const database = await purchaseDatabase(databaseName);
    const existing = await internalPurchase(database, uuid);
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
        UPDATE billing_purchases SET deleted_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ${existing.id}
      `.execute(transaction);
    });
    return { uuid };
  }

  private async hydrate(
    database: Kysely<PurchaseDatabase>,
    row: PurchaseHeaderRow
  ): Promise<Purchase> {
    const itemsResult = await selectPurchaseItems(row.id).execute(database);
    return {
      amount: money(row.amount),
      billingAddress: formatAddress(row, "billing"),
      billingAddressId: row.billing_address_id,
      companyId: row.company_id,
      companyName: row.company_name,
      createdAt: row.created_at,
      currencyCode: row.currency_code,
      currencyId: row.currency_id,
      supplierEmail: row.supplier_email ?? "",
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      supplierPhone: row.supplier_phone ?? "",
      supplierBillDate: row.supplier_bill_date ?? "",
      supplierBillNo: row.supplier_bill_number ?? "",
      financialYearId: row.financial_year_id,
      financialYearName: row.financial_year_name,
      generatedSalesInvoiceNo: row.generated_sales_invoice_no ?? "",
      id: row.uuid,
      invoiceNumber: row.purchase_number,
      issuedOn: row.purchase_date,
      items: itemsResult.rows.map(toPurchaseItem),
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

function purchaseDatabase(databaseName: string) {
  return getBillingDatabase(databaseName) as unknown as Promise<Kysely<PurchaseDatabase>>;
}

function selectPurchaseHeaders(uuid?: string) {
  return sql<PurchaseHeaderRow>`
    SELECT s.id, s.uuid, s.company_id, company.name AS company_name,
           s.financial_year_id, financial_year.name AS financial_year_name,
           s.line_number, s.purchase_number, s.supplier_id, supplier.name AS supplier_name,
           supplier.primary_email AS supplier_email, supplier.primary_phone AS supplier_phone,
           DATE_FORMAT(s.supplier_bill_date, '%Y-%m-%d') AS supplier_bill_date,
           s.supplier_bill_number,
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
           DATE_FORMAT(s.purchase_date, '%Y-%m-%d') AS purchase_date,
            s.subtotal, s.tax_amount, s.round_off, s.amount, s.terms, s.notes, s.status,
            s.generated_sales_invoice_no,
           DATE_FORMAT(s.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at,
           DATE_FORMAT(s.updated_at, '%Y-%m-%dT%H:%i:%s') AS updated_at
    FROM billing_purchases s
    INNER JOIN companies company ON company.id = s.company_id
    INNER JOIN financial_years financial_year ON financial_year.id = s.financial_year_id
    INNER JOIN contacts supplier ON supplier.id = s.supplier_id
    INNER JOIN contacts_addresses billing ON billing.id = s.billing_address_id
    INNER JOIN contacts_addresses shipping ON shipping.id = s.shipping_address_id
    INNER JOIN currencies currency ON currency.id = s.currency_id
    LEFT JOIN work_orders work_order ON work_order.id = s.work_order_id
    LEFT JOIN ledgers ledger ON ledger.id = s.ledger_id
    WHERE s.deleted_at IS NULL ${uuid ? sql`AND s.uuid = ${uuid}` : sql``}
    ORDER BY s.purchase_date DESC, s.line_number DESC
  `;
}

function selectPurchaseItems(purchaseId: number) {
  return sql<PurchaseItemRow>`
    SELECT item.uuid, item.line_number, item.product_id, product.name AS product_name,
           item.description, item.hsn_code_id, hsn.code AS hsn_code, item.po_no, item.dc_no,
           item.colour_id, colour.name AS colour_name, item.size_id, size.name AS size_name,
           item.quantity, item.unit_id, unit.name AS unit_name, item.rate,
           item.tax_id, item.tax_rate, item.taxable_amount, item.cgst_amount,
           item.sgst_amount, item.igst_amount, item.tax_amount, item.line_total
    FROM billing_purchase_items item
    LEFT JOIN products product ON product.id = item.product_id
    LEFT JOIN hsn_codes hsn ON hsn.id = item.hsn_code_id
    LEFT JOIN colours colour ON colour.id = item.colour_id
    LEFT JOIN sizes size ON size.id = item.size_id
    INNER JOIN units unit ON unit.id = item.unit_id
    LEFT JOIN taxes tax ON tax.id = item.tax_id
    WHERE item.purchase_id = ${purchaseId}
    ORDER BY item.line_number
  `;
}

async function internalPurchase(database: Kysely<PurchaseDatabase>, uuid: string) {
  const result = await sql<{ id: number; status: PurchaseStatus }>`
    SELECT id, status FROM billing_purchases WHERE uuid = ${uuid} AND deleted_at IS NULL LIMIT 1
  `.execute(database);
  return result.rows[0] ?? null;
}

async function insertItems(
  transaction: PurchaseTransaction,
  purchaseId: number,
  items: PurchaseLineItem[]
) {
  for (const item of items) {
    await sql`
      INSERT INTO billing_purchase_items (
        uuid, purchase_id, line_number, product_id, description, hsn_code_id, po_no, dc_no,
        colour_id, size_id, quantity, unit_id, rate, tax_id, tax_rate, taxable_amount,
        cgst_amount, sgst_amount, igst_amount, tax_amount, line_total
      ) VALUES (
        ${publicUuid()}, ${purchaseId}, ${item.lineNumber}, ${item.productId}, ${item.description},
        ${item.hsnCodeId}, ${item.poNo ?? ""}, ${item.dcNo ?? ""}, ${item.colourId},
        ${item.sizeId}, ${item.quantity}, ${item.unitId}, ${item.rate}, ${item.taxId},
        ${item.taxRate}, ${item.taxableAmount}, ${item.cgstAmount}, ${item.sgstAmount},
        ${item.igstAmount}, ${item.taxAmount}, ${item.lineTotal}
      )
    `.execute(transaction);
  }
}

async function insertActivity(
  transaction: PurchaseTransaction,
  purchaseId: number,
  activityType: string,
  action: string,
  previousStatus: PurchaseStatus | null,
  newStatus: PurchaseStatus | null
) {
  await sql`
    INSERT INTO billing_purchase_activities (
      uuid, purchase_id, activity_type, action, description, previous_status, new_status
    ) VALUES (
      ${publicUuid()}, ${purchaseId}, ${activityType}, ${action},
      ${`Purchase ${activityType}.`}, ${previousStatus}, ${newStatus}
    )
  `.execute(transaction);
}

async function existingIds(database: Kysely<PurchaseDatabase>, query: RawBuilder<unknown>) {
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

function toPurchaseItem(row: PurchaseItemRow): PurchaseLineItem {
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

function formatAddress(row: PurchaseHeaderRow, kind: "billing" | "shipping") {
  const prefix = kind === "billing" ? "billing" : "shipping";
  const value = (name: string) => row[`${prefix}_${name}` as keyof PurchaseHeaderRow];
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
