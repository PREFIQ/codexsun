import { describe, expect, it } from "vitest";
import { commonMasterSchema } from "./common-master.schema";
describe("common master schema", () => { it("accepts a module payload", () => expect(commonMasterSchema.safeParse({ name: "General", isActive: true }).success).toBe(true)); });
