import { describe, expect, it } from "vitest";
import { brandsDefinition } from "./brands.definition";
describe("Brands", () => { it("keeps an independent frontend route", () => expect(brandsDefinition.route).toContain("products")); });
