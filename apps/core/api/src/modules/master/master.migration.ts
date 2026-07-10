import { sql, type Kysely } from "kysely";
import type { CoreDatabase } from "../../database/core-database.js";
import { masterDefinitions } from "./master.registry.js";
export const masterMigration = { key: "core.master" };
export async function migrateMasterModule(database: Kysely<CoreDatabase>) { for (const definition of masterDefinitions) await migrateMasterTable(database, definition.tableName); }
export async function migrateMasterTable(database: Kysely<CoreDatabase>, tableName: string) {
  await sql.raw(
    "CREATE TABLE IF NOT EXISTS " + tableName + " (" +
    "id VARCHAR(120) NOT NULL PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE, tenant_id VARCHAR(80) NOT NULL, code VARCHAR(80) NOT NULL, name VARCHAR(191) NOT NULL, legal_name VARCHAR(191) NULL," +
    "type_id VARCHAR(120) NULL, type_name VARCHAR(191) NULL, group_id VARCHAR(120) NULL, group_name VARCHAR(191) NULL, primary_phone VARCHAR(80) NULL, primary_email VARCHAR(191) NULL," +
    "gstin VARCHAR(40) NULL, pan VARCHAR(40) NULL, msme_no VARCHAR(80) NULL, msme_category VARCHAR(80) NULL, tan_no VARCHAR(80) NULL, tds_available TINYINT(1) NOT NULL DEFAULT 0, tcs_available TINYINT(1) NOT NULL DEFAULT 0," +
    "opening_balance DOUBLE NOT NULL DEFAULT 0, credit_limit DOUBLE NOT NULL DEFAULT 0, website VARCHAR(255) NULL, description TEXT NULL, logo_path VARCHAR(255) NULL, logo_dark_path VARCHAR(255) NULL, product_category_id VARCHAR(120) NULL, product_category_name VARCHAR(191) NULL," +
    "unit_id VARCHAR(120) NULL, unit_name VARCHAR(120) NULL, hsn_code_id VARCHAR(120) NULL, hsn_code VARCHAR(80) NULL, tax_id VARCHAR(120) NULL, tax_name VARCHAR(191) NULL, opening_stock DOUBLE NOT NULL DEFAULT 0, opening_rate DOUBLE NOT NULL DEFAULT 0," +
    "status VARCHAR(32) NOT NULL DEFAULT 'active', is_active TINYINT(1) NOT NULL DEFAULT 1, emails_json JSON NULL, phones_json JSON NULL, addresses_json JSON NULL, bank_accounts_json JSON NULL, social_links_json JSON NULL," +
    "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
    "UNIQUE KEY uq_" + tableName + "_tenant_code (tenant_id, code), INDEX idx_" + tableName + "_tenant_active (tenant_id, is_active, name))"
  ).execute(database);
  await migrateOpeningStockColumns(database, tableName);
  await migrateCompanyLogoColumns(database, tableName);
  await migrateChildTables(database, tableName);
}

async function migrateCompanyLogoColumns(database: Kysely<CoreDatabase>, tableName: string) {
  if (!await columnExists(database, tableName, "logo_path")) {
    await sql.raw(`ALTER TABLE ${tableName} ADD COLUMN logo_path VARCHAR(255) NULL AFTER description`).execute(database);
  }
  if (!await columnExists(database, tableName, "logo_dark_path")) {
    await sql.raw(`ALTER TABLE ${tableName} ADD COLUMN logo_dark_path VARCHAR(255) NULL AFTER logo_path`).execute(database);
  }
}

async function migrateOpeningStockColumns(database: Kysely<CoreDatabase>, tableName: string) {
  if (!await columnExists(database, tableName, "opening_stock")) {
    await sql.raw(`ALTER TABLE ${tableName} ADD COLUMN opening_stock DOUBLE NOT NULL DEFAULT 0 AFTER tax_name`).execute(database);
  }

  if (!await columnExists(database, tableName, "opening_rate")) {
    await sql.raw(`ALTER TABLE ${tableName} ADD COLUMN opening_rate DOUBLE NOT NULL DEFAULT 0 AFTER opening_stock`).execute(database);
    if (await columnExists(database, tableName, "rate")) {
      await sql.raw(`UPDATE ${tableName} SET opening_rate = rate`).execute(database);
    }
  }
}

async function columnExists(database: Kysely<CoreDatabase>, tableName: string, columnName: string) {
  const result = await sql<{ count: number }>`
    SELECT COUNT(*) AS count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${tableName}
      AND COLUMN_NAME = ${columnName}
  `.execute(database);
  return Number(result.rows[0]?.count ?? 0) > 0;
}

async function migrateChildTables(database: Kysely<CoreDatabase>, tableName: string) {
  await sql.raw(
    "CREATE TABLE IF NOT EXISTS " + tableName + "_emails (" +
    "id VARCHAR(120) NOT NULL PRIMARY KEY, parent_id VARCHAR(120) NOT NULL, email VARCHAR(191) NULL, email_type VARCHAR(80) NULL, is_primary TINYINT(1) NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 1, " +
    "INDEX idx_" + tableName + "_emails_parent (parent_id, sort_order))"
  ).execute(database);
  await sql.raw(
    "CREATE TABLE IF NOT EXISTS " + tableName + "_phones (" +
    "id VARCHAR(120) NOT NULL PRIMARY KEY, parent_id VARCHAR(120) NOT NULL, phone VARCHAR(80) NULL, phone_type VARCHAR(80) NULL, is_primary TINYINT(1) NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 1, " +
    "INDEX idx_" + tableName + "_phones_parent (parent_id, sort_order))"
  ).execute(database);
  await sql.raw(
    "CREATE TABLE IF NOT EXISTS " + tableName + "_addresses (" +
    "id VARCHAR(120) NOT NULL PRIMARY KEY, parent_id VARCHAR(120) NOT NULL, address_type_id VARCHAR(120) NULL, address_type_name VARCHAR(191) NULL, address_line1 VARCHAR(255) NULL, address_line2 VARCHAR(255) NULL, country_id VARCHAR(120) NULL, country_name VARCHAR(191) NULL, state_id VARCHAR(120) NULL, state_name VARCHAR(191) NULL, district_id VARCHAR(120) NULL, district_name VARCHAR(191) NULL, city_id VARCHAR(120) NULL, city_name VARCHAR(191) NULL, pincode_id VARCHAR(120) NULL, pincode_name VARCHAR(80) NULL, is_default TINYINT(1) NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 1, " +
    "INDEX idx_" + tableName + "_addresses_parent (parent_id, sort_order))"
  ).execute(database);
  await sql.raw(
    "CREATE TABLE IF NOT EXISTS " + tableName + "_bank_accounts (" +
    "id VARCHAR(120) NOT NULL PRIMARY KEY, parent_id VARCHAR(120) NOT NULL, bank_name_id VARCHAR(120) NULL, bank_name VARCHAR(191) NULL, account_type VARCHAR(80) NULL, account_number VARCHAR(120) NULL, holder_name VARCHAR(191) NULL, ifsc VARCHAR(40) NULL, branch VARCHAR(191) NULL, is_primary TINYINT(1) NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 1, " +
    "INDEX idx_" + tableName + "_bank_accounts_parent (parent_id, sort_order))"
  ).execute(database);
  await sql.raw(
    "CREATE TABLE IF NOT EXISTS " + tableName + "_social_links (" +
    "id VARCHAR(120) NOT NULL PRIMARY KEY, parent_id VARCHAR(120) NOT NULL, platform VARCHAR(80) NULL, url VARCHAR(255) NULL, is_active TINYINT(1) NOT NULL DEFAULT 1, sort_order INT NOT NULL DEFAULT 1, " +
    "INDEX idx_" + tableName + "_social_links_parent (parent_id, sort_order))"
  ).execute(database);
}
