import { z } from "zod";

export const accountsModuleSchema = z.object({
  balancedPostingRequired: z.literal(true),
  moduleKey: z.literal("accounts.ledgers"),
  tallyReady: z.literal(true)
});
