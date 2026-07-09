import { z } from "zod";

export const saleLineItemSchema = z.object({
  colour: z.string(),
  dcNo: z.string(),
  description: z.string().trim().min(1, "Item description is required."),
  hsnCode: z.string().trim().min(1, "HSN code is required."),
  poNo: z.string(),
  quantity: z.number().positive("Quantity must be greater than zero."),
  rate: z.number().nonnegative("Rate must be zero or more."),
  size: z.string(),
  taxRate: z.number().min(0, "Tax rate must be zero or more."),
  unit: z.string().trim().min(1, "Unit is required."),
});

export const salesSchema = z.object({
  billingAddress: z.string().trim().min(1, "Billing address is required."),
  currencyCode: z.string().trim().length(3, "Currency code must be 3 letters."),
  customerEmail: z.string().trim().email("Enter a valid customer email."),
  customerName: z.string().trim().min(1, "Customer name is required."),
  customerPhone: z.string().trim().min(1, "Customer phone is required."),
  invoiceNumber: z.string().trim().min(1, "Invoice number is required."),
  issuedOn: z.iso.date("Invoice date is required."),
  items: z.array(saleLineItemSchema).min(1, "Add at least one line item."),
  notes: z.string(),
  roundOff: z.number(),
  shippingAddress: z.string().trim().min(1, "Shipping address is required."),
  status: z.enum(["draft", "confirmed", "cancelled"]),
});
