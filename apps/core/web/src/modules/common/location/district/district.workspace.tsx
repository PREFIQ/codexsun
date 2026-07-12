import { Link } from "@tanstack/react-router";
import { MapPinnedIcon, RefreshCwIcon } from "lucide-react";
import { Button, Card, StatusBadge } from "@codexsun/ui";
import { PageTitle } from "../../../../shared/document/PageTitle";
import { DistrictList } from "./district.list";
import { useDistricts } from "./district.hooks";

export function DistrictWorkspace() {
  const districts = useDistricts();
  return <main className="core-shell"><PageTitle title="District Master" /><header className="core-toolbar"><div><StatusBadge tone="blue">Common / Location</StatusBadge><h1>District Master</h1><p>Manage districts with their state and country hierarchy.</p></div><div className="core-actions"><Button asChild variant="outline"><Link to="/">Core Home</Link></Button><Button onClick={() => void districts.refetch()} variant="outline"><RefreshCwIcon size={16} />Refresh</Button></div></header><DistrictNavigation /><Card className="location-panel"><div className="location-panel-header"><div><MapPinnedIcon size={20} /><strong>District records</strong></div><StatusBadge tone={districts.isError ? "red" : "green"}>{districts.isError ? "API offline" : "Ready"}</StatusBadge></div>{districts.isLoading ? <div className="location-empty">Loading district records...</div> : districts.isError ? <div className="location-empty">District records could not be loaded.</div> : <DistrictList districts={districts.data ?? []} onSelect={() => undefined} />}</Card></main>;
}
function DistrictNavigation() { return <nav className="core-actions"><Button asChild variant="outline"><Link to="/core/common/location/countries">Country</Link></Button><Button asChild variant="outline"><Link to="/core/common/location/states">State</Link></Button><Button asChild><Link to="/core/common/location/districts">District</Link></Button><Button asChild variant="outline"><Link to="/core/common/location/cities">City</Link></Button><Button asChild variant="outline"><Link to="/core/common/location/pincodes">Pincode</Link></Button></nav>; }
