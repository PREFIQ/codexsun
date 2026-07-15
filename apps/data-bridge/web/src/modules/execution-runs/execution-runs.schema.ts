import { z } from "zod";
export const createExecutionSchema = z.object({
  reviewId: z.number().int().positive("Select an approved review."),
  requestedBy: z.string().trim().min(2, "Operator name is required."),
  batchSize: z.number().int().min(1).max(1000)
});
export const conflictDecisionSchema = z.object({
  action: z.enum(["override", "reject"]),
  actor: z.string().trim().min(2, "Decision actor is required."),
  reason: z.string().trim().min(3, "Decision reason is required.")
});
