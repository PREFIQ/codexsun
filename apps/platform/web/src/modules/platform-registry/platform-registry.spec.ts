import { describe, expect, it } from "vitest";
import { platformRegistrySchema } from "./platform-registry.schema";

describe("platform registry validation", () => {
  it("requires a key and name", () => {
    expect(platformRegistrySchema.safeParse({ key: "", name: "" }).success).toBe(false);
  });

  it("accepts an active registry payload", () => {
    expect(platformRegistrySchema.safeParse({ active: true, key: "platform.admin", name: "Admin" }).success).toBe(true);
  });
});
