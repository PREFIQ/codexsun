import { cityDefinition } from "../shared/location.definitions";
import { LocationList } from "../shared/location.list";
import type { City } from "./city.types";

export function CityList({ cities, onSelect }: { cities: City[]; onSelect: (city: City) => void }) {
  return <LocationList definition={cityDefinition} onSelect={onSelect} records={cities} />;
}

