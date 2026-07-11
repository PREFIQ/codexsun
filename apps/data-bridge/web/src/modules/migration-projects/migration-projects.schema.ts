import { z } from "zod";
export const migrationConnectionSchema = z.object({ label: z.string().trim().min(2), tenantId: z.string().trim().min(1), databaseType: z.enum(["mariadb", "mysql", "postgresql", "sql-server", "sqlite", "other"]) });
