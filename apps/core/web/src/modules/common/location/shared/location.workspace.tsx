import { Link } from "@tanstack/react-router";
import { MapPinnedIcon, RefreshCwIcon } from "lucide-react";
import { Button, Card, StatusBadge } from "@codexsun/ui";
import { PageTitle } from "../../../../shared/document/PageTitle";
import { LocationList } from "./location.list";
import { locationDefinitions } from "./location.definitions";
import { useLocationRecords } from "./location.hooks";
import type { LocationDefinition } from "./location.types";

export function LocationMasterShell({ definition }: { definition: LocationDefinition }) {
  const records = useLocationRecords(definition);

  return (
    <main className="core-shell">
      <PageTitle title={`${definition.label} Master`} />
      <header className="core-toolbar">
        <div>
          <StatusBadge tone="blue">Common / Location</StatusBadge>
          <h1>{definition.label} Master</h1>
          <p>Tenant-aware shared reference data for country, state, district, city, and pincode workflows.</p>
        </div>
        <div className="core-actions">
          <Button asChild variant="outline">
            <Link to="/">Core Home</Link>
          </Button>
          <Button onClick={() => void records.refetch()} variant="outline">
            <RefreshCwIcon size={16} />
            Refresh
          </Button>
        </div>
      </header>

      <nav className="core-actions">
        {locationDefinitions.map((item) => (
          <Button asChild key={item.kind} variant={item.kind === definition.kind ? "default" : "outline"}>
            <Link to={item.routePath}>{item.label}</Link>
          </Button>
        ))}
      </nav>

      <Card className="country-panel">
        <div className="country-panel-header">
          <div>
            <MapPinnedIcon size={20} />
            <strong>{definition.label} records</strong>
          </div>
          <StatusBadge tone={records.isError ? "red" : "green"}>{records.isError ? "API offline" : "Ready"}</StatusBadge>
        </div>

        {records.isLoading ? (
          <div className="country-empty">Loading {definition.label.toLowerCase()} records...</div>
        ) : records.isError ? (
          <div className="country-empty">Core API is not reachable. Start `@codexsun/core-api` and refresh.</div>
        ) : (
          <LocationList definition={definition} onSelect={() => undefined} records={records.data ?? []} />
        )}
      </Card>
    </main>
  );
}

