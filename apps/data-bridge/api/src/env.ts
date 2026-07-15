import { loadEnv } from "@codexsun/framework/env";
import { z } from "zod";

const schema = z.object({
  JWT_SECRET: z.string().min(1),
  API_HOST: z.string().default("127.0.0.1"),
  DATA_BRIDGE_API_PORT: z.coerce.number().int().positive(),
  DATA_BRIDGE_WEB_ORIGIN: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PLATFORM_WEB_ORIGIN: z.string().min(1)
});

export const env = loadEnv(schema);
