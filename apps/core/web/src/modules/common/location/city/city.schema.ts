import { z } from "zod";
export const citySchema = z
  .object({
    code: z.string(),
    name: z.string(),
    sortOrder: z.number(),
    status: z.enum(["active", "inactive"])
  })
  .passthrough();
