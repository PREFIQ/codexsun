import { describe, expect, it } from "vitest"; import { planSchema } from "./plan.schema";
describe("plan form", () => { it("rejects negative prices", () => expect(planSchema.safeParse({ monthlyPrice: -1 }).success).toBe(false)); });
