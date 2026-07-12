import { sql, type Kysely } from "kysely";
import type { CoreDatabase } from "../../../database/core-database.js";
export async function migrateContactModule(database: Kysely<CoreDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS contacts (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
    code VARCHAR(80) NOT NULL, name VARCHAR(191) NOT NULL,
    legal_name VARCHAR(191) NULL, type_id INT NULL, type_name VARCHAR(191) NULL, group_id INT NULL,
    group_name VARCHAR(191) NULL, primary_phone VARCHAR(80) NULL, primary_email VARCHAR(191) NULL,
    gstin VARCHAR(40) NULL, pan VARCHAR(40) NULL, msme_no VARCHAR(80) NULL, msme_category VARCHAR(80) NULL,
    tan_no VARCHAR(80) NULL, tds_available TINYINT(1) NOT NULL DEFAULT 0,
    tcs_available TINYINT(1) NOT NULL DEFAULT 0, opening_balance DOUBLE NOT NULL DEFAULT 0,
    credit_limit DOUBLE NOT NULL DEFAULT 0, website VARCHAR(255) NULL, description TEXT NULL,
    logo_path VARCHAR(255) NULL, logo_dark_path VARCHAR(255) NULL, industry_id INT NULL,
    industry_name VARCHAR(191) NULL, product_category_id INT NULL, product_category_name VARCHAR(191) NULL,
    unit_id INT NULL, unit_name VARCHAR(120) NULL, hsn_code_id INT NULL, hsn_code VARCHAR(80) NULL,
    tax_id INT NULL, tax_name VARCHAR(191) NULL, opening_stock DOUBLE NOT NULL DEFAULT 0,
    opening_rate DOUBLE NOT NULL DEFAULT 0, status VARCHAR(24) NOT NULL DEFAULT 'active',
    emails_json JSON NULL, phones_json JSON NULL, addresses_json JSON NULL,
    bank_accounts_json JSON NULL, social_links_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL, UNIQUE KEY contacts_code_unique (code),
    INDEX contacts_status_name (status, name)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await removeLegacyTenantColumn(database);
  await child(
    database,
    "emails",
    "email VARCHAR(191) NULL, email_type VARCHAR(80) NULL, is_primary TINYINT(1) NOT NULL DEFAULT 0"
  );
  await child(
    database,
    "phones",
    "phone VARCHAR(80) NULL, phone_type VARCHAR(80) NULL, is_primary TINYINT(1) NOT NULL DEFAULT 0"
  );
  await child(
    database,
    "addresses",
    "address_type_id INT NULL, address_type_name VARCHAR(191) NULL, address_line1 VARCHAR(255) NULL, address_line2 VARCHAR(255) NULL, country_id INT NULL, country_name VARCHAR(191) NULL, state_id INT NULL, state_name VARCHAR(191) NULL, district_id INT NULL, district_name VARCHAR(191) NULL, city_id INT NULL, city_name VARCHAR(191) NULL, pincode_id INT NULL, pincode_name VARCHAR(80) NULL, is_default TINYINT(1) NOT NULL DEFAULT 0"
  );
  await child(
    database,
    "bank_accounts",
    "bank_name_id INT NULL, bank_name VARCHAR(191) NULL, account_type VARCHAR(80) NULL, account_number VARCHAR(120) NULL, holder_name VARCHAR(191) NULL, ifsc VARCHAR(40) NULL, branch VARCHAR(191) NULL, is_primary TINYINT(1) NOT NULL DEFAULT 0"
  );
  await child(
    database,
    "social_links",
    "platform VARCHAR(80) NULL, url VARCHAR(255) NULL, status VARCHAR(24) NOT NULL DEFAULT 'active'"
  );
}
async function removeLegacyTenantColumn(database: Kysely<CoreDatabase>) {
  for (const indexName of [
    "contacts_tenant_code",
    "contacts_tenant_status",
    "uq_contacts_tenant_code",
    "idx_contacts_tenant_status"
  ]) {
    const result = await sql<{
      count: number | string;
    }>`SELECT COUNT(*) AS count FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='contacts' AND INDEX_NAME=${indexName}`.execute(
      database
    );
    if (Number(result.rows[0]?.count ?? 0) > 0)
      await sql.raw(`ALTER TABLE contacts DROP INDEX \`${indexName}\``).execute(database);
  }
  const result = await sql<{
    count: number | string;
  }>`SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='contacts' AND COLUMN_NAME='tenant_id'`.execute(
    database
  );
  if (Number(result.rows[0]?.count ?? 0) > 0)
    await sql.raw("ALTER TABLE contacts DROP COLUMN tenant_id").execute(database);
}

async function child(database: Kysely<CoreDatabase>, suffix: string, columns: string) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS contacts_${suffix} (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, parent_id INT NOT NULL, ${columns}, sort_order INT NOT NULL DEFAULT 1, INDEX contacts_${suffix}_parent (parent_id, sort_order))`
    )
    .execute(database);
}
