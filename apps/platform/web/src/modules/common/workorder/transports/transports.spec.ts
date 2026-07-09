import { describe, expect, it } from "vitest";
import { transportsDefinition } from "./transports.definition";
describe("Transports", () => { it("keeps an independent frontend route", () => expect(transportsDefinition.route).toContain("workorder")); });
