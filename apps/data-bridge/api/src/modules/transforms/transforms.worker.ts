import type { TransformPlan } from "./transforms.types.js";
export function processTransformValidation(plan: TransformPlan) {
  return {
    valid:
      plan.tables.length > 0 &&
      plan.tables.every(
        (table) =>
          table.fields.length > 0 &&
          table.sourceQuery.startsWith("SELECT ") &&
          table.targetQuery.startsWith("INSERT INTO ")
      ),
    tableCount: plan.tables.length
  };
}
