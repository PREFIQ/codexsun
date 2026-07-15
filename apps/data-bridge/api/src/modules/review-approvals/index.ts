const servicePromise = import("./review-approvals.service.js").then(
  ({ ReviewApprovalsService }) => new ReviewApprovalsService()
);

export async function verifyApprovedReview(id: number) {
  return (await servicePromise).verifyApproved(id);
}

export { registerReviewApprovalsModule } from "./review-approvals.module.js";
export type {
  ReviewApproval,
  ReviewCandidate,
  ReviewStatus,
  ReviewTableEvidence
} from "./review-approvals.types.js";
