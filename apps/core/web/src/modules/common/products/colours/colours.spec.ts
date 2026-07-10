import { describe, expect, it } from "vitest";
import { coloursDefinition } from "./colours.definition";
describe("Colours", () => { it("keeps an independent frontend route", () => expect(coloursDefinition.route).toContain("products")); });
