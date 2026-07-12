import { StatusBadge } from "@codexsun/ui";
import type { District } from "./district.types";

export function DistrictList({ districts, onSelect }: { districts: District[]; onSelect: (district: District) => void }) {
  if (!districts.length) return <div className="location-empty">No district records found.</div>;
  return <div className="location-table-scroll"><table className="location-table"><thead><tr><th>Name</th><th>State</th><th>Country</th><th>Status</th></tr></thead><tbody>
    {districts.map((district) => <tr key={district.id} onClick={() => onSelect(district)}><td className="location-primary">{district.name}</td><td>{district.stateName ?? "-"}</td><td>{district.countryName ?? "-"}</td><td><StatusBadge tone={district.status === "active" ? "green" : "neutral"}>{district.status}</StatusBadge></td></tr>)}
  </tbody></table></div>;
}
