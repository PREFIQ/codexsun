import { Link } from "@tanstack/react-router";
import { MapPinnedIcon, RefreshCwIcon } from "lucide-react";
import { Button, Card, StatusBadge } from "@codexsun/ui";
import { PageTitle } from "../../../../shared/document/PageTitle";
import { PincodeList } from "./pincode.list";
import { usePincodes } from "./pincode.hooks";

export function PincodeWorkspace() {
  const pincodes = usePincodes();
  return <main className="core-shell"><PageTitle title="Pincode Master" /><header className="core-toolbar"><div><StatusBadge tone="blue">Common / Location</StatusBadge><h1>Pincode Master</h1><p>Manage pincodes with area, city, and state references.</p></div><div className="core-actions"><Button asChild variant="outline"><Link to="/">Core Home</Link></Button><Button onClick={() => void pincodes.refetch()} variant="outline"><RefreshCwIcon size={16} />Refresh</Button></div></header><PincodeNavigation /><Card className="location-panel"><div className="location-panel-header"><div><MapPinnedIcon size={20} /><strong>Pincode records</strong></div><StatusBadge tone={pincodes.isError ? "red" : "green"}>{pincodes.isError ? "API offline" : "Ready"}</StatusBadge></div>{pincodes.isLoading ? <div className="location-empty">Loading pincode records...</div> : pincodes.isError ? <div className="location-empty">Pincode records could not be loaded.</div> : <PincodeList pincodes={pincodes.data ?? []} onSelect={() => undefined} />}</Card></main>;
}
function PincodeNavigation() { return <nav className="core-actions"><Button asChild variant="outline"><Link to="/core/common/location/countries">Country</Link></Button><Button asChild variant="outline"><Link to="/core/common/location/states">State</Link></Button><Button asChild variant="outline"><Link to="/core/common/location/districts">District</Link></Button><Button asChild variant="outline"><Link to="/core/common/location/cities">City</Link></Button><Button asChild><Link to="/core/common/location/pincodes">Pincode</Link></Button></nav>; }
