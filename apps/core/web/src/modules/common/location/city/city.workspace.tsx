import { cityDefinition } from "../shared/location.definitions";
import { LocationWorkspace } from "../shared/location.workspace";

export function CityWorkspace() {
  return <LocationWorkspace definition={cityDefinition} />;
}

