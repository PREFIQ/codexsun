import { sql, type Kysely } from "kysely";

export async function migrateVouchersModule(db: Kysely<any>) {
  await db.schema
    .createTable("account_vouchers")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(8)", (col) => col.notNull().unique())
    .addColumn("voucher_no", "varchar(80)", (col) => col.notNull().unique())
    .addColumn("voucher_date", "date", (col) => col.notNull())
    .addColumn("voucher_type", "varchar(40)", (col) => col.notNull())
    .addColumn("status", "varchar(24)", (col) => col.notNull())
    .addColumn("narration", "text")
    .addColumn("source_app", "varchar(80)")
    .addColumn("source_module", "varchar(80)")
    .addColumn("source_document_id", "varchar(120)")
    .addColumn("source_document_no", "varchar(120)")
    .addColumn("source_operation", "varchar(24)")
    .addColumn("posting_version", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("total_debit", "double precision", (col) => col.notNull().defaultTo(0))
    .addColumn("total_credit", "double precision", (col) => col.notNull().defaultTo(0))
    .addColumn("tally_sync_status", "varchar(24)", (col) => col.notNull().defaultTo("pending"))
    .addColumn("tally_external_id", "varchar(180)")
    .addColumn("tally_error", "text")
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createTable("account_voucher_lines")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(8)", (col) => col.notNull().unique())
    .addColumn("voucher_id", "integer", (col) => col.notNull())
    .addColumn("ledger_id", "integer", (col) => col.notNull())
    .addColumn("dc", "varchar(12)", (col) => col.notNull())
    .addColumn("amount", "double precision", (col) => col.notNull())
    .addColumn("narration", "text")
    .addColumn("sort_order", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("status", "varchar(24)", (col) => col.notNull().defaultTo("posted"))
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema.createIndex("account_vouchers_source_idx").ifNotExists().on("account_vouchers").columns(["source_app", "source_module", "source_document_id"]).execute();
  await db.schema.createIndex("account_voucher_lines_voucher_idx").ifNotExists().on("account_voucher_lines").column("voucher_id").execute();
  await db.schema.createIndex("account_voucher_lines_ledger_idx").ifNotExists().on("account_voucher_lines").column("ledger_id").execute();

  await db.schema
    .createTable("account_period_locks")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(8)", (col) => col.notNull().unique())
    .addColumn("name", "varchar(120)", (col) => col.notNull())
    .addColumn("from_date", "date", (col) => col.notNull())
    .addColumn("to_date", "date", (col) => col.notNull())
    .addColumn("lock_type", "varchar(40)", (col) => col.notNull().defaultTo("financial-period"))
    .addColumn("status", "varchar(24)", (col) => col.notNull().defaultTo("active"))
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();
}
