import { pincodeDefinition } from "../shared/location.definitions";
import { LocationWorkspace } from "../shared/location.workspace";

export function PincodeWorkspace() {
  return <LocationWorkspace definition={pincodeDefinition} />;
}

