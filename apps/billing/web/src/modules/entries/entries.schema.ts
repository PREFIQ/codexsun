import { z } from "zod";

export const entryFilterSchema = z.object({
  kind: z.enum(["quotation", "sales"]),
  search: z.string().trim().optional(),
  status: z.enum(["draft", "posted", "cancelled"]).optional()
});

export const entryQuickFormSchema = z.object({
  documentDate: z.string().min(1, "Document date is required."),
  documentNo: z.string().trim().min(1, "Document number is required."),
  customerName: z.string().trim().min(1, "Customer is required.")
});
