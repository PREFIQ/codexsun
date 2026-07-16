const servicePromise = import("./review-approvals.service.js").then(
  ({ ReviewApprovalsService }) => new ReviewApprovalsService()
);

export async function verifyApprovedReview(id: number) {
  return (await servicePromise).verifyApproved(id);
}

export async function verifyPreparedReview(id: number) {
  return (await servicePromise).verifyPrepared(id);
}

export { registerReviewApprovalsModule } from "./review-approvals.module.js";
export type {
  ReviewApproval,
  ReviewCandidate,
  ReviewRecordPreview,
  ReviewRecordPreviewRow,
  ReviewStatus,
  ReviewTableEvidence
} from "./review-approvals.types.js";
