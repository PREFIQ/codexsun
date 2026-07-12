import { describe, expect, it } from "vitest";
import { STYLES_COLLECTION_PATH } from "./styles.routes.js";

describe("Styles module contract", () => {
  it("owns its route", () => expect(STYLES_COLLECTION_PATH).toBe("/core/common/products/styles"));
});
