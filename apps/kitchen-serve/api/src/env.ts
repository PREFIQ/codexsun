import { loadEnv } from "@codexsun/framework/env";
import { z } from "zod";
const schema = z.object({
  DB_HOST: z.string().default("127.0.0.1"),
  DB_MASTER_NAME: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  API_HOST: z.string().default("127.0.0.1"),
  KITCHEN_SERVE_API_PORT: z.coerce.number().int().positive(),
  KITCHEN_SERVE_WEB_ORIGIN: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PLATFORM_WEB_ORIGIN: z.string().min(1)
});
export const env = loadEnv(schema);
