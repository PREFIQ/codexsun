import { z } from "zod";

export const purchaseLineItemSchema = z.object({
  colour: z.string(),
  dcNo: z.string(),
  description: z.string(),
  hsnCode: z.string().trim().min(1, "HSN code is required."),
  poNo: z.string(),
  productName: z.string().trim().min(1, "Product name is required."),
  quantity: z.number().positive("Quantity must be greater than zero."),
  rate: z.number().nonnegative("Rate must be zero or more."),
  size: z.string(),
  taxRate: z.number().min(0, "Tax rate must be zero or more."),
  unit: z.string().trim().min(1, "Unit is required.")
});

export const purchaseSchema = z.object({
  billingAddress: z.string().trim().min(1, "Billing address is required."),
  currencyCode: z.string().trim().length(3, "Currency code must be 3 letters."),
  customerEmail: z.string().trim().email("Enter a valid supplier email."),
  customerName: z.string().trim().min(1, "Supplier name is required."),
  customerPhone: z.string().trim().min(1, "Supplier phone is required."),
  invoiceNumber: z.string().trim().min(1, "Invoice number is required."),
  issuedOn: z.iso.date("Invoice date is required."),
  items: z.array(purchaseLineItemSchema).min(1, "Add at least one line item."),
  notes: z.string(),
  roundOff: z.number(),
  shippingAddress: z.string().trim().min(1, "Shipping address is required."),
  status: z.enum(["draft", "confirmed", "cancelled"]),
  supplierBillDate: z.string(),
  supplierBillNo: z.string(),
  taxType: z.string().trim().min(1, "Purchase tax type is required."),
  workOrderNo: z.string()
});
