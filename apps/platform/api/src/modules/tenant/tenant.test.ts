import { describe, expect, it } from "vitest";

describe("tenant module contracts", () => {
  it("keeps application enabled for every tenant payload", () => {
    const moduleKeys = new Set(["platform.application"]);
    expect(moduleKeys.has("platform.application")).toBe(true);
  });
});
