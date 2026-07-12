import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { sql } from "kysely";

export const pincodeMigration = {
  description: "Pincode data owned by the Pincode module.",
  key: "core.common.location.pincode"
};

export function migratePincodeModule(database: Kysely<CoreDatabase>) {
  return sql
    .raw(
      `
    CREATE TABLE IF NOT EXISTS pincodes (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      city_id INT NOT NULL,
      name VARCHAR(200) NOT NULL,
      sort_order INT(11) NOT NULL DEFAULT 1000,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY pincodes_city_name_unique (city_id, name),
      INDEX pincodes_city_id_idx (city_id),
      CONSTRAINT pincodes_city_id_fk FOREIGN KEY (city_id) REFERENCES cities(id) ON UPDATE CASCADE ON DELETE RESTRICT
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `
    )
    .execute(database);
}
