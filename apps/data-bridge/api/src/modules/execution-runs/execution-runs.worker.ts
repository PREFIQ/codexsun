import { createHash } from "node:crypto";
import { createDatabaseConnector, type CompatibleDbConnection } from "@codexsun/framework/db";
import { AppError } from "@codexsun/framework/errors";
import { getMigrationJobSecrets } from "../migration-manager/index.js";
import { verifyApprovedReview } from "../review-approvals/index.js";
import { ExecutionRunsRepository } from "./execution-runs.repository.js";
import type {
  ExecutionLedgerEntry,
  ExecutionTableProgress,
  StoredExecutionConflict,
  StoredExecutionRun
} from "./execution-runs.types.js";

const repository = new ExecutionRunsRepository();

export function queueExecutionRun(id: number) {
  setTimeout(() => void processExecutionRun(id), 0);
}

export async function processExecutionRun(id: number) {
  let source: CompatibleDbConnection | null = null;
  let target: CompatibleDbConnection | null = null;
  try {
    let run = await requiredRun(id);
    const { review, transform } = await verifyApprovedReview(run.reviewId);
    if (review.checksum !== run.checksum)
      throw AppError.conflict("Execution checksum no longer matches its approved review.");
    const secrets = await getMigrationJobSecrets(run.migrationJobId);
    if (!secrets) throw AppError.notFound("Migration connection settings were not found.");
    source = await createDatabaseConnector(toConnector(secrets.source)).connect({
      database: secrets.source.database
    });
    target = await createDatabaseConnector(toConnector(secrets.target)).connect({
      database: secrets.target.database
    });
    run = (await repository.updateStored(id, {
      status: "running",
      startedAt: run.startedAt ?? new Date().toISOString(),
      error: null
    }))!;

    for (let tableIndex = 0; tableIndex < transform.tables.length; tableIndex += 1) {
      run = await requiredRun(id);
      if (run.status === "paused" || run.status === "cancelled") return;
      const table = transform.tables[tableIndex]!;
      const evidence = review.tables.find((item) => item.targetTable === table.targetTable);
      if (!evidence || !evidence.identityFields.length)
        throw AppError.conflict(`Table ${table.targetTable} has no approved identity mapping.`);
      let progress = run.tables[tableIndex];
      if (!progress) throw AppError.internal("Execution table progress is missing.");
      if (progress.status === "completed") continue;

      const conflictResult = await applyConflictDecisions(run, progress, table, target);
      run = conflictResult.run;
      progress = conflictResult.progress;
      if (
        run.conflicts.some((item) => item.table === table.targetTable && item.status === "pending")
      ) {
        await blockTable(run, tableIndex, "Waiting for conflict decisions.");
        return;
      }

      await repository.updateStored(id, {
        currentTable: table.targetTable,
        tables: replaceTable(run.tables, tableIndex, {
          ...progress,
          status: "running",
          error: null
        })
      });

      while (progress.checkpoint < progress.totalRows) {
        run = await requiredRun(id);
        if (run.status === "paused" || run.status === "cancelled") return;
        const batch = await readBatch(
          source,
          table.sourceQuery,
          run.batchSize,
          progress.checkpoint
        );
        if (!batch.length) break;
        for (const sourceRow of batch) {
          run = await requiredRun(id);
          if (run.status === "paused" || run.status === "cancelled") return;
          progress = requiredProgress(run.tables[tableIndex]);
          const mappedValues = Object.fromEntries(
            table.fields.map((field) => [field.targetField, sourceRow[field.sourceField] ?? null])
          );
          const identityValues = Object.fromEntries(
            evidence.identityFields.map((field) => [field, mappedValues[field]])
          );
          if (Object.values(identityValues).some((value) => value === null || value === undefined))
            throw AppError.validation(
              `Table ${table.targetTable} produced an empty approved identity value at row ${progress.checkpoint + 1}.`
            );
          const sourceRef = recordReference("SRC", table.sourceTable, identityValues);
          const targetRef = recordReference("TGT", table.targetTable, identityValues);
          const existing = await targetExists(target, table.targetTable, identityValues);
          if (existing) {
            const conflict = createConflict(
              table.targetTable,
              sourceRef,
              targetRef,
              sourceRow,
              mappedValues,
              identityValues
            );
            const conflicts = [...run.conflicts, conflict];
            await repository.updateStored(id, {
              status: "blocked",
              conflicts,
              tables: replaceTable(run.tables, tableIndex, {
                ...progress,
                status: "blocked",
                conflictCount: progress.conflictCount + 1,
                error: "An existing Target record requires an Override or Reject decision."
              }),
              audit: [...run.audit, audit("conflict-detected", "system", conflict.id)]
            });
            return;
          }
          await target.execute(
            table.targetQuery,
            table.fields.map((field) => mappedValues[field.targetField])
          );
          const ledgerEntry = ledger(
            table.sourceTable,
            table.targetTable,
            sourceRef,
            targetRef,
            "inserted",
            mappedValues,
            identityValues
          );
          progress = {
            ...progress,
            checkpoint: progress.checkpoint + 1,
            insertedRows: progress.insertedRows + 1
          };
          run = (await repository.updateStored(id, {
            tables: replaceTable(run.tables, tableIndex, progress),
            ledger: [...run.ledger, ledgerEntry]
          }))!;
        }
        await delay(15);
      }
      run = await requiredRun(id);
      progress = requiredProgress(run.tables[tableIndex]);
      await repository.updateStored(id, {
        tables: replaceTable(run.tables, tableIndex, {
          ...progress,
          status: "completed",
          error: null
        })
      });
    }
    run = await requiredRun(id);
    await repository.updateStored(id, {
      status: "completed",
      currentTable: null,
      finishedAt: new Date().toISOString(),
      audit: [...run.audit, audit("completed", "system")]
    });
  } catch (error) {
    const run = await repository.getStored(id);
    if (run && run.status !== "cancelled")
      await repository.updateStored(id, {
        status: "failed",
        error: error instanceof Error ? error.message : "Execution failed.",
        finishedAt: new Date().toISOString(),
        audit: [
          ...run.audit,
          audit("failed", "system", error instanceof Error ? error.message : "Unknown error")
        ]
      });
  } finally {
    await Promise.allSettled([source?.end(), target?.end()].filter(Boolean) as Promise<void>[]);
  }
}

async function applyConflictDecisions(
  run: StoredExecutionRun,
  progress: ExecutionTableProgress,
  table: { sourceTable: string; targetTable: string; fields: Array<{ targetField: string }> },
  target: CompatibleDbConnection
) {
  let currentRun = run;
  let currentProgress = progress;
  for (const conflict of currentRun.conflicts.filter(
    (item) => item.table === table.targetTable && item.status === "decided"
  )) {
    if (!conflict.decision) continue;
    if (conflict.decision.action === "override") {
      const updateFields = table.fields
        .map((field) => field.targetField)
        .filter((field) => !(field in conflict.identityValues));
      if (updateFields.length) {
        await target.execute(
          `UPDATE ${identifier(table.targetTable)} SET ${updateFields.map((field) => `${identifier(field)}=?`).join(", ")} WHERE ${whereIdentity(conflict.identityValues)}`,
          [
            ...updateFields.map((field) => conflict.mappedValues[field]),
            ...Object.values(conflict.identityValues)
          ]
        );
      }
      currentProgress = {
        ...currentProgress,
        checkpoint: currentProgress.checkpoint + 1,
        overriddenRows: currentProgress.overriddenRows + 1
      };
    } else {
      currentProgress = {
        ...currentProgress,
        checkpoint: currentProgress.checkpoint + 1,
        rejectedRows: currentProgress.rejectedRows + 1
      };
    }
    const entry = ledger(
      table.sourceTable,
      table.targetTable,
      conflict.sourceRecordRef,
      conflict.targetRecordRef,
      conflict.decision.action === "override" ? "overridden" : "rejected",
      conflict.mappedValues,
      conflict.identityValues
    );
    const conflicts = currentRun.conflicts.map((item) =>
      item.id === conflict.id ? { ...item, status: "applied" as const } : item
    );
    currentRun = (await repository.updateStored(currentRun.id, {
      conflicts,
      tables: replaceTable(
        currentRun.tables,
        currentRun.tables.findIndex((item) => item.targetTable === table.targetTable),
        currentProgress
      ),
      ledger: [...currentRun.ledger, entry],
      audit: [
        ...currentRun.audit,
        audit("conflict-decision-applied", conflict.decision.actor, conflict.id)
      ]
    }))!;
  }
  return { run: currentRun, progress: currentProgress };
}

async function readBatch(
  connection: CompatibleDbConnection,
  sourceQuery: string,
  limit: number,
  offset: number
) {
  const sql = sourceQuery.trim().replace(/;$/, "");
  const [rows] = await connection.execute<Record<string, unknown>[]>(`${sql} LIMIT ? OFFSET ?`, [
    limit,
    offset
  ]);
  return rows;
}

async function targetExists(
  connection: CompatibleDbConnection,
  table: string,
  identity: Record<string, unknown>
) {
  const [rows] = await connection.execute<Record<string, unknown>[]>(
    `SELECT 1 AS found FROM ${identifier(table)} WHERE ${whereIdentity(identity)} LIMIT 1`,
    Object.values(identity)
  );
  return rows.length > 0;
}

async function blockTable(run: StoredExecutionRun, tableIndex: number, message: string) {
  const progress = requiredProgress(run.tables[tableIndex]);
  await repository.updateStored(run.id, {
    status: "blocked",
    tables: replaceTable(run.tables, tableIndex, { ...progress, status: "blocked", error: message })
  });
}

function requiredProgress(progress: ExecutionTableProgress | undefined) {
  if (!progress) throw AppError.internal("Execution table progress is missing.");
  return progress;
}

function createConflict(
  table: string,
  sourceRecordRef: string,
  targetRecordRef: string,
  sourceValues: Record<string, unknown>,
  mappedValues: Record<string, unknown>,
  identityValues: Record<string, unknown>
): StoredExecutionConflict {
  const detectedAt = new Date().toISOString();
  return {
    id: `CF-${createHash("sha256").update(`${table}:${sourceRecordRef}:${detectedAt}`).digest("hex").slice(0, 12)}`,
    table,
    sourceRecordRef,
    targetRecordRef,
    status: "pending",
    decision: null,
    detectedAt,
    sourceValues,
    mappedValues,
    identityValues,
    rowHash: hashValues(mappedValues)
  };
}

function ledger(
  table: string,
  targetTable: string,
  sourceRecordRef: string,
  targetRecordRef: string,
  outcome: ExecutionLedgerEntry["outcome"],
  mappedValues: Record<string, unknown>,
  identityValues: Record<string, unknown>
): ExecutionLedgerEntry {
  return {
    table,
    targetTable,
    sourceRecordRef,
    targetRecordRef,
    outcome,
    rowHash: hashValues(mappedValues),
    identityValues,
    mappedValues,
    processedAt: new Date().toISOString()
  };
}

function recordReference(prefix: string, table: string, values: Record<string, unknown>) {
  return `${prefix}-${createHash("sha256")
    .update(`${table}:${JSON.stringify(values)}`)
    .digest("hex")
    .slice(0, 12)}`;
}

function hashValues(values: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(values)).digest("hex");
}

function whereIdentity(identity: Record<string, unknown>) {
  return Object.keys(identity)
    .map((field) => `${identifier(field)}=?`)
    .join(" AND ");
}

function identifier(value: string) {
  return `\`${value.replace(/`/g, "``")}\``;
}

function replaceTable(
  tables: ExecutionTableProgress[],
  index: number,
  value: ExecutionTableProgress
) {
  return tables.map((item, itemIndex) => (itemIndex === index ? value : item));
}

function toConnector(settings: {
  type: "mariadb" | "mysql2";
  host: string;
  password: string;
  port: number;
  user: string;
}) {
  return { ...settings, driver: settings.type };
}

function audit(action: string, actor: string, details?: string) {
  return { action, actor, at: new Date().toISOString(), ...(details ? { details } : {}) };
}

async function requiredRun(id: number) {
  const run = await repository.getStored(id);
  if (!run) throw AppError.notFound("Execution run was not found.");
  return run;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
