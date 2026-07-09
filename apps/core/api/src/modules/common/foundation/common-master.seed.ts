import { CommonMasterRepository } from "./common-master.repository.js";
import type { CommonMasterDefinition } from "./common-master.types.js";

export async function seedCommonMaster(definition: CommonMasterDefinition) {
  if (definition.seeds.length === 0) return;
  const repository = new CommonMasterRepository(definition);
  const existing = await repository.list("global");
  if (existing.length > 0) return;
  for (let index = 0; index < definition.seeds.length; index += 1) {
    await repository.create("global", { ...definition.seeds[index], isActive: true, sortOrder: index + 1 });
  }
}
