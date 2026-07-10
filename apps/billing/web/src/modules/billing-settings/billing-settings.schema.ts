import { z } from "zod";

export const billingSettingsSchema = z.object({
  defaultTaxMode: z.enum(["exclusive", "inclusive"]),
  roundOff: z.boolean()
});
