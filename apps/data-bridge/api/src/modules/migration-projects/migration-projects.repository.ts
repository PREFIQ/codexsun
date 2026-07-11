export class MigrationProjectsRepository {
  sanitizeConnectionLabel(label: string) {
    return label.trim().replace(/[^a-zA-Z0-9 _-]/g, "");
  }
}
