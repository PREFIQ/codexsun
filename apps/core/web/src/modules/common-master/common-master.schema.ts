import { z } from "zod";
export const commonMasterSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));
