import { describe, expect, it } from "vitest";
import { orchestratedAppIdSchema } from "./app-orchestration.schema";
describe("app operations", () => {
  it("accepts repository app ids", () =>
    expect(orchestratedAppIdSchema.safeParse("kitchen-serve").success).toBe(true));
});
