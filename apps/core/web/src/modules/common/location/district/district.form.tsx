import { districtDefinition } from "../shared/location.definitions";
import { LocationForm } from "../shared/location.form";
import type { DistrictSavePayload } from "./district.types";

export function DistrictForm({
  onSubmit,
  value
}: {
  onSubmit: (value: DistrictSavePayload) => void;
  value: DistrictSavePayload;
}) {
  return <LocationForm definition={districtDefinition} onSubmit={onSubmit} value={value} />;
}

