import { Link } from "@tanstack/react-router";
import { Globe2Icon, RefreshCwIcon } from "lucide-react";
import { Button, Card, StatusBadge } from "@codexsun/ui";
import { PageTitle } from "../../shared/document/PageTitle";
import { useCountries } from "./country.hooks";

export function CountryPage() {
  const countries = useCountries();

  return (
    <main className="core-shell">
      <PageTitle title="Country Master" />
      <header className="core-toolbar">
        <div>
          <StatusBadge tone="blue">Core Module</StatusBadge>
          <h1>Country Master</h1>
          <p>Manage the shared country records used across platform and tenant apps.</p>
        </div>
        <div className="core-actions">
          <Button asChild variant="outline">
            <Link to="/">Core Home</Link>
          </Button>
          <Button onClick={() => void countries.refetch()} variant="outline">
            <RefreshCwIcon size={16} />
            Refresh
          </Button>
        </div>
      </header>

      <Card className="country-panel">
        <div className="country-panel-header">
          <div>
            <Globe2Icon size={20} />
            <strong>Countries</strong>
          </div>
          <StatusBadge tone={countries.isError ? "red" : "green"}>
            {countries.isError ? "API offline" : "Ready"}
          </StatusBadge>
        </div>

        {countries.isLoading ? (
          <div className="country-empty">Loading country records...</div>
        ) : countries.isError ? (
          <div className="country-empty">Core API is not reachable. Start `@codexsun/core-api` and refresh.</div>
        ) : (
          <div className="country-table" role="table">
            <div className="country-row country-row-head" role="row">
              <span>Name</span>
              <span>ISO</span>
              <span>Dial</span>
              <span>Currency</span>
              <span>Status</span>
            </div>
            {countries.data?.map((country) => (
              <div className="country-row" key={country.id} role="row">
                <span>
                  <strong>{country.name}</strong>
                  <small>{country.capital ?? "No capital set"}</small>
                </span>
                <span>{country.iso2} / {country.iso3}</span>
                <span>{country.dialCode}</span>
                <span>{country.currencyCode}</span>
                <span>
                  <StatusBadge tone={country.status === "active" ? "green" : "neutral"}>{country.status}</StatusBadge>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
