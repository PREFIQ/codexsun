import { describe, expect, it } from "vitest";
import { destinationsDefinition } from "./destinations.definition";
describe("Destinations", () => { it("keeps an independent frontend route", () => expect(destinationsDefinition.route).toContain("workorder")); });
