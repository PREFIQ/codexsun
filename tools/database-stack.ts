import { spawn } from "node:child_process";

type StackDatabaseCommand =
  "fresh" | "migrate" | "migrations:run" | "migrations:test-local" | "seed";

const command = process.argv[2] as StackDatabaseCommand | undefined;
const supportedCommands = new Set<StackDatabaseCommand>([
  "fresh",
  "migrate",
  "migrations:run",
  "migrations:test-local",
  "seed"
]);

if (!command || !supportedCommands.has(command)) {
  throw new Error(
    `Database stack command must be one of: ${Array.from(supportedCommands).join(", ")}.`
  );
}

await runPlatformDatabaseCommand(command);
await bootstrapTenantApplicationDatabases();
console.info(`[database.stack] ${command} completed for Platform, Core, and Billing`);

function runPlatformDatabaseCommand(stackCommand: StackDatabaseCommand) {
  const workspaceScript =
    stackCommand === "fresh"
      ? "dbmigrate:fresh"
      : stackCommand === "migrations:run"
        ? "db:migrations:run"
        : stackCommand === "migrations:test-local"
          ? "db:migrations:test-local"
          : `db:${stackCommand}`;

  console.info(`[database.stack] Platform phase: ${workspaceScript}`);
  return new Promise<void>((resolve, reject) => {
    const executable = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npm";
    const args =
      process.platform === "win32"
        ? ["/d", "/s", "/c", "npm.cmd", "run", workspaceScript, "-w", "@codexsun/platform-api"]
        : ["run", workspaceScript, "-w", "@codexsun/platform-api"];
    const child = spawn(executable, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit"
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `Platform database phase failed${signal ? ` with signal ${signal}` : ` with exit code ${code ?? "unknown"}`}.`
        )
      );
    });
  });
}

async function bootstrapTenantApplicationDatabases() {
  console.info("[database.stack] Core phase: registered tenant databases");
  const core = await import("../apps/core/api/src/database/core-database.js");
  try {
    await core.bootstrapRegisteredCoreDatabases();
  } finally {
    await core.closeCoreDatabase();
  }

  console.info("[database.stack] Billing phase: registered tenant databases");
  const billing = await import("../apps/billing/api/src/database/billing-database.js");
  try {
    await billing.bootstrapRegisteredBillingDatabases();
  } finally {
    await billing.closeAllBillingDatabases();
  }
}
