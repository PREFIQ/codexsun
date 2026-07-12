import { StatusBadge } from "@codexsun/ui";
import type { Country } from "./country.types";

export function CountryList({ countries, onSelect }: { countries: Country[]; onSelect: (country: Country) => void }) {
  if (!countries.length) return <div className="location-empty">No country records found.</div>;
  return <div className="location-table-scroll"><table className="location-table"><thead><tr><th>Name</th><th>ISO2</th><th>Dial code</th><th>Currency</th><th>Status</th></tr></thead><tbody>
    {countries.map((country) => <tr key={country.id} onClick={() => onSelect(country)}><td className="location-primary">{country.name}</td><td>{country.iso2 ?? "-"}</td><td>{country.dialCode ?? "-"}</td><td>{country.currencyCode ?? "-"}</td><td><StatusBadge tone={country.status === "active" ? "green" : "neutral"}>{country.status}</StatusBadge></td></tr>)}
  </tbody></table></div>;
}
