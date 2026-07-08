import { closePlatformDatabase, createMasterDatabase, dropPlatformDatabases, migratePlatformDatabase, resetPlatformDatabases, seedPlatformDatabase } from "./platform-database.js";
import { seedDefaultTenant } from "./default-tenant-seed.js";
import { closeTenantDatabase, createTenantDatabase, getTenantDatabase, migrateTenantDatabase, seedTenantDatabase } from "./tenant-database.js";
import { TenantRepository } from "../modules/tenant/tenant.repository.js";

type DbCommand = "migrate" | "seed" | "drop" | "fresh";

const command = process.argv[2] as DbCommand | undefined;

async function main() {
  if (!command || !["migrate", "seed", "drop", "fresh"].includes(command)) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  try {
    console.info(`[database] db:${command} started`);
    if (command === "migrate") {
      await migrateAll();
    }

    if (command === "seed") {
      await seedAll();
    }

    if (command === "drop") {
      warnDestructive("Dropping master and tenant databases");
      await dropPlatformDatabases();
    }

    if (command === "fresh") {
      warnDestructive("Dropping and rebuilding master and tenant databases");
      await resetPlatformDatabases();
      await seedDefaultTenant();
    }

    console.log(`ok db:${command} completed`);
  } finally {
    await closePlatformDatabase();
  }
}

async function migrateAll() {
  console.info("[database] running master and tenant migrations");
  await createMasterDatabase();
  await migratePlatformDatabase();
  await migrateTenantDatabases();
}

async function seedAll() {
  console.info("[seeder] running master and tenant seeders");
  await createMasterDatabase();
  await migratePlatformDatabase();
  await seedPlatformDatabase();
  await seedDefaultTenant();
  await seedTenantDatabases();
}

async function migrateTenantDatabases() {
  const tenants = await new TenantRepository().list();
  console.info(`[database] tenant migration targets: ${tenants.length}`);
  for (const tenant of tenants) {
    console.info(`[database] migrating tenant "${tenant.tenantCode}" (${tenant.dbName})`);
    await createTenantDatabase(tenant.dbName);
    const database = getTenantDatabase(tenant);
    try {
      await migrateTenantDatabase(database);
    } finally {
      await closeTenantDatabase(tenant);
    }
  }
}

async function seedTenantDatabases() {
  const tenants = await new TenantRepository().list();
  console.info(`[seeder] tenant seed targets: ${tenants.length}`);
  for (const tenant of tenants) {
    console.info(`[seeder] seeding tenant "${tenant.tenantCode}" (${tenant.dbName})`);
    await createTenantDatabase(tenant.dbName);
    const database = getTenantDatabase(tenant);
    try {
      await migrateTenantDatabase(database);
      await seedTenantDatabase(database, tenant);
    } finally {
      await closeTenantDatabase(tenant);
    }
  }
}

function warnDestructive(message: string) {
  console.warn(`
DATABASE WARNING
${message}.

This deletes configured database data. Required guards:
  CODEXSUN_DB_RESET_CONFIRM=DROP_DATABASES
  CODEXSUN_ALLOW_PRODUCTION_DB_RESET=1 when NODE_ENV=production
`);
}

function printHelp() {
  console.log(`
CODEXSUN database CLI

Usage:
  tsx src/database/db-cli.ts migrate
  tsx src/database/db-cli.ts seed
  tsx src/database/db-cli.ts drop
  tsx src/database/db-cli.ts fresh

Root npm commands:
  npm run db:migrate
  npm run db:seed
  npm run db:drop
  npm run dbmigrate:fresh
`);
}

await main();
