import { z } from "zod";
export const pincodeSchema = z.object({
  cityId: z.number().int().positive("City is required."),
  name: z.string().trim().min(1, "Pincode name is required.").max(200),
  sortOrder: z.number().int().min(0),
  status: z.enum(["active", "inactive"])
});
