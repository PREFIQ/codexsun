import { z } from "zod";
export const prepareReviewSchema = z.object({
  transformPlanId: z.number().int().positive("Select an approved transform plan."),
  preparedBy: z.string().trim().min(2, "Preparer name is required.")
});
export const approveReviewSchema = z.object({
  approver: z.string().trim().min(2, "Approver name is required."),
  approvalReference: z.string().trim().min(3, "Approval reference is required."),
  reason: z.string().trim().min(3, "Decision reason is required.")
});
export const reviewDecisionSchema = z.object({
  actor: z.string().trim().min(2, "Decision actor is required."),
  reason: z.string().trim().min(3, "Decision reason is required.")
});
