import { AppError } from "@codexsun/framework/errors";
import { MigrationManagerRepository } from "./migration-manager.repository.js";
import type { MigrationJobInput } from "./migration-manager.types.js";
import { processMigrationConnectionTest } from "./migration-manager.worker.js";

export class MigrationManagerService {
  constructor(private readonly repository = new MigrationManagerRepository()) {}
  initialize() {
    return this.repository.initialize();
  }
  list() {
    return this.repository.list();
  }
  get(id: number) {
    return this.repository.get(id);
  }
  secrets(id: number) {
    return this.repository.secretSettings(id);
  }
  async create(input: MigrationJobInput) {
    const duplicate = (await this.repository.list()).some(
      (job) => String(job.name).toLowerCase() === input.name.toLowerCase()
    );
    if (duplicate) throw AppError.conflict("Job name already exists.");
    if (!input.source.password || !input.target.password)
      throw AppError.validation("Complete all required database settings.");
    return this.repository.create(input);
  }
  async update(id: number, input: MigrationJobInput) {
    const job = await this.repository.update(id, input);
    if (!job) throw AppError.notFound("Migration job was not found.");
    return job;
  }
  async smokeTest(id: number, side: "source" | "target") {
    const secrets = await this.repository.secretSettings(id);
    if (!secrets) throw AppError.notFound("Migration job was not found.");
    try {
      return await processMigrationConnectionTest(secrets[side]);
    } catch {
      const config = secrets[side];
      return {
        connected: false,
        position: `${config.host}:${config.port}/${config.database}`,
        responseMs: null
      };
    }
  }
}
