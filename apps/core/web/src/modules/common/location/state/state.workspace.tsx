import { stateDefinition } from "../shared/location.definitions";
import { LocationMasterShell } from "../shared/location.workspace";

export function StateWorkspace() {
  return <LocationMasterShell definition={stateDefinition} />;
}

