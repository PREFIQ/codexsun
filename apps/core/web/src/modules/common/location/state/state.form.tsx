import { stateDefinition } from "../shared/location.definitions";
import { LocationForm } from "../shared/location.form";
import type { StateSavePayload } from "./state.types";

export function StateForm({ onSubmit, value }: { onSubmit: (value: StateSavePayload) => void; value: StateSavePayload }) {
  return <LocationForm definition={stateDefinition} onSubmit={onSubmit} value={value} />;
}

