import { describe, expect, it } from "vitest";
import { COLOURS_COLLECTION_PATH } from "./colours.routes.js";

describe("Colours module contract", () => {
  it("owns its route", () => expect(COLOURS_COLLECTION_PATH).toBe("/core/common/products/colours"));
});
