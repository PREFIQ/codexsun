export type DatabaseSettings = {
  database: string;
  host: string;
  password: string;
  port: number;
  type: "mariadb" | "mysql2";
  user: string;
};

export type MigrationJobInput = {
  name: string;
  source: DatabaseSettings;
  status: "draft" | "ready" | "running" | "completed" | "failed";
  target: DatabaseSettings;
  tenant: string;
};
