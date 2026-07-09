import { describe, expect, it } from "vitest";
import { workOrderTypesDefinition } from "./work-order-types.definition";
describe("Work Order Types", () => { it("keeps an independent frontend route", () => expect(workOrderTypesDefinition.route).toContain("workorder")); });
