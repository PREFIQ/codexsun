export const taskManagerMigration = { key: "platform.task-manager.json", description: "Tenant Todo JSON store; no SQL migration required." };
export async function migrateTaskManagerModule() { return taskManagerMigration; }
