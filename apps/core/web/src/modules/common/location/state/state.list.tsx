import { stateDefinition } from "../shared/location.definitions";
import { LocationList } from "../shared/location.list";
import type { State } from "./state.types";

export function StateList({ onSelect, states }: { onSelect: (state: State) => void; states: State[] }) {
  return <LocationList definition={stateDefinition} onSelect={onSelect} records={states} />;
}

