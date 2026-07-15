import { MigrationManagerRepository } from "./migration-manager.repository.js";

const publicRepository = new MigrationManagerRepository();

export async function getMigrationJobSecrets(id: number) {
  return publicRepository.secretSettings(id);
}

export async function getMigrationJob(id: number) {
  return publicRepository.get(id);
}

export { registerMigrationManagerModule } from "./migration-manager.module.js";
export type { DatabaseSettings, MigrationJobInput } from "./migration-manager.types.js";
