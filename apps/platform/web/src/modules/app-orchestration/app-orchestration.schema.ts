import { z } from "zod";
export const orchestratedAppIdSchema = z.enum([
  "platform",
  "core",
  "billing",
  "accounts",
  "data-bridge",
  "kitchen-serve"
]);
