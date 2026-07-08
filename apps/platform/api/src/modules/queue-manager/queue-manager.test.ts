import { describe, expect, it } from "vitest";
import { queueJobNeedsSync } from "./queue-manager.sync.js";
import { queueJobCanRunInline } from "./queue-manager.worker.js";

describe("queue manager", () => {
  it("detects stale queue views", () => {
    expect(queueJobNeedsSync(1, 2)).toBe(true);
  });

  it("allows pending and failed jobs to run inline", () => {
    expect(queueJobCanRunInline({ status: "pending" } as Parameters<typeof queueJobCanRunInline>[0])).toBe(true);
    expect(queueJobCanRunInline({ status: "completed" } as Parameters<typeof queueJobCanRunInline>[0])).toBe(false);
  });
});
