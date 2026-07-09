import { sql, type Kysely } from "kysely";

export async function migrateLedgersModule(db: Kysely<any>) {
  await db.schema
    .createTable("account_groups")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(8)", (col) => col.notNull().unique())
    .addColumn("code", "varchar(80)", (col) => col.notNull().unique())
    .addColumn("name", "varchar(180)", (col) => col.notNull().unique())
    .addColumn("nature", "varchar(32)", (col) => col.notNull())
    .addColumn("parent_id", "integer")
    .addColumn("is_system", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("status", "varchar(24)", (col) => col.notNull().defaultTo("active"))
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createTable("account_ledgers")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(8)", (col) => col.notNull().unique())
    .addColumn("code", "varchar(80)", (col) => col.notNull().unique())
    .addColumn("name", "varchar(180)", (col) => col.notNull().unique())
    .addColumn("group_id", "integer", (col) => col.notNull())
    .addColumn("classification", "varchar(40)", (col) => col.notNull())
    .addColumn("opening_balance", "double precision", (col) => col.notNull().defaultTo(0))
    .addColumn("current_debit", "double precision", (col) => col.notNull().defaultTo(0))
    .addColumn("current_credit", "double precision", (col) => col.notNull().defaultTo(0))
    .addColumn("closing_balance", "double precision", (col) => col.notNull().defaultTo(0))
    .addColumn("tally_ledger_name", "varchar(180)")
    .addColumn("is_system", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("status", "varchar(24)", (col) => col.notNull().defaultTo("active"))
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();
}
