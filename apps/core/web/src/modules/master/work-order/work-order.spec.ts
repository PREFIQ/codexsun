import { describe, expect, it } from "vitest";
import { workOrderDefinition } from "./work-order.definition";
describe("WorkOrder master page", () => { it("has a route", () => { expect(workOrderDefinition.route).toBeTruthy(); }); });
