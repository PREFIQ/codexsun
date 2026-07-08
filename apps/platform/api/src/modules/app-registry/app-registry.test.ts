import { describe, expect, it } from "vitest";
import { resolveEnabledApps, resolveLandingApp } from "./app-registry.service.js";

describe("app registry", () => {
  it("keeps application enabled and billing switchable", () => {
    expect(resolveEnabledApps([]).map((app) => [app.appId, app.enabled])).toEqual([
      ["application", true],
      ["billing", false]
    ]);
    expect(resolveLandingApp("billing", ["billing.sales"])).toBe("billing");
  });
});
