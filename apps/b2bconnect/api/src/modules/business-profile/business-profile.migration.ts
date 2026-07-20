import type { B2bConnectDatabase } from "../../database.js";

export function migrateBusinessProfileModule(database: B2bConnectDatabase) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS b2b_business_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE CHECK(length(uuid) = 8),
      owner_email TEXT NOT NULL UNIQUE,
      business_name TEXT NOT NULL,
      industry_segment TEXT NOT NULL,
      description TEXT NOT NULL,
      products_services TEXT NOT NULL,
      capacity_note TEXT NOT NULL,
      capabilities_json TEXT NOT NULL,
      association TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      whatsapp_enabled INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending',
      review_note TEXT NOT NULL DEFAULT '',
      published_at TEXT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_b2b_business_profiles_status
      ON b2b_business_profiles(status, updated_at DESC);
    CREATE TABLE IF NOT EXISTS b2b_business_profile_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_uuid TEXT NOT NULL,
      reviewer_email TEXT NOT NULL,
      decision TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(profile_uuid) REFERENCES b2b_business_profiles(uuid)
    );
    CREATE TABLE IF NOT EXISTS b2b_business_profile_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_uuid TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(profile_uuid) REFERENCES b2b_business_profiles(uuid)
    );
  `);
}
