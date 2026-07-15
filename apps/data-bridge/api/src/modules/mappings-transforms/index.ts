import { MappingsTransformsRepository } from "./mappings-transforms.repository.js";

const publicRepository = new MappingsTransformsRepository();

export async function getMappingPlanContext(id: number) {
  return publicRepository.getContext(id);
}

export { registerMappingsTransformsModule } from "./mappings-transforms.module.js";
export type {
  MappingField,
  MappingPlan,
  MappingPlanContext,
  MappingTable
} from "./mappings-transforms.types.js";
