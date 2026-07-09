import { describe, expect, it } from "vitest";
import { workOrderTypesDefinition } from "./work-order-types.definition.js";
describe("Work Order Types", () => { it("owns an independent table and required fields", () => { expect(workOrderTypesDefinition.tableName).toBe("core_common_work_order_types"); expect(workOrderTypesDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
