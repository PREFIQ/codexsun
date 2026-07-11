import { describe, expect, it } from "vitest";
import { migrationConnectionSchema } from "./migration-projects.schema";
describe("migration project form", () => { it("requires tenant-scoped connection metadata", () => { expect(migrationConnectionSchema.safeParse({}).success).toBe(false); }); });
