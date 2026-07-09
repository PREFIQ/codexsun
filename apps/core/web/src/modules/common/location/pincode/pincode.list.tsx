import { pincodeDefinition } from "../shared/location.definitions";
import { LocationList } from "../shared/location.list";
import type { Pincode } from "./pincode.types";

export function PincodeList({ onSelect, pincodes }: { onSelect: (pincode: Pincode) => void; pincodes: Pincode[] }) {
  return <LocationList definition={pincodeDefinition} onSelect={onSelect} records={pincodes} />;
}

