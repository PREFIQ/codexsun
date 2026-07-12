import { describe, expect, it } from "vitest";
import { DESTINATIONS_COLLECTION_PATH } from "./destinations.routes.js";

describe("Destinations module contract", () => {
  it("owns its route", () =>
    expect(DESTINATIONS_COLLECTION_PATH).toBe("/core/common/workorder/destinations"));
});
