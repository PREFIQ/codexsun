import { z } from "zod";
export const companySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  industryId: z.number().nullable().optional()
});
