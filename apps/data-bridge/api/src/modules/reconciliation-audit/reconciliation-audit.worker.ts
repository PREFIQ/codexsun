import { createHash } from "node:crypto";
import { createDatabaseConnector } from "@codexsun/framework/db";
import { AppError } from "@codexsun/framework/errors";
import type { ExecutionLedgerEntry, ExecutionRun } from "../execution-runs/index.js";
import { getMigrationJobSecrets } from "../migration-manager/index.js";
import type { ReconciliationTableEvidence } from "./reconciliation-audit.types.js";

export async function processReconciliation(
  run: ExecutionRun,
  ledger: ExecutionLedgerEntry[]
): Promise<ReconciliationTableEvidence[]> {
  const secrets = await getMigrationJobSecrets(run.migrationJobId);
  if (!secrets) throw AppError.notFound("Migration connection settings were not found.");
  const target = await createDatabaseConnector({
    driver: secrets.target.type,
    host: secrets.target.host,
    password: secrets.target.password,
    port: secrets.target.port,
    user: secrets.target.user
  }).connect({ database: secrets.target.database });
  try {
    const evidence: ReconciliationTableEvidence[] = [];
    for (const progress of run.tables) {
      const entries = ledger.filter((entry) => entry.targetTable === progress.targetTable);
      let verifiedRows = 0;
      let missingRows = 0;
      let mismatchedRows = 0;
      const targetHashes: string[] = [];
      for (const entry of entries.filter((item) => item.outcome !== "rejected")) {
        const fields = Object.keys(entry.mappedValues);
        const [rows] = await target.execute<Record<string, unknown>[]>(
          `SELECT ${fields.map(identifier).join(", ")} FROM ${identifier(entry.targetTable)} WHERE ${whereIdentity(entry.identityValues)} LIMIT 1`,
          Object.values(entry.identityValues)
        );
        const row = rows[0];
        if (!row) {
          missingRows += 1;
          continue;
        }
        const targetValues = Object.fromEntries(fields.map((field) => [field, row[field] ?? null]));
        const targetHash = hashValues(targetValues);
        targetHashes.push(targetHash);
        if (targetHash === entry.rowHash) verifiedRows += 1;
        else mismatchedRows += 1;
      }
      evidence.push({
        sourceTable: progress.sourceTable,
        targetTable: progress.targetTable,
        processedRows: entries.length,
        insertedRows: entries.filter((entry) => entry.outcome === "inserted").length,
        overriddenRows: entries.filter((entry) => entry.outcome === "overridden").length,
        rejectedRows: entries.filter((entry) => entry.outcome === "rejected").length,
        verifiedRows,
        missingRows,
        mismatchedRows,
        sourceHash: aggregateHash(
          entries.filter((entry) => entry.outcome !== "rejected").map((entry) => entry.rowHash)
        ),
        targetHash: aggregateHash(targetHashes)
      });
    }
    return evidence;
  } finally {
    await target.end();
  }
}

function identifier(value: string) {
  return `\`${value.replace(/`/g, "``")}\``;
}

function whereIdentity(identity: Record<string, unknown>) {
  return Object.keys(identity)
    .map((field) => `${identifier(field)}=?`)
    .join(" AND ");
}

function hashValues(values: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(values)).digest("hex");
}

function aggregateHash(hashes: string[]) {
  return createHash("sha256")
    .update([...hashes].sort().join(":"))
    .digest("hex");
}
