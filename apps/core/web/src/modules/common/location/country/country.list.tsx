import { countryDefinition } from "../shared/location.definitions";
import { LocationList } from "../shared/location.list";
import type { Country } from "./country.types";

export function CountryList({ countries, onSelect }: { countries: Country[]; onSelect: (country: Country) => void }) {
  return <LocationList definition={countryDefinition} onSelect={onSelect} records={countries} />;
}

