import { z } from "zod";

export const countrySchema = z.object({
  capital: z.string().nullable(),
  currencyCode: z.string().length(3),
  dialCode: z.string().min(1),
  iso2: z.string().length(2),
  iso3: z.string().length(3),
  name: z.string().min(1),
  numericCode: z.string().min(1),
  status: z.enum(["active", "inactive"])
});
