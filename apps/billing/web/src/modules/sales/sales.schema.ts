import { z } from "zod";

export const salesSchema = z.object({
  amount: z.number().nonnegative(),
  currencyCode: z.string().length(3),
  customerName: z.string().min(1),
  invoiceNumber: z.string().min(1),
  issuedOn: z.iso.date(),
  status: z.enum(["draft", "confirmed", "cancelled"])
});
