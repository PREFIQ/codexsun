import { StatusBadge } from "@codexsun/ui";
import type { Country } from "./country.types";

export function CountryList({ countries, onSelect }: { countries: Country[]; onSelect: (country: Country) => void }) {
  return (
    <div className="country-table" role="table">
      <div className="country-row country-row-head" role="row">
        <span>Name</span><span>ISO</span><span>Dial</span><span>Currency</span><span>Status</span>
      </div>
      {countries.map((country) => (
        <button className="country-row w-full text-left" key={country.id} onClick={() => onSelect(country)} role="row" type="button">
          <span><strong>{country.name}</strong><small>{country.capital ?? "No capital set"}</small></span>
          <span>{country.iso2} / {country.iso3}</span><span>{country.dialCode}</span><span>{country.currencyCode}</span>
          <span><StatusBadge tone={country.status === "active" ? "green" : "neutral"}>{country.status}</StatusBadge></span>
        </button>
      ))}
    </div>
  );
}
