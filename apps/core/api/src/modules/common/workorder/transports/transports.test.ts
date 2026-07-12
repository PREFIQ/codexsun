import { describe, expect, it } from "vitest";
import { TRANSPORTS_COLLECTION_PATH } from "./transports.routes.js";

describe("Transports module contract", () => {
  it("owns its route", () =>
    expect(TRANSPORTS_COLLECTION_PATH).toBe("/core/common/workorder/transports"));
});
