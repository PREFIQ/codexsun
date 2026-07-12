import { describe, expect, it } from "vitest";
import { workOrderDefinition } from "./work-order.definition.js";
describe("Work Order master", () => { it("owns its table", () => { expect(workOrderDefinition.tableName).toBe("work_orders"); }); });
