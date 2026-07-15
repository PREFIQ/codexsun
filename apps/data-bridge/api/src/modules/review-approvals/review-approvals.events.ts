import type { ReviewApproval } from "./review-approvals.types.js";

export type ReviewApprovalEvent = {
  name: "data-bridge.review.prepared" | "data-bridge.review.decided";
  reviewId: number;
  status: ReviewApproval["status"];
  tenant: string;
  occurredAt: string;
};

export function createReviewApprovalEvent(
  name: ReviewApprovalEvent["name"],
  review: ReviewApproval
): ReviewApprovalEvent {
  return {
    name,
    reviewId: review.id,
    status: review.status,
    tenant: review.tenant,
    occurredAt: new Date().toISOString()
  };
}
