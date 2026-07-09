import { sql, type Kysely } from "kysely";
import type { CoreDatabase } from "../../database/core-database.js";

type Database = Kysely<CoreDatabase>;

export const entriesMigration = {
  key: "core.entries"
};

export async function migrateEntriesModule(database: Database) {
  await migrateSupportTables(database);
  await migrateEntryTables(database, "quotation");
  await migrateEntryTables(database, "sales");
}

async function migrateSupportTables(database: Database) {
  await sql.raw(`
    CREATE TABLE IF NOT EXISTS entry_contacts (
      id VARCHAR(120) NOT NULL PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      tenant_id VARCHAR(80) NOT NULL,
      code VARCHAR(80) NOT NULL,
      name VARCHAR(191) NOT NULL,
      legal_name VARCHAR(191) NULL,
      gstin VARCHAR(40) NULL,
      email VARCHAR(191) NULL,
      phone VARCHAR(80) NULL,
      address_line1 VARCHAR(255) NULL,
      address_line2 VARCHAR(255) NULL,
      country_id VARCHAR(120) NULL,
      country_name VARCHAR(191) NULL,
      state_id VARCHAR(120) NULL,
      state_name VARCHAR(191) NULL,
      district_id VARCHAR(120) NULL,
      district_name VARCHAR(191) NULL,
      city_id VARCHAR(120) NULL,
      city_name VARCHAR(191) NULL,
      pincode_id VARCHAR(120) NULL,
      pincode_name VARCHAR(40) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_entry_contacts_tenant_code (tenant_id, code),
      UNIQUE KEY uq_entry_contacts_tenant_name (tenant_id, name),
      INDEX idx_entry_contacts_tenant_active (tenant_id, is_active, name)
    )
  `).execute(database);

  await sql.raw(`
    CREATE TABLE IF NOT EXISTS entry_products (
      id VARCHAR(120) NOT NULL PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      tenant_id VARCHAR(80) NOT NULL,
      code VARCHAR(80) NOT NULL,
      name VARCHAR(191) NOT NULL,
      product_type_id VARCHAR(120) NULL,
      product_type_name VARCHAR(191) NULL,
      hsn_code_id VARCHAR(120) NULL,
      hsn_code VARCHAR(80) NULL,
      unit_id VARCHAR(120) NULL,
      unit_name VARCHAR(120) NULL,
      tax_id VARCHAR(120) NULL,
      tax_description VARCHAR(191) NULL,
      tax_rate DOUBLE NOT NULL DEFAULT 0,
      price DOUBLE NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_entry_products_tenant_code (tenant_id, code),
      UNIQUE KEY uq_entry_products_tenant_name (tenant_id, name),
      INDEX idx_entry_products_tenant_active (tenant_id, is_active, name)
    )
  `).execute(database);
}

async function migrateEntryTables(database: Database, kind: "quotation" | "sales") {
  const headerTable = `${kind}_entries`;
  const itemTable = `${kind}_entry_items`;
  const commentTable = `${kind}_entry_comments`;
  const activityTable = `${kind}_entry_activities`;

  await sql.raw(`
    CREATE TABLE IF NOT EXISTS ${headerTable} (
      id VARCHAR(120) NOT NULL PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      tenant_id VARCHAR(80) NOT NULL,
      document_no VARCHAR(80) NOT NULL,
      document_date DATE NOT NULL,
      customer_id VARCHAR(120) NULL,
      customer_name VARCHAR(191) NOT NULL,
      customer_gstin VARCHAR(40) NULL,
      customer_state_code VARCHAR(40) NULL,
      customer_state_name VARCHAR(120) NULL,
      billing_address TEXT NULL,
      shipping_address TEXT NULL,
      place_of_supply VARCHAR(32) NOT NULL DEFAULT 'cgst-sgst',
      reference_no VARCHAR(120) NULL,
      due_date DATE NULL,
      work_order_no VARCHAR(120) NULL,
      payment_term_id VARCHAR(120) NULL,
      payment_term_name VARCHAR(191) NULL,
      sales_type_id VARCHAR(120) NULL,
      sales_type_name VARCHAR(191) NULL,
      subtotal DOUBLE NOT NULL DEFAULT 0,
      discount_total DOUBLE NOT NULL DEFAULT 0,
      taxable_total DOUBLE NOT NULL DEFAULT 0,
      tax_total DOUBLE NOT NULL DEFAULT 0,
      round_off DOUBLE NOT NULL DEFAULT 0,
      grand_total DOUBLE NOT NULL DEFAULT 0,
      paid_amount DOUBLE NOT NULL DEFAULT 0,
      balance_amount DOUBLE NOT NULL DEFAULT 0,
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
      irn VARCHAR(120) NULL,
      ack_no VARCHAR(120) NULL,
      ack_date DATE NULL,
      signed_qr TEXT NULL,
      eway_bill_no VARCHAR(120) NULL,
      eway_bill_date DATE NULL,
      transport_id VARCHAR(120) NULL,
      transport_name VARCHAR(191) NULL,
      transport_gst VARCHAR(40) NULL,
      transport_address TEXT NULL,
      transport_contact_no VARCHAR(80) NULL,
      transport_contact_person VARCHAR(120) NULL,
      vehicle_no VARCHAR(80) NULL,
      eway_part VARCHAR(20) NULL,
      notes TEXT NULL,
      terms TEXT NULL,
      source_type VARCHAR(80) NULL,
      source_ref_no VARCHAR(255) NULL,
      source_quotation_uuids JSON NULL,
      source_quotation_nos JSON NULL,
      generated_sales_entry_id VARCHAR(120) NULL,
      generated_sales_document_no VARCHAR(80) NULL,
      generated_sales_at DATETIME NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_${headerTable}_tenant_no (tenant_id, document_no),
      INDEX idx_${headerTable}_tenant_date (tenant_id, document_date, id),
      INDEX idx_${headerTable}_tenant_status (tenant_id, status, is_active)
    )
  `).execute(database);

  await sql.raw(`
    CREATE TABLE IF NOT EXISTS ${itemTable} (
      id VARCHAR(120) NOT NULL PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      ${kind}_entry_id VARCHAR(120) NOT NULL,
      product_id VARCHAR(120) NULL,
      product_name VARCHAR(191) NOT NULL,
      description TEXT NULL,
      colour_id VARCHAR(120) NULL,
      colour_name VARCHAR(120) NULL,
      hsn_code_id VARCHAR(120) NULL,
      hsn_code VARCHAR(80) NULL,
      po_no VARCHAR(120) NULL,
      dc_no VARCHAR(120) NULL,
      size_id VARCHAR(120) NULL,
      size_name VARCHAR(120) NULL,
      unit_id VARCHAR(120) NULL,
      unit_name VARCHAR(80) NULL,
      quantity DOUBLE NOT NULL DEFAULT 0,
      rate DOUBLE NOT NULL DEFAULT 0,
      discount_amount DOUBLE NOT NULL DEFAULT 0,
      tax_id VARCHAR(120) NULL,
      tax_description VARCHAR(191) NULL,
      tax_rate DOUBLE NOT NULL DEFAULT 0,
      tax_amount DOUBLE NOT NULL DEFAULT 0,
      line_total DOUBLE NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_${itemTable}_parent (${kind}_entry_id, sort_order)
    )
  `).execute(database);

  await sql.raw(`
    CREATE TABLE IF NOT EXISTS ${commentTable} (
      id VARCHAR(120) NOT NULL PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      ${kind}_entry_id VARCHAR(120) NOT NULL,
      author_email VARCHAR(191) NOT NULL,
      body TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_${commentTable}_parent (${kind}_entry_id, created_at)
    )
  `).execute(database);

  await sql.raw(`
    CREATE TABLE IF NOT EXISTS ${activityTable} (
      id VARCHAR(120) NOT NULL PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      ${kind}_entry_id VARCHAR(120) NOT NULL,
      activity_type VARCHAR(80) NOT NULL,
      actor_email VARCHAR(191) NOT NULL,
      message VARCHAR(255) NOT NULL,
      payload JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_${activityTable}_parent (${kind}_entry_id, created_at)
    )
  `).execute(database);
}
