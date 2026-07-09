import { describe, expect, it } from "vitest";
import { payloadFromForm, validateProjectManagerForm } from "./project-manager.schema";

describe("project manager form", () => {
  it("requires a key and title", () => {
    expect(validateProjectManagerForm({ assignee: "", description: "", dueDate: "", key: "", lane: "", moduleKey: "", priority: "medium", referenceId: "", referenceType: "", sortOrder: "0", status: "", title: "", type: "" })).toBe("Key is required.");
  });

  it("normalizes numeric sort order", () => {
    expect(payloadFromForm({ assignee: "", description: "", dueDate: "", key: "task.demo", lane: "", moduleKey: "", priority: "medium", referenceId: "", referenceType: "", sortOrder: "42", status: "", title: "Demo", type: "" }).sortOrder).toBe(42);
  });
});
