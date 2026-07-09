export async function migrateProjectManagerModule() {
  return {
    migrated: true,
    source: "platform-project-manager",
    tables: ["project_manager_records", "project_manager_registry"]
  };
}
