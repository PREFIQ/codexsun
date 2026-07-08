import { getPlatformDatabase } from "../../database/platform-database.js";
import type { PlatformAppDefinition } from "./app-registry.types.js";

export class AppRegistryRepository {
  async list() {
    const rows = await getPlatformDatabase()
      .selectFrom("platform_apps")
      .select(["id", "label", "module_key", "stack", "always_enabled", "default_landing", "description"])
      .orderBy("default_landing", "desc")
      .orderBy("label", "asc")
      .execute();

    return rows.map(toAppDefinition);
  }
}

type AppRow = {
  always_enabled: number | boolean;
  default_landing: number | boolean;
  description: string;
  id: PlatformAppDefinition["id"];
  label: string;
  module_key: string;
  stack: PlatformAppDefinition["stack"];
};

function toAppDefinition(row: AppRow): PlatformAppDefinition {
  return {
    alwaysEnabled: Boolean(row.always_enabled),
    defaultLanding: Boolean(row.default_landing),
    description: row.description,
    id: row.id,
    label: row.label,
    moduleKey: row.module_key,
    stack: row.stack
  };
}
