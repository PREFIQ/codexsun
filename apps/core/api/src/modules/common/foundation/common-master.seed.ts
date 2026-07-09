import { CommonMasterRepository } from "./common-master.repository.js";
import type { CommonMasterDefinition } from "./common-master.types.js";

export async function seedCommonMaster(definition: CommonMasterDefinition) {
  if (definition.seeds.length === 0) return;
  const repository = new CommonMasterRepository(definition);
  const existing = await repository.list("global");
  const primaryField = definition.fields[0];
  const seeds = withPlaceholder(definition);
  for (let index = 0; index < seeds.length; index += 1) {
    const seed = seeds[index] ?? {};
    const match = primaryField
      ? existing.find((record) =>
          seedIdentity(definition, record[primaryField.key])
          === seedIdentity(definition, seed[primaryField.key]))
      : undefined;
    const payload = { ...seed, isActive: true, sortOrder: index + 1 };
    if (match) await repository.update("global", match.id, payload);
    else await repository.create("global", payload);
  }
  if (definition.allowGlobalMutations !== false) {
    const seedValues = new Set(seeds.map((seed) =>
      seedIdentity(definition, primaryField ? seed[primaryField.key] : "")));
    const legacy = existing.filter((record) =>
      !seedValues.has(seedIdentity(definition, primaryField ? record[primaryField.key] : "")));
    for (let index = 0; index < legacy.length; index += 1) {
      const record = legacy[index];
      if (!record) continue;
      const fields = Object.fromEntries(definition.fields.map((field) => [field.key, record[field.key]]));
      await repository.update("global", record.id, {
        ...fields,
        isActive: record.isActive,
        sortOrder: seeds.length + index + 1
      });
    }
  }
}

function withPlaceholder(definition: CommonMasterDefinition) {
  const hasPlaceholder = definition.seeds.some((seed) =>
    definition.fields.some((field) => String(seed[field.key] ?? "").trim() === "-"));
  if (hasPlaceholder) return definition.seeds;
  const placeholder = Object.fromEntries(definition.fields.map((field) => [
    field.key,
    field.type === "number" ? -1 : field.type === "boolean" ? false : field.type === "date" ? "1900-01-01" : "-"
  ]));
  return [placeholder, ...definition.seeds];
}

function seedIdentity(definition: CommonMasterDefinition, value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (definition.key === "months") return normalized.split("-")[0] ?? normalized;
  if (definition.key !== "bankNames") return normalized;
  return normalized.replace(/\b(?:limited|ltd)\b/g, "").replace(/[^a-z0-9]/g, "");
}
