import { describe, expect, it } from "vitest";
import { WORK_ORDER_TYPES_COLLECTION_PATH } from "./work-order-types.routes.js";

describe("Work Order Types module contract", () => {
  it("owns its route", () =>
    expect(WORK_ORDER_TYPES_COLLECTION_PATH).toBe("/core/common/workorder/work-order-types"));
});
