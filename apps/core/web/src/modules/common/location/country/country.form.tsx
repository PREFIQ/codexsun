import { countryDefinition } from "../shared/location.definitions";
import { LocationForm } from "../shared/location.form";
import type { CountrySavePayload } from "./country.types";

export function CountryForm({ onSubmit, value }: { onSubmit: (value: CountrySavePayload) => void; value: CountrySavePayload }) {
  return <LocationForm definition={countryDefinition} onSubmit={onSubmit} value={value} />;
}

