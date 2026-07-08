import { describe, expect, it } from "vitest";
import { planNeedsSync } from "./plan.sync.js";
describe("plan module", () => { it("detects newer server plans", () => expect(planNeedsSync(1, 2)).toBe(true)); });
