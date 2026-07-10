import { pincodeDefinition } from "../shared/location.definitions";
import { LocationMasterShell } from "../shared/location.workspace";

export function PincodeWorkspace() {
  return <LocationMasterShell definition={pincodeDefinition} />;
}

