import { describe, expect, it } from "vitest";
import { serviceOrderSchema } from "./service-orders.schema";
describe("waiter order", () => {
  it("requires table waiter and menu item", () =>
    expect(serviceOrderSchema.safeParse({}).success).toBe(false));
});
