import { describe, expect, it } from "vitest";
import { prioritiesDefinition } from "./priorities.definition";
describe("Priorities", () => { it("keeps an independent frontend route", () => expect(prioritiesDefinition.route).toContain("others")); });
