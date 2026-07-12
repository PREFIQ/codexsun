import { Link } from "@tanstack/react-router";
import { MapPinnedIcon, RefreshCwIcon } from "lucide-react";
import { Button, Card, StatusBadge } from "@codexsun/ui";
import { PageTitle } from "../../../../shared/document/PageTitle";
import { StateList } from "./state.list";
import { useStates } from "./state.hooks";

export function StateWorkspace() {
  const states = useStates();
  return <main className="core-shell"><PageTitle title="State Master" /><header className="core-toolbar"><div><StatusBadge tone="blue">Common / Location</StatusBadge><h1>State Master</h1><p>Manage states with their country and GST references.</p></div><div className="core-actions"><Button asChild variant="outline"><Link to="/">Core Home</Link></Button><Button onClick={() => void states.refetch()} variant="outline"><RefreshCwIcon size={16} />Refresh</Button></div></header><StateNavigation /><Card className="location-panel"><div className="location-panel-header"><div><MapPinnedIcon size={20} /><strong>State records</strong></div><StatusBadge tone={states.isError ? "red" : "green"}>{states.isError ? "API offline" : "Ready"}</StatusBadge></div>{states.isLoading ? <div className="location-empty">Loading state records...</div> : states.isError ? <div className="location-empty">State records could not be loaded.</div> : <StateList states={states.data ?? []} onSelect={() => undefined} />}</Card></main>;
}
function StateNavigation() { return <nav className="core-actions"><Button asChild variant="outline"><Link to="/core/common/location/countries">Country</Link></Button><Button asChild><Link to="/core/common/location/states">State</Link></Button><Button asChild variant="outline"><Link to="/core/common/location/districts">District</Link></Button><Button asChild variant="outline"><Link to="/core/common/location/cities">City</Link></Button><Button asChild variant="outline"><Link to="/core/common/location/pincodes">Pincode</Link></Button></nav>; }
