import { Link } from "@tanstack/react-router";
import { MapPinnedIcon, RefreshCwIcon } from "lucide-react";
import { Button, Card, StatusBadge } from "@codexsun/ui";
import { PageTitle } from "../../../../shared/document/PageTitle";
import { CityList } from "./city.list";
import { useCities } from "./city.hooks";

export function CityWorkspace() {
  const cities = useCities();
  return <main className="core-shell"><PageTitle title="City Master" /><header className="core-toolbar"><div><StatusBadge tone="blue">Common / Location</StatusBadge><h1>City Master</h1><p>Manage cities with district, state, and country references.</p></div><div className="core-actions"><Button asChild variant="outline"><Link to="/">Core Home</Link></Button><Button onClick={() => void cities.refetch()} variant="outline"><RefreshCwIcon size={16} />Refresh</Button></div></header><CityNavigation /><Card className="location-panel"><div className="location-panel-header"><div><MapPinnedIcon size={20} /><strong>City records</strong></div><StatusBadge tone={cities.isError ? "red" : "green"}>{cities.isError ? "API offline" : "Ready"}</StatusBadge></div>{cities.isLoading ? <div className="location-empty">Loading city records...</div> : cities.isError ? <div className="location-empty">City records could not be loaded.</div> : <CityList cities={cities.data ?? []} onSelect={() => undefined} />}</Card></main>;
}
function CityNavigation() { return <nav className="core-actions"><Button asChild variant="outline"><Link to="/core/common/location/countries">Country</Link></Button><Button asChild variant="outline"><Link to="/core/common/location/states">State</Link></Button><Button asChild variant="outline"><Link to="/core/common/location/districts">District</Link></Button><Button asChild><Link to="/core/common/location/cities">City</Link></Button><Button asChild variant="outline"><Link to="/core/common/location/pincodes">Pincode</Link></Button></nav>; }
