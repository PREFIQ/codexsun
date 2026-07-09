import { cityDefinition } from "../shared/location.definitions";
import { LocationForm } from "../shared/location.form";
import type { CitySavePayload } from "./city.types";

export function CityForm({ onSubmit, value }: { onSubmit: (value: CitySavePayload) => void; value: CitySavePayload }) {
  return <LocationForm definition={cityDefinition} onSubmit={onSubmit} value={value} />;
}

