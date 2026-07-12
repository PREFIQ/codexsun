import { describe, expect, it } from "vitest";
import { STOCK_REJECTION_TYPES_COLLECTION_PATH } from "./stock-rejection-types.routes.js";

describe("Stock Rejection Types module contract", () => {
  it("owns its route", () =>
    expect(STOCK_REJECTION_TYPES_COLLECTION_PATH).toBe(
      "/core/common/workorder/stock-rejection-types"
    ));
});
