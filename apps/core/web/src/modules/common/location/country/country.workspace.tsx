import { countryDefinition } from "../shared/location.definitions";
import { LocationMasterShell } from "../shared/location.workspace";

export function CountryWorkspace() {
  return <LocationMasterShell definition={countryDefinition} />;
}

