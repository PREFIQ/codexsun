import { z } from "zod";

export const salesSettingsSchema = z.object({
  features: z.object({
    purchase: z.boolean(),
    quotation: z.boolean(),
    sales: z.boolean(),
  }),
  gstApiMode: z.enum(["einvoice_eway", "eway_only"]),
  layout: z.record(z.enum(["quotation", "sales", "purchase"]), z.object({
    useColour: z.boolean(),
    useDc: z.boolean(),
    useEinvoice: z.boolean(),
    useEway: z.boolean(),
    usePo: z.boolean(),
    useSize: z.boolean()
  }))
});
