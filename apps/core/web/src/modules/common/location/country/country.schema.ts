import { z } from "zod";
export const countrySchema = z
  .object({
    code: z.string(),
    name: z.string(),
    sortOrder: z.number(),
    status: z.enum(["active", "inactive"])
  })
  .passthrough();
