import { z } from "zod";

export const quotationLineSchema = z.object({
  productName: z.string().trim().min(1, "Product is required."),
  quantity: z.number().positive("Quantity must be greater than zero."),
  rate: z.number().nonnegative("Rate cannot be negative."),
  taxRate: z.number().nonnegative("Tax cannot be negative.")
});

export const quotationSchema = z.object({
  customerName: z.string().trim().min(1, "Customer is required."),
  date: z.string().trim().min(1, "Date is required."),
  items: z.array(quotationLineSchema).min(1, "Add at least one item."),
  quotationNumber: z.string().trim().min(1, "Quotation number is required."),
  status: z.enum(["draft", "confirmed", "cancelled"]),
  taxType: z.enum(["cgst-sgst", "igst"])
});
