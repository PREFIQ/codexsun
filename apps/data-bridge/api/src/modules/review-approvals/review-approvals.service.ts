import { createHash } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import { getMigrationJob } from "../migration-manager/index.js";
import { getMappingPlanContext } from "../mappings-transforms/index.js";
import { getTransformPlan, listApprovedTransformPlans } from "../transforms/index.js";
import { createReviewApprovalEvent } from "./review-approvals.events.js";
import { ReviewApprovalsRepository } from "./review-approvals.repository.js";
import type { ReviewApproval, ReviewCandidate } from "./review-approvals.types.js";
import { processReviewDryRun } from "./review-approvals.worker.js";

export class ReviewApprovalsService {
  constructor(private readonly repository = new ReviewApprovalsRepository()) {}

  initialize() {
    return this.repository.initialize();
  }

  list() {
    return this.repository.list();
  }

  get(id: number) {
    return this.repository.get(id);
  }

  async candidates(): Promise<ReviewCandidate[]> {
    const transforms = await listApprovedTransformPlans();
    const reviews = await this.repository.list();
    return transforms.map((plan) => {
      const review = reviews.find((item) => item.transformPlanId === plan.id) ?? null;
      return {
        transformPlanId: plan.id,
        mappingPlanId: plan.mappingPlanId,
        name: plan.name,
        status: "approved",
        tableCount: plan.tables.length,
        reviewId: review?.id ?? null,
        reviewStatus: review?.status ?? null
      };
    });
  }

  async prepare(transformPlanId: number, preparedBy: string) {
    const existing = await this.repository.findByTransformPlan(transformPlanId);
    if (existing && existing.status !== "revoked" && existing.status !== "rejected")
      throw AppError.conflict("This transform plan already has an active review.");
    const transform = await requiredTransform(transformPlanId);
    if (transform.status !== "approved")
      throw AppError.conflict("Approve the transform query plan before preparing its review.");
    const context = await getMappingPlanContext(transform.mappingPlanId);
    if (!context) throw AppError.notFound("The field mapping context was not found.");
    const job = await getMigrationJob(context.snapshot.migrationJobId);
    if (!job) throw AppError.notFound("The migration job was not found.");
    const tables = await processReviewDryRun(transform, context);
    const timestamp = new Date().toISOString();
    const review = await this.repository.create({
      transformPlanId: transform.id,
      mappingPlanId: transform.mappingPlanId,
      migrationJobId: context.snapshot.migrationJobId,
      tenant: String(job.tenant),
      planName: transform.name,
      checksum: checksumTransform(transform),
      status: "pending",
      preparedBy: preparedBy.trim(),
      preparedAt: timestamp,
      dryRunSucceeded: tables.every((table) => table.blockingRisks.length === 0),
      totalSourceRows: tables.reduce((total, table) => total + table.sourceCount, 0),
      totalTargetRows: tables.reduce((total, table) => total + table.targetCount, 0),
      tables,
      approvalReference: null,
      approver: null,
      decisionReason: null,
      decidedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    createReviewApprovalEvent("data-bridge.review.prepared", review);
    return review;
  }

  approve(id: number, approver: string, approvalReference: string, reason: string) {
    return this.decide(id, "approved", approver, approvalReference, reason);
  }

  reject(id: number, approver: string, reason: string) {
    return this.decide(id, "rejected", approver, null, reason);
  }

  async revoke(id: number, actor: string, reason: string) {
    const review = await requiredReview(await this.repository.get(id));
    if (review.status !== "approved")
      throw AppError.conflict("Only an approved review can be revoked.");
    return this.saveDecision(review, "revoked", actor, null, reason);
  }

  async verifyApproved(id: number) {
    const review = await requiredReview(await this.repository.get(id));
    if (review.status !== "approved" || !review.dryRunSucceeded || !review.approvalReference)
      throw AppError.conflict("The data-transfer review is not approved for execution.");
    const transform = await requiredTransform(review.transformPlanId);
    if (transform.status !== "approved" || checksumTransform(transform) !== review.checksum)
      throw AppError.conflict("The approved query plan changed. Prepare and approve a new review.");
    return { review, transform };
  }

  private async decide(
    id: number,
    status: "approved" | "rejected",
    approver: string,
    approvalReference: string | null,
    reason: string
  ) {
    const review = await requiredReview(await this.repository.get(id));
    if (review.status !== "pending")
      throw AppError.conflict("Only a pending review can be decided.");
    if (review.preparedBy.trim().toLowerCase() === approver.trim().toLowerCase())
      throw AppError.conflict("The preparer cannot approve or reject the same review.");
    if (status === "approved" && !review.dryRunSucceeded)
      throw AppError.conflict("Resolve every blocking dry-run risk before approval.");
    const transform = await requiredTransform(review.transformPlanId);
    if (checksumTransform(transform) !== review.checksum)
      throw AppError.conflict("The query plan changed after review preparation.");
    return this.saveDecision(review, status, approver, approvalReference, reason);
  }

  private async saveDecision(
    review: ReviewApproval,
    status: ReviewApproval["status"],
    actor: string,
    approvalReference: string | null,
    reason: string
  ) {
    const timestamp = new Date().toISOString();
    const saved = await this.repository.update(review.id, {
      status,
      approver: actor.trim(),
      approvalReference: approvalReference?.trim() || null,
      decisionReason: reason.trim(),
      decidedAt: timestamp,
      updatedAt: timestamp
    });
    if (!saved) throw AppError.notFound("Review was not found.");
    createReviewApprovalEvent("data-bridge.review.decided", saved);
    return saved;
  }
}

export function checksumTransform(transform: {
  id: number;
  mappingPlanId: number;
  tables: unknown;
}) {
  return createHash("sha256")
    .update(
      stableJson({
        id: transform.id,
        mappingPlanId: transform.mappingPlanId,
        tables: transform.tables
      })
    )
    .digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function requiredTransform(id: number) {
  const transform = await getTransformPlan(id);
  if (!transform) throw AppError.notFound("Transform plan was not found.");
  return transform;
}

async function requiredReview(review: ReviewApproval | null) {
  if (!review) throw AppError.notFound("Review was not found.");
  return review;
}
