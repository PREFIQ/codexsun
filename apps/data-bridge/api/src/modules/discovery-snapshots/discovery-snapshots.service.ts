import { AppError } from "@codexsun/framework/errors";
import { DiscoverySnapshotsRepository } from "./discovery-snapshots.repository.js";
import { getMigrationJobSecrets } from "../migration-manager/index.js";
import {
  processDatabaseDiscovery,
  processDiscoveryComparison
} from "./discovery-snapshots.worker.js";
export class DiscoverySnapshotsService {
  constructor(private readonly repository = new DiscoverySnapshotsRepository()) {}
  initialize() {
    return this.repository.initialize();
  }
  list() {
    return this.repository.list();
  }
  get(id: number) {
    return this.repository.get(id);
  }
  setOmittedTables(id: number, tables: string[]) {
    return this.repository.setOmittedTables(id, tables);
  }
  setTableMappings(id: number, mappings: Record<string, string>) {
    return this.repository.setTableMappings(id, mappings);
  }
  setTableGroups(id: number, groups: Record<string, string>) {
    return this.repository.setTableGroups(id, groups);
  }
  prepare(id: number) {
    return this.repository.prepareMappingInput(id);
  }
  delete(id: number) {
    return this.repository.delete(id);
  }
  async create(migrationJobId: number) {
    const secrets = await getMigrationJobSecrets(migrationJobId);
    if (!secrets) throw AppError.notFound("Migration job was not found.");
    try {
      const [source, target] = await Promise.all([
        processDatabaseDiscovery(secrets.source),
        processDatabaseDiscovery(secrets.target)
      ]);
      return this.repository.create(
        migrationJobId,
        source,
        target,
        processDiscoveryComparison(source, target)
      );
    } catch (error) {
      throw new AppError({
        code: "DISCOVERY_FAILED",
        message: "Discovery failed. Verify both database connections and permissions.",
        statusCode: 422,
        ...(error instanceof Error ? { details: error.message } : {})
      });
    }
  }
  async required(id: number) {
    const snapshot = await this.repository.get(id);
    if (!snapshot) throw AppError.notFound("Discovery snapshot was not found.");
    return snapshot;
  }
}
