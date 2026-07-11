import mysql, { type Pool } from "mysql2/promise";
import { env } from "../env.js";
const pools = new Map<string, Pool>();
const migrated = new Set<string>();
export function resolveKitchenServeDatabaseName(value: unknown) {
  const name = typeof value === "string" && value.trim() ? value.trim() : env.DB_MASTER_NAME;
  if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error("Invalid tenant database name.");
  return name;
}
export async function getKitchenServePool(name: string) {
  const database = resolveKitchenServeDatabaseName(name);
  let pool = pools.get(database);
  if (!pool) {
    pool = mysql.createPool({
      database,
      host: env.DB_HOST,
      password: env.DB_PASSWORD,
      port: env.DB_PORT,
      timezone: "Z",
      user: env.DB_USER
    });
    pools.set(database, pool);
  }
  if (!migrated.has(database)) {
    await migrate(pool);
    migrated.add(database);
  }
  return pool;
}
export async function closeKitchenServeDatabases() {
  await Promise.all([...pools.values()].map((pool) => pool.end()));
  pools.clear();
  migrated.clear();
}
async function migrate(pool: Pool) {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS kitchen_serve_orders (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(36) NOT NULL UNIQUE, tenant_id VARCHAR(64) NOT NULL, table_label VARCHAR(120) NOT NULL, guest_name VARCHAR(160) NULL, waiter_name VARCHAR(160) NOT NULL, status VARCHAR(32) NOT NULL, notes TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_ks_orders_tenant_status (tenant_id,status))`
  );
  await pool.query(
    `CREATE TABLE IF NOT EXISTS kitchen_serve_order_items (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_id BIGINT UNSIGNED NOT NULL, item_name VARCHAR(180) NOT NULL, quantity DECIMAL(12,3) NOT NULL, unit_price DECIMAL(14,2) NOT NULL, notes VARCHAR(500) NULL, kitchen_station VARCHAR(120) NOT NULL, status VARCHAR(32) NOT NULL, CONSTRAINT fk_ks_item_order FOREIGN KEY (order_id) REFERENCES kitchen_serve_orders(id) ON DELETE CASCADE, INDEX idx_ks_items_order (order_id))`
  );
  await pool.query(
    `CREATE TABLE IF NOT EXISTS kitchen_serve_tickets (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(36) NOT NULL UNIQUE, order_id BIGINT UNSIGNED NOT NULL, station VARCHAR(120) NOT NULL, status VARCHAR(32) NOT NULL, submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ready_at DATETIME NULL, CONSTRAINT fk_ks_ticket_order FOREIGN KEY (order_id) REFERENCES kitchen_serve_orders(id) ON DELETE CASCADE, INDEX idx_ks_ticket_order (order_id))`
  );
}
