import { describe, expect, it } from "vitest";
import { STATE_COLLECTION_PATH } from "./state.routes.js";

describe("state module contract", () => {
  it("owns the state route", () => {
    expect(STATE_COLLECTION_PATH).toBe("/core/common/location/states");
  });
});
