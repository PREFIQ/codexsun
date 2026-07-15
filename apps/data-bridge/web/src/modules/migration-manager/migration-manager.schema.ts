import { z } from "zod";
const databaseSchema = z.object({
  database: z.string().trim().min(1),
  host: z.string().trim().min(1),
  password: z.string(),
  port: z.number().int().positive(),
  type: z.enum(["mariadb", "mysql2"]),
  user: z.string().trim().min(1)
});
export const migrationJobSchema = z.object({
  name: z.string().trim().min(2).max(160),
  tenant: z.string().trim().min(2).max(160),
  status: z.enum(["draft", "ready", "running", "completed", "failed"]),
  source: databaseSchema,
  target: databaseSchema
});
