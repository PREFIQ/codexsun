import { randomBytes } from "node:crypto";
import { sql, type Kysely, type Transaction } from "kysely";
import { getBillingDatabase } from "../../database/billing-database.js";
import type {
  Receipt,
  ReceiptAllocation,
  ReceiptAllocationCandidate,
  ReceiptContext,
  ReceiptSavePayload,
  ReceiptStatus
} from "./receipt.types.js";

type ReceiptDatabase = Record<string, never>;
type ReceiptTransaction = Transaction<ReceiptDatabase>;
type HeaderRow = {
  allocated_amount: string | number;
  amount: string | number;
  company_id: number;
  company_name: string;
  created_at: string;
  currency_code: string;
  currency_id: number;
  customer_id: number;
  customer_name: string;
  discount_amount: string | number;
  financial_year_id: number;
  financial_year_name: string;
  id: number;
  ledger_id: number;
  ledger_name: string;
  line_number: number;
  notes: string | null;
  receipt_date: string;
  receipt_mode: Receipt["receiptMode"];
  receipt_number: string;
  reference_date: string | null;
  reference_no: string | null;
  round_off: string | number;
  status: ReceiptStatus;
  tds_amount: string | number;
  total_amount: string | number;
  unallocated_amount: string | number;
  updated_at: string;
  uuid: string;
};

export class ReceiptRepository {
  async list(databaseName: string) {
    const database = await receiptDatabase(databaseName);
    const result = await selectHeaders().execute(database);
    return Promise.all(result.rows.map((row) => this.hydrate(database, row)));
  }

  async get(databaseName: string, uuid: string) {
    const database = await receiptDatabase(databaseName);
    const result = await selectHeaders(uuid).execute(database);
    const row = result.rows[0];
    return row ? this.hydrate(database, row) : null;
  }

  async context(
    databaseName: string
  ): Promise<Omit<ReceiptContext, "suggestedReceiptNumber"> | null> {
    const database = await receiptDatabase(databaseName);
    const result = await sql<{
      company_id: number;
      company_name: string;
      currency_code: string;
      currency_id: number;
      financial_year_id: number;
      financial_year_name: string;
    }>`
      SELECT d.company_id, c.name AS company_name, d.financial_year_id,
             f.name AS financial_year_name, currency.id AS currency_id,
             currency.name AS currency_code
      FROM default_company_settings d
      INNER JOIN companies c ON c.id = d.company_id AND c.status = 'active'
      INNER JOIN financial_years f ON f.id = d.financial_year_id AND f.status = 'active'
      INNER JOIN currencies currency ON UPPER(currency.name) = 'INR' AND currency.status = 'active'
      WHERE d.singleton_key = 1 AND d.status = 'active' LIMIT 1
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

  async findByNumber(
    databaseName: string,
    companyId: number,
    financialYearId: number,
    number: string,
    excludeUuid?: string
  ) {
    const database = await receiptDatabase(databaseName);
    const result = await sql<{ uuid: string }>`
      SELECT uuid FROM billing_receipts
      WHERE company_id = ${companyId} AND financial_year_id = ${financialYearId}
        AND receipt_number = ${number} AND deleted_at IS NULL
        ${excludeUuid ? sql`AND uuid <> ${excludeUuid}` : sql``}
      LIMIT 1
    `.execute(database);
    return result.rows[0] ?? null;
  }

  async validateReferences(databaseName: string, input: ReceiptSavePayload, excludeUuid?: string) {
    const database = await receiptDatabase(databaseName);
    const base = await sql<{
      company: number;
      currency: number;
      customer: number;
      financialYear: number;
      ledger: number;
    }>`
      SELECT
        EXISTS(SELECT 1 FROM companies WHERE id = ${input.companyId} AND status = 'active') AS company,
        EXISTS(SELECT 1 FROM financial_years WHERE id = ${input.financialYearId} AND status = 'active' AND ${input.receiptDate} BETWEEN start_date AND end_date) AS financialYear,
        EXISTS(SELECT 1 FROM currencies WHERE id = ${input.currencyId} AND status = 'active') AS currency,
        EXISTS(SELECT 1 FROM contacts WHERE id = ${input.customerId} AND status = 'active') AS customer,
        EXISTS(SELECT 1 FROM ledgers WHERE id = ${input.ledgerId} AND status = 'active') AS ledger
    `.execute(database);
    const allocations = await Promise.all(
      input.allocations.map(async (allocation) => {
        const result = await sql<{ customer_id: number; outstanding_amount: string | number }>`
        SELECT s.customer_id,
          GREATEST(s.amount - COALESCE(SUM(CASE WHEN r.status <> 'cancelled' ${excludeUuid ? sql`AND r.uuid <> ${excludeUuid}` : sql``} THEN a.allocated_amount ELSE 0 END), 0), 0) AS outstanding_amount
        FROM billing_sales s
        LEFT JOIN billing_receipt_allocations a ON a.sales_id = s.id
        LEFT JOIN billing_receipts r ON r.id = a.receipt_id AND r.deleted_at IS NULL
        WHERE s.uuid = ${allocation.saleId} AND s.status = 'confirmed' AND s.deleted_at IS NULL
        GROUP BY s.id, s.customer_id, s.amount
      `.execute(database);
        const row = result.rows[0];
        return Boolean(
          row &&
          row.customer_id === input.customerId &&
          Number(row.outstanding_amount) >= allocation.allocatedAmount
        );
      })
    );
    const row = base.rows[0];
    return {
      company: Boolean(row?.company),
      currency: Boolean(row?.currency),
      customer: Boolean(row?.customer),
      financialYear: Boolean(row?.financialYear),
      ledger: Boolean(row?.ledger),
      allocations: allocations.every(Boolean)
    };
  }

  async allocationCandidates(
    databaseName: string,
    customerId: number
  ): Promise<ReceiptAllocationCandidate[]> {
    const database = await receiptDatabase(databaseName);
    const result = await sql<{
      customer_id: number;
      document_date: string;
      document_no: string;
      document_total: string | number;
      outstanding_amount: string | number;
      sale_id: string;
    }>`
      SELECT s.uuid AS sale_id, s.customer_id, s.invoice_number AS document_no,
             s.issued_on AS document_date, s.amount AS document_total,
             GREATEST(s.amount - COALESCE(SUM(CASE WHEN r.status <> 'cancelled' THEN a.allocated_amount ELSE 0 END), 0), 0) AS outstanding_amount
      FROM billing_sales s
      LEFT JOIN billing_receipt_allocations a ON a.sales_id = s.id
      LEFT JOIN billing_receipts r ON r.id = a.receipt_id AND r.deleted_at IS NULL
      WHERE s.customer_id = ${customerId} AND s.status = 'confirmed' AND s.deleted_at IS NULL
      GROUP BY s.id, s.uuid, s.customer_id, s.invoice_number, s.issued_on, s.amount
      HAVING outstanding_amount > 0
      ORDER BY s.issued_on, s.line_number
    `.execute(database);
    return result.rows.map((row) => ({
      customerId: row.customer_id,
      documentDate: dateValue(row.document_date),
      documentNo: row.document_no,
      documentTotal: Number(row.document_total),
      outstandingAmount: Number(row.outstanding_amount),
      saleId: row.sale_id
    }));
  }

  async create(databaseName: string, input: ReceiptSavePayload & ReceiptTotals) {
    const database = await receiptDatabase(databaseName);
    const uuid = publicId();
    await database.transaction().execute(async (transaction) => {
      const lineResult = await sql<{ next_line: number }>`
        SELECT COALESCE(MAX(line_number), 0) + 1 AS next_line FROM billing_receipts
        WHERE company_id = ${input.companyId} AND financial_year_id = ${input.financialYearId}
      `.execute(transaction);
      const insert = await sql`
        INSERT INTO billing_receipts (
          uuid, company_id, financial_year_id, currency_id, line_number, receipt_number,
          receipt_date, customer_id, receipt_mode, ledger_id, reference_no, reference_date,
          amount, tds_amount, discount_amount, round_off, total_amount, allocated_amount,
          unallocated_amount, status, notes
        ) VALUES (
          ${uuid}, ${input.companyId}, ${input.financialYearId}, ${input.currencyId}, ${Number(lineResult.rows[0]?.next_line ?? 1)},
          ${input.receiptNumber}, ${input.receiptDate}, ${input.customerId}, ${input.receiptMode}, ${input.ledgerId},
          ${input.referenceNo || null}, ${input.referenceDate || null}, ${input.amount}, ${input.tdsAmount},
          ${input.discountAmount}, ${input.roundOff}, ${input.totalAmount}, ${input.allocatedAmount},
          ${input.unallocatedAmount}, 'draft', ${input.notes || null}
        )
      `.execute(transaction);
      const receiptId = Number(insert.insertId);
      await replaceAllocations(transaction, receiptId, input.allocations);
      await addActivity(transaction, receiptId, "created", "Receipt created.", null, "draft");
    });
    return this.get(databaseName, uuid);
  }

  async update(databaseName: string, uuid: string, input: ReceiptSavePayload & ReceiptTotals) {
    const database = await receiptDatabase(databaseName);
    const internal = await internalReceipt(database, uuid);
    if (!internal) return null;
    await database.transaction().execute(async (transaction) => {
      await sql`
        UPDATE billing_receipts SET company_id=${input.companyId}, financial_year_id=${input.financialYearId},
          currency_id=${input.currencyId}, receipt_number=${input.receiptNumber}, receipt_date=${input.receiptDate},
          customer_id=${input.customerId}, receipt_mode=${input.receiptMode}, ledger_id=${input.ledgerId},
          reference_no=${input.referenceNo || null}, reference_date=${input.referenceDate || null}, amount=${input.amount},
          tds_amount=${input.tdsAmount}, discount_amount=${input.discountAmount}, round_off=${input.roundOff},
          total_amount=${input.totalAmount}, allocated_amount=${input.allocatedAmount}, unallocated_amount=${input.unallocatedAmount},
          notes=${input.notes || null}
        WHERE id=${internal.id}
      `.execute(transaction);
      await sql`DELETE FROM billing_receipt_allocations WHERE receipt_id=${internal.id}`.execute(
        transaction
      );
      await replaceAllocations(transaction, internal.id, input.allocations);
      await addActivity(transaction, internal.id, "updated", "Receipt updated.", "draft", "draft");
    });
    return this.get(databaseName, uuid);
  }

  async setStatus(databaseName: string, uuid: string, status: ReceiptStatus) {
    const database = await receiptDatabase(databaseName);
    const current = await internalReceipt(database, uuid);
    if (!current) return null;
    await database.transaction().execute(async (transaction) => {
      await sql`
        UPDATE billing_receipts SET status=${status},
          posted_at=${status === "posted" ? sql`CURRENT_TIMESTAMP(3)` : sql`posted_at`},
          cancelled_at=${status === "cancelled" ? sql`CURRENT_TIMESTAMP(3)` : sql`cancelled_at`}
        WHERE id=${current.id}
      `.execute(transaction);
      await addActivity(
        transaction,
        current.id,
        status,
        `Receipt ${status}.`,
        current.status,
        status
      );
    });
    return this.get(databaseName, uuid);
  }

  async deleteDraft(databaseName: string, uuid: string) {
    const database = await receiptDatabase(databaseName);
    const current = await internalReceipt(database, uuid);
    if (!current) return null;
    await sql`UPDATE billing_receipts SET deleted_at=CURRENT_TIMESTAMP(3) WHERE id=${current.id}`.execute(
      database
    );
    return this.getIncludingDeleted(database, uuid);
  }

  private async getIncludingDeleted(database: Kysely<ReceiptDatabase>, uuid: string) {
    const result = await selectHeaders(uuid, true).execute(database);
    return result.rows[0] ? this.hydrate(database, result.rows[0]) : null;
  }

  private async hydrate(database: Kysely<ReceiptDatabase>, row: HeaderRow): Promise<Receipt> {
    const result = await sql<{
      allocated_amount: string | number;
      document_date: string;
      document_no: string;
      document_total: string | number;
      previous_balance: string | number;
      sale_id: string;
      uuid: string;
    }>`
      SELECT a.uuid, s.uuid AS sale_id, s.invoice_number AS document_no, s.issued_on AS document_date,
             s.amount AS document_total, s.amount AS previous_balance, a.allocated_amount
      FROM billing_receipt_allocations a INNER JOIN billing_sales s ON s.id=a.sales_id
      WHERE a.receipt_id=${row.id} ORDER BY a.line_number
    `.execute(database);
    const allocations: ReceiptAllocation[] = result.rows.map((item) => ({
      allocatedAmount: Number(item.allocated_amount),
      documentDate: dateValue(item.document_date),
      documentNo: item.document_no,
      documentTotal: Number(item.document_total),
      id: item.uuid,
      previousBalance: Number(item.previous_balance),
      saleId: item.sale_id
    }));
    return {
      allocatedAmount: Number(row.allocated_amount),
      allocations,
      amount: Number(row.amount),
      companyId: row.company_id,
      companyName: row.company_name,
      createdAt: isoValue(row.created_at),
      currencyCode: row.currency_code,
      currencyId: row.currency_id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      discountAmount: Number(row.discount_amount),
      financialYearId: row.financial_year_id,
      financialYearName: row.financial_year_name,
      id: row.uuid,
      ledgerId: row.ledger_id,
      ledgerName: row.ledger_name,
      lineNumber: row.line_number,
      notes: row.notes ?? "",
      receiptDate: dateValue(row.receipt_date),
      receiptMode: row.receipt_mode,
      receiptNumber: row.receipt_number,
      referenceDate: row.reference_date ? dateValue(row.reference_date) : "",
      referenceNo: row.reference_no ?? "",
      roundOff: Number(row.round_off),
      status: row.status,
      tdsAmount: Number(row.tds_amount),
      totalAmount: Number(row.total_amount),
      unallocatedAmount: Number(row.unallocated_amount),
      updatedAt: isoValue(row.updated_at)
    };
  }
}

type ReceiptTotals = { allocatedAmount: number; totalAmount: number; unallocatedAmount: number };

function selectHeaders(uuid?: string, includeDeleted = false) {
  return sql<HeaderRow>`
    SELECT r.*, c.name AS company_name, f.name AS financial_year_name, currency.name AS currency_code,
           customer.name AS customer_name, ledger.name AS ledger_name
    FROM billing_receipts r
    INNER JOIN companies c ON c.id=r.company_id
    INNER JOIN financial_years f ON f.id=r.financial_year_id
    INNER JOIN currencies currency ON currency.id=r.currency_id
    INNER JOIN contacts customer ON customer.id=r.customer_id
    INNER JOIN ledgers ledger ON ledger.id=r.ledger_id
    WHERE ${uuid ? sql`r.uuid=${uuid}` : sql`1=1`} ${includeDeleted ? sql`` : sql`AND r.deleted_at IS NULL`}
    ORDER BY r.receipt_date DESC, r.line_number DESC
  `;
}

async function replaceAllocations(
  transaction: ReceiptTransaction,
  receiptId: number,
  allocations: ReceiptSavePayload["allocations"]
) {
  for (const [index, allocation] of allocations.entries()) {
    await sql`
      INSERT INTO billing_receipt_allocations (uuid, receipt_id, sales_id, line_number, allocated_amount)
      SELECT ${publicId()}, ${receiptId}, id, ${index + 1}, ${allocation.allocatedAmount}
      FROM billing_sales WHERE uuid=${allocation.saleId}
    `.execute(transaction);
  }
}

async function addActivity(
  transaction: ReceiptTransaction,
  receiptId: number,
  action: string,
  description: string,
  previousStatus: string | null,
  newStatus: string | null
) {
  await sql`INSERT INTO billing_receipt_activities (uuid, receipt_id, action, description, previous_status, new_status)
    VALUES (${publicId()}, ${receiptId}, ${action}, ${description}, ${previousStatus}, ${newStatus})`.execute(
    transaction
  );
}

async function internalReceipt(database: Kysely<ReceiptDatabase>, uuid: string) {
  const result = await sql<{
    id: number;
    status: ReceiptStatus;
  }>`SELECT id, status FROM billing_receipts WHERE uuid=${uuid} AND deleted_at IS NULL LIMIT 1`.execute(
    database
  );
  return result.rows[0] ?? null;
}

function receiptDatabase(databaseName: string) {
  return getBillingDatabase(databaseName) as unknown as Promise<Kysely<ReceiptDatabase>>;
}
function publicId() {
  return randomBytes(4).toString("hex");
}
function dateValue(value: unknown) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}
function isoValue(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value);
}
