import { describe, expect, it } from "vitest";
import { queueJobAction } from "./queue-management.schema";

describe("queue management", () => {
  it("requires a positive queue job id", () => {
    expect(() => queueJobAction(0)).toThrow();
    expect(queueJobAction(10).id).toBe(10);
  });
});
