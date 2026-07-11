import { z } from "zod";
export const serviceOrderSchema = z.object({
  tableLabel: z.string().trim().min(1, "Table is required."),
  waiterName: z.string().trim().min(1, "Waiter is required."),
  itemName: z.string().trim().min(1, "Menu item is required."),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  kitchenStation: z.string().trim().min(1)
});
