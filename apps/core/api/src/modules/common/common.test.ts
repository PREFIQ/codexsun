import { describe, expect, it } from "vitest";
import { CommonService } from "./common.service.js";

describe("common module contract", () => {
  it("registers location as a common area", () => {
    expect(new CommonService().listAreas()[0]?.area).toBe("location");
  });
});

