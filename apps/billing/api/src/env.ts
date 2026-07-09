import { loadEnv } from "@codexsun/framework/env";
import { z } from "zod";

const envSchema = z.object({
  BILLING_API_HOST: z.string().default("127.0.0.1"),
  BILLING_API_PORT: z.coerce.number().int().positive(),
  BILLING_WEB_ORIGIN: z.string().min(1, "BILLING_WEB_ORIGIN is required"),
  ACCOUNTS_API_URL: z.string().min(1, "ACCOUNTS_API_URL is required"),
  DB_HOST: z.string().default("127.0.0.1"),
  DB_MASTER_NAME: z.string().min(1, "DB_MASTER_NAME is required"),
  DB_PASSWORD: z.string(),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string().min(1, "DB_USER is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development")
});

export const env = loadEnv(envSchema);
