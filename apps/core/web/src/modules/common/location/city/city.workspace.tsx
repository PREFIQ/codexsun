import { cityDefinition } from "../shared/location.definitions";
import { LocationMasterShell } from "../shared/location.workspace";

export function CityWorkspace() {
  return <LocationMasterShell definition={cityDefinition} />;
}

