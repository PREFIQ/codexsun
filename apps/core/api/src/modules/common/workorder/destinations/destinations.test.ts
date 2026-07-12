import { describe, expect, it } from "vitest";
import { destinationsDefinition } from "./destinations.definition.js";
describe("Destinations", () => { it("owns an independent table and required fields", () => { expect(destinationsDefinition.tableName).toBe("destinations"); expect(destinationsDefinition.fields.filter((field) => field.required).length).toBeGreaterThan(0); }); });
