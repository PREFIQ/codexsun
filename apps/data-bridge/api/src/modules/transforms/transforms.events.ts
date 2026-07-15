import type { TransformPlan } from "./transforms.types.js";
export function createTransformEvent(plan: TransformPlan, action: string) {
  return {
    name: `data-bridge.transform.${action}`,
    transformPlanId: plan.id,
    status: plan.status,
    occurredAt: new Date().toISOString()
  };
}
