import { z } from "zod";

export const locationSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  sortOrder: z.number(),
  status: z.enum(["active", "inactive"])
});

