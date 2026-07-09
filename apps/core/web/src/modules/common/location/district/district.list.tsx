import { districtDefinition } from "../shared/location.definitions";
import { LocationList } from "../shared/location.list";
import type { District } from "./district.types";

export function DistrictList({ districts, onSelect }: { districts: District[]; onSelect: (district: District) => void }) {
  return <LocationList definition={districtDefinition} onSelect={onSelect} records={districts} />;
}

