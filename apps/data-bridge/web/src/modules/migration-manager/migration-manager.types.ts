export type DatabaseSettings = { database: string; host: string; password?: string; port: number; type: "mariadb" | "mysql2"; user: string };
export type MigrationJob = { id: number; name: string; tenant: string; status: "draft" | "ready" | "running" | "completed" | "failed"; source: DatabaseSettings; target: DatabaseSettings; createdAt: string; updatedAt: string };
export type MigrationJobInput = Omit<MigrationJob, "id" | "createdAt" | "updatedAt">;
export type SmokeResult = { connected: boolean; position: string; responseMs: number | null };
