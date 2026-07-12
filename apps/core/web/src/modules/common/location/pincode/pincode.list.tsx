import { StatusBadge } from "@codexsun/ui";
import type { Pincode } from "./pincode.types";

export function PincodeList({ onSelect, pincodes }: { onSelect: (pincode: Pincode) => void; pincodes: Pincode[] }) {
  if (!pincodes.length) return <div className="location-empty">No pincode records found.</div>;
  return <div className="location-table-scroll"><table className="location-table"><thead><tr><th>Pincode</th><th>Area</th><th>City</th><th>State</th><th>Status</th></tr></thead><tbody>
    {pincodes.map((pincode) => <tr key={pincode.id} onClick={() => onSelect(pincode)}><td className="location-primary">{pincode.pincode ?? "-"}</td><td>{pincode.areaName ?? "-"}</td><td>{pincode.cityName ?? "-"}</td><td>{pincode.stateName ?? "-"}</td><td><StatusBadge tone={pincode.status === "active" ? "green" : "neutral"}>{pincode.status}</StatusBadge></td></tr>)}
  </tbody></table></div>;
}
