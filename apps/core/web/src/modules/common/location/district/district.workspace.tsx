import { districtDefinition } from "../shared/location.definitions";
import { LocationMasterShell } from "../shared/location.workspace";

export function DistrictWorkspace() {
  return <LocationMasterShell definition={districtDefinition} />;
}

