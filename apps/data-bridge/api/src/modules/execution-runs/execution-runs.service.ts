import { AppError } from "@codexsun/framework/errors";
import { verifyApprovedReview } from "../review-approvals/index.js";
import { createExecutionRunEvent } from "./execution-runs.events.js";
import { ExecutionRunsRepository } from "./execution-runs.repository.js";
import type { ExecutionConflictDecision, StoredExecutionRun } from "./execution-runs.types.js";
import { queueExecutionRun } from "./execution-runs.worker.js";

export class ExecutionRunsService {
  constructor(private readonly repository = new ExecutionRunsRepository()) {}

  initialize() {
    return this.repository.initialize();
  }

  list() {
    return this.repository.list();
  }

  get(id: number) {
    return this.repository.get(id);
  }

  async create(reviewId: number, requestedBy: string, batchSize: number) {
    const duplicate = (await this.repository.list()).find(
      (run) => run.reviewId === reviewId && !["cancelled", "failed"].includes(run.status)
    );
    if (duplicate) throw AppError.conflict("This approved review already has an execution run.");
    const { review, transform } = await verifyApprovedReview(reviewId);
    const timestamp = new Date().toISOString();
    const run = await this.repository.create({
      reviewId,
      transformPlanId: transform.id,
      migrationJobId: review.migrationJobId,
      tenant: review.tenant,
      name: review.planName,
      checksum: review.checksum,
      approvalReference: review.approvalReference!,
      requestedBy: requestedBy.trim(),
      batchSize,
      status: "queued",
      tables: review.tables.map((table) => ({
        sourceTable: table.sourceTable,
        targetTable: table.targetTable,
        status: "pending",
        totalRows: table.sourceCount,
        checkpoint: 0,
        insertedRows: 0,
        overriddenRows: 0,
        rejectedRows: 0,
        conflictCount: 0,
        error: null
      })),
      conflicts: [],
      ledger: [],
      audit: [{ action: "queued", actor: requestedBy.trim(), at: timestamp }],
      currentTable: null,
      startedAt: null,
      finishedAt: null,
      error: null,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    createExecutionRunEvent(run, "queued");
    queueExecutionRun(run.id);
    return run;
  }

  async pause(id: number, actor: string) {
    const run = await required(await this.repository.getStored(id));
    if (run.status !== "running" && run.status !== "queued")
      throw AppError.conflict("Only a queued or running execution can be paused.");
    return this.changeStatus(run, "paused", actor);
  }

  async cancel(id: number, actor: string) {
    const run = await required(await this.repository.getStored(id));
    if (["completed", "cancelled"].includes(run.status))
      throw AppError.conflict("This execution can no longer be cancelled.");
    return this.changeStatus(run, "cancelled", actor, true);
  }

  async resume(id: number, actor: string) {
    const run = await required(await this.repository.getStored(id));
    if (run.status !== "paused" && run.status !== "blocked")
      throw AppError.conflict("Only a paused or blocked execution can be resumed.");
    if (run.conflicts.some((item) => item.status === "pending"))
      throw AppError.conflict("Decide every pending conflict before resuming.");
    await verifyApprovedReview(run.reviewId);
    const saved = await this.changeStatus(run, "queued", actor);
    queueExecutionRun(id);
    return saved;
  }

  async retry(id: number, actor: string) {
    const run = await required(await this.repository.getStored(id));
    if (run.status !== "failed") throw AppError.conflict("Only a failed execution can be retried.");
    await verifyApprovedReview(run.reviewId);
    const saved = await this.changeStatus(run, "queued", actor);
    queueExecutionRun(id);
    return saved;
  }

  async decideConflict(
    id: number,
    conflictId: string,
    action: ExecutionConflictDecision["action"],
    actor: string,
    reason: string
  ) {
    const run = await required(await this.repository.getStored(id));
    if (run.status !== "blocked")
      throw AppError.conflict("Conflict decisions require a blocked run.");
    const conflict = run.conflicts.find((item) => item.id === conflictId);
    if (!conflict) throw AppError.notFound("Execution conflict was not found.");
    if (conflict.status !== "pending")
      throw AppError.conflict("This conflict already has a decision.");
    const decidedAt = new Date().toISOString();
    const decision = { action, actor: actor.trim(), reason: reason.trim(), decidedAt };
    const saved = await this.repository.update(run.id, {
      conflicts: run.conflicts.map((item) =>
        item.id === conflictId ? { ...item, status: "decided" as const, decision } : item
      ),
      audit: [
        ...run.audit,
        {
          action: `conflict-${action}`,
          actor: actor.trim(),
          at: decidedAt,
          details: `${conflictId}: ${reason.trim()}`
        }
      ]
    });
    if (!saved) throw AppError.notFound("Execution run was not found.");
    return saved;
  }

  ledger(id: number) {
    return this.repository.ledger(id);
  }

  private async changeStatus(
    run: StoredExecutionRun,
    status: StoredExecutionRun["status"],
    actor: string,
    finished = false
  ) {
    const saved = await this.repository.update(run.id, {
      status,
      finishedAt: finished ? new Date().toISOString() : run.finishedAt,
      audit: [...run.audit, { action: status, actor: actor.trim(), at: new Date().toISOString() }]
    });
    if (!saved) throw AppError.notFound("Execution run was not found.");
    createExecutionRunEvent(saved, status);
    return saved;
  }
}

async function required(run: StoredExecutionRun | null) {
  if (!run) throw AppError.notFound("Execution run was not found.");
  return run;
}
