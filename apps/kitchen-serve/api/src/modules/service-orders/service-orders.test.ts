import { describe, expect, it } from "vitest";
import { ServiceOrdersService } from "./service-orders.service.js";
describe("service order lifecycle", () => {
  it("moves served orders only to bill waiting", () => {
    const service = new ServiceOrdersService();
    expect(service.allowedTransitions("served")).toEqual(["bill-waiting"]);
    expect(service.allowedTransitions("closed")).toEqual([]);
  });
});
