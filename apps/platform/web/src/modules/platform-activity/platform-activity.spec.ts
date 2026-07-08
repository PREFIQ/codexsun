import { describe, expect, it } from "vitest";
import { activityLabel, platformActivitySchema } from "./platform-activity.schema";

describe("platform activity", () => {
  it("validates activity shape", () => {
    expect(platformActivitySchema.safeParse({ action: "plan-access.saved", moduleKey: "platform.plan-access", recordLabel: "Starter" }).success).toBe(true);
  });

  it("formats activity labels", () => {
    expect(activityLabel("plan-access.saved")).toBe("Plan-access Saved");
  });
});
