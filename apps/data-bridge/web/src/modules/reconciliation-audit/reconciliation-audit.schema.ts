import { z } from "zod";
export const generateReportSchema = z.object({
  executionRunId: z.number().int().positive("Select a completed execution."),
  generatedBy: z.string().trim().min(2, "Verifier name is required.")
});
export const signOffSchema = z.object({
  clientName: z.string().trim().min(2, "Client name is required."),
  clientReference: z.string().trim().min(2, "Client reference is required."),
  signedBy: z.string().trim().min(2, "Signatory is required."),
  note: z.string().trim().max(1000)
});
export const addExceptionSchema = z.object({
  table: z.string().trim().min(1, "Table is required."),
  category: z.enum(["financial", "operator"]),
  details: z.string().trim().min(3, "Exception details are required."),
  actor: z.string().trim().min(2, "Actor is required.")
});
export const resolveExceptionSchema = z.object({
  actor: z.string().trim().min(2, "Resolver is required."),
  resolution: z.string().trim().min(3, "Resolution is required.")
});
