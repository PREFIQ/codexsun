import { describe, expect, it } from "vitest";
import { locationDefinitions } from "./location.definitions";
describe("platform location definitions", () => {
  it("keeps five independent location routes", () => expect(Object.keys(locationDefinitions)).toHaveLength(5));

  it("keeps the tenant country list focused on its primary fields", () => {
    expect(locationDefinitions.country.columns).toEqual([
      { key: "name", label: "Country" },
      { key: "code", label: "Country code" },
      { key: "status", label: "Status" }
    ]);
  });

  it("keeps the tenant state list focused on GST and country context", () => {
    expect(locationDefinitions.state.columns).toEqual([
      { key: "name", label: "State" },
      { key: "gstStateCode", label: "GST State code" },
      { key: "countryName", label: "Country" },
      { key: "status", label: "Status" }
    ]);
  });
});
