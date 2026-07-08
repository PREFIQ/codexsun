import { describe, expect, it } from "vitest";
import { validateActivity } from "./platform-activity.service.js";
import { platformActivityNeedsSync } from "./platform-activity.sync.js";

describe("platform activity", () => {
  it("validates required activity fields", () => {
    expect(() => validateActivity({ action: "changed", moduleKey: "platform.plan", recordLabel: "Starter" })).not.toThrow();
  });

  it("detects activity sync changes", () => {
    expect(platformActivityNeedsSync(1, 2)).toBe(true);
  });
});
