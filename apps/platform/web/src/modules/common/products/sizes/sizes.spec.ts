import { describe, expect, it } from "vitest";
import { sizesDefinition } from "./sizes.definition";
describe("Sizes", () => { it("keeps an independent frontend route", () => expect(sizesDefinition.route).toContain("products")); });
