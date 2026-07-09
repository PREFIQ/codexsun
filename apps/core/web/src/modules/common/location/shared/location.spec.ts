import { describe, expect, it } from "vitest";
import { locationSchema } from "./location.schema";

describe("location schema", () => {
  it("requires code and name", () => {
    expect(locationSchema.safeParse({ code: "IN", name: "India", sortOrder: 1, status: "active" }).success).toBe(true);
    expect(locationSchema.safeParse({ code: "", name: "", sortOrder: 1, status: "active" }).success).toBe(false);
  });
});
