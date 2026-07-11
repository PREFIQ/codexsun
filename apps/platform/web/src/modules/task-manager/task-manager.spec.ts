import { describe, expect, it } from "vitest";
import { taskManagerSchema } from "./task-manager.schema";
describe("task manager", () => { it("requires a Todo title", () => expect(taskManagerSchema.required).toContain("title")); });
