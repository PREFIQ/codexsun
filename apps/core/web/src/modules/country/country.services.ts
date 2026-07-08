import { coreApiGet } from "../../shared/api/core-api";
import type { Country } from "./country.types";

export function listCountries() {
  return coreApiGet<Country[]>("/core/countries");
}
