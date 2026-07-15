import { TransformsRepository } from "./transforms.repository.js";

const publicRepository = new TransformsRepository();

export async function getTransformPlan(id: number) {
  return publicRepository.get(id);
}

export async function listApprovedTransformPlans() {
  return (await publicRepository.list()).filter((plan) => plan.status === "approved");
}

export async function upsertTransformPlanFromMapping(
  mappingPlanId: number,
  name: string,
  tables: import("./transforms.types.js").TransformTable[]
) {
  return publicRepository.upsertFromMapping(mappingPlanId, name, tables);
}

export async function deleteTransformPlanForMapping(mappingPlanId: number) {
  return publicRepository.deleteForMapping(mappingPlanId);
}

export { registerTransformsModule } from "./transforms.module.js";
export type { TransformField, TransformPlan, TransformTable } from "./transforms.types.js";
