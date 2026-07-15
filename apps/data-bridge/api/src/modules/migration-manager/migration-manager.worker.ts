import { createDatabaseConnector } from "@codexsun/framework/db";
import type { DatabaseSettings } from "./migration-manager.types.js";
export async function processMigrationConnectionTest(config: DatabaseSettings) {
  const started = Date.now();
  const connection = await createDatabaseConnector({ ...config, driver: config.type }).connect({
    database: config.database
  });
  try {
    await connection.execute("SELECT 1");
    return {
      connected: true,
      position: `${config.host}:${config.port}/${config.database}`,
      responseMs: Date.now() - started
    };
  } finally {
    await connection.end();
  }
}
