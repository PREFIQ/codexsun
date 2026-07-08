import { describe, expect, it } from "vitest";
import { countrySchema } from "./country.schema";

describe("country schema", () => {
  it("requires ISO codes", () => {
    expect(countrySchema.safeParse({}).success).toBe(false);
  });
});
