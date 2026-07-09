import { pincodeDefinition } from "../shared/location.definitions";
import { LocationForm } from "../shared/location.form";
import type { PincodeSavePayload } from "./pincode.types";

export function PincodeForm({ onSubmit, value }: { onSubmit: (value: PincodeSavePayload) => void; value: PincodeSavePayload }) {
  return <LocationForm definition={pincodeDefinition} onSubmit={onSubmit} value={value} />;
}

