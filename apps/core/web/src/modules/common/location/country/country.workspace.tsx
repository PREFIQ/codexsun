import { countryDefinition } from "../shared/location.definitions";
import { LocationWorkspace } from "../shared/location.workspace";

export function CountryWorkspace() {
  return <LocationWorkspace definition={countryDefinition} />;
}

