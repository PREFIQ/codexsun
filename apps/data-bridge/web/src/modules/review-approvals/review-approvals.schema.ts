import { z } from "zod";
export const prepareReviewSchema = z.object({
  transformPlanId: z.number().int().positive("Select an approved transform plan."),
  preparedBy: z.string().trim().min(2, "Preparer name is required.")
});
export const sendSelectedRecordsSchema = z.object({
  requestedBy: z.string().trim().min(2, "Operator name is required."),
  batchSize: z.number().int().min(1).max(1000),
  selectionCount: z.number().int().min(1, "Select at least one new or different Source record.")
});
