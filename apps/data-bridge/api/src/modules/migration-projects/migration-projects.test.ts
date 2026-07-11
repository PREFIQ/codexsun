import { describe, expect, it } from "vitest";
import { MigrationProjectsService } from "./migration-projects.service.js";

describe("migration projects", () => {
  it("keeps execution disabled and approval gated in the scaffold", () => {
    const workflow = new MigrationProjectsService().getWorkflow();
    expect(workflow.guardrails.executionEnabled).toBe(false);
    expect(workflow.guardrails.approvalRequired).toBe(true);
  });
  it("rejects execution without every safety gate", () => {
    const result = new MigrationProjectsService().assertExecutionGate({
      dryRunPassed: false,
      status: "draft"
    });
    expect(result.allowed).toBe(false);
    expect(result.failures).toHaveLength(5);
  });

  it("allows only the controlled lifecycle", () => {
    expect(new MigrationProjectsService().allowedTransitions("approved")).toEqual([
      "running",
      "blocked"
    ]);
    expect(new MigrationProjectsService().allowedTransitions("completed")).toEqual([]);
  });
});
