import { createHash } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import { getCompletedExecutionRun, getExecutionLedger } from "../execution-runs/index.js";
import { createReconciliationAuditEvent } from "./reconciliation-audit.events.js";
import { ReconciliationAuditRepository } from "./reconciliation-audit.repository.js";
import type { ReconciliationException } from "./reconciliation-audit.types.js";
import { processReconciliation } from "./reconciliation-audit.worker.js";

export class ReconciliationAuditService {
  constructor(private readonly repository = new ReconciliationAuditRepository()) {}

  initialize() {
    return this.repository.initialize();
  }

  list() {
    return this.repository.list();
  }

  get(id: number) {
    return this.repository.get(id);
  }

  async generate(executionRunId: number, generatedBy: string) {
    if (await this.repository.findByRun(executionRunId))
      throw AppError.conflict("This execution run already has a reconciliation report.");
    const run = await getCompletedExecutionRun(executionRunId);
    if (!run) throw AppError.conflict("Complete the execution run before reconciliation.");
    const tables = await processReconciliation(run, await getExecutionLedger(executionRunId));
    const timestamp = new Date().toISOString();
    const exceptions: ReconciliationException[] = tables.flatMap((table) => {
      const items: ReconciliationException[] = [];
      if (table.missingRows)
        items.push(
          exception(
            table.targetTable,
            "missing",
            `${table.missingRows} migrated records are missing in Target.`,
            generatedBy
          )
        );
      if (table.mismatchedRows)
        items.push(
          exception(
            table.targetTable,
            "mismatch",
            `${table.mismatchedRows} Target records do not match their Source hashes.`,
            generatedBy
          )
        );
      return items;
    });
    const report = await this.repository.create({
      executionRunId,
      reviewId: run.reviewId,
      tenant: run.tenant,
      name: run.name,
      status: exceptions.length ? "needs_attention" : "pending_signoff",
      generatedBy: generatedBy.trim(),
      generatedAt: timestamp,
      tables,
      exceptions,
      signOff: null,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    createReconciliationAuditEvent(report, "generated");
    return report;
  }

  async addException(
    id: number,
    table: string,
    category: ReconciliationException["category"],
    details: string,
    actor: string
  ) {
    const report = await required(await this.repository.get(id));
    if (report.status === "signed_off") throw AppError.conflict("A signed report is immutable.");
    const saved = await this.repository.update(id, {
      status: "needs_attention",
      exceptions: [...report.exceptions, exception(table, category, details, actor)]
    });
    return required(saved);
  }

  async resolveException(id: number, exceptionId: string, actor: string, resolution: string) {
    const report = await required(await this.repository.get(id));
    if (report.status === "signed_off") throw AppError.conflict("A signed report is immutable.");
    const current = report.exceptions.find((item) => item.id === exceptionId);
    if (!current) throw AppError.notFound("Reconciliation exception was not found.");
    if (current.status === "resolved")
      throw AppError.conflict("This exception is already resolved.");
    const timestamp = new Date().toISOString();
    const exceptions = report.exceptions.map((item) =>
      item.id === exceptionId
        ? {
            ...item,
            status: "resolved" as const,
            resolvedBy: actor.trim(),
            resolvedAt: timestamp,
            resolution: resolution.trim()
          }
        : item
    );
    const saved = await this.repository.update(id, {
      exceptions,
      status: exceptions.some((item) => item.status === "open")
        ? "needs_attention"
        : "pending_signoff"
    });
    return required(saved);
  }

  async signOff(
    id: number,
    clientName: string,
    clientReference: string,
    signedBy: string,
    note: string
  ) {
    const report = await required(await this.repository.get(id));
    if (report.status !== "pending_signoff")
      throw AppError.conflict("Resolve every reconciliation exception before client sign-off.");
    const signedAt = new Date().toISOString();
    const saved = await this.repository.update(id, {
      status: "signed_off",
      signOff: {
        clientName: clientName.trim(),
        clientReference: clientReference.trim(),
        signedBy: signedBy.trim(),
        note: note.trim(),
        signedAt
      }
    });
    const completed = await required(saved);
    createReconciliationAuditEvent(completed, "signed-off");
    return completed;
  }

  async auditExport(id: number) {
    const report = await required(await this.repository.get(id));
    return {
      exportedAt: new Date().toISOString(),
      report,
      checksum: createHash("sha256").update(JSON.stringify(report)).digest("hex")
    };
  }
}

function exception(
  table: string,
  category: ReconciliationException["category"],
  details: string,
  actor: string
): ReconciliationException {
  const createdAt = new Date().toISOString();
  return {
    id: `EX-${createHash("sha256").update(`${table}:${category}:${details}:${createdAt}`).digest("hex").slice(0, 12)}`,
    table,
    category,
    details: details.trim(),
    status: "open",
    createdBy: actor.trim(),
    createdAt,
    resolvedBy: null,
    resolvedAt: null,
    resolution: null
  };
}

async function required<T>(value: T | null): Promise<T> {
  if (!value) throw AppError.notFound("Reconciliation report was not found.");
  return value;
}
