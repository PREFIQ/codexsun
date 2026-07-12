import { StatusBadge } from "@codexsun/ui";
import type { State } from "./state.types";

export function StateList({ onSelect, states }: { onSelect: (state: State) => void; states: State[] }) {
  if (!states.length) return <div className="location-empty">No state records found.</div>;
  return <div className="location-table-scroll"><table className="location-table"><thead><tr><th>Name</th><th>GST code</th><th>Short code</th><th>Country</th><th>Status</th></tr></thead><tbody>
    {states.map((state) => <tr key={state.id} onClick={() => onSelect(state)}><td className="location-primary">{state.name}</td><td>{state.gstStateCode ?? "-"}</td><td>{state.shortCode ?? "-"}</td><td>{state.countryName ?? "-"}</td><td><StatusBadge tone={state.status === "active" ? "green" : "neutral"}>{state.status}</StatusBadge></td></tr>)}
  </tbody></table></div>;
}
