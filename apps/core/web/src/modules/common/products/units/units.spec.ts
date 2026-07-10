import { describe, expect, it } from "vitest";
import { unitsDefinition } from "./units.definition";
describe("Units", () => { it("keeps an independent frontend route", () => expect(unitsDefinition.route).toContain("products")); });
