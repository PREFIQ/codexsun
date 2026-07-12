import { StatusBadge } from "@codexsun/ui";
import type { City } from "./city.types";

export function CityList({ cities, onSelect }: { cities: City[]; onSelect: (city: City) => void }) {
  if (!cities.length) return <div className="location-empty">No city records found.</div>;
  return <div className="location-table-scroll"><table className="location-table"><thead><tr><th>Name</th><th>District</th><th>State</th><th>Country</th><th>Status</th></tr></thead><tbody>
    {cities.map((city) => <tr key={city.id} onClick={() => onSelect(city)}><td className="location-primary">{city.name}</td><td>{city.districtName ?? "-"}</td><td>{city.stateName ?? "-"}</td><td>{city.countryName ?? "-"}</td><td><StatusBadge tone={city.status === "active" ? "green" : "neutral"}>{city.status}</StatusBadge></td></tr>)}
  </tbody></table></div>;
}
