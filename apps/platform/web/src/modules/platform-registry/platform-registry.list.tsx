import { WorkspaceStatusBadge } from "@codexsun/ui/workspace";
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import type { PlatformRegistryRow } from "./platform-registry.types";

export function PlatformRegistryList({ loading, rows }: { loading: boolean; rows: PlatformRegistryRow[] }) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-muted/45">
            <tr>
              <WorkspaceTableHeaderCell>Name</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Key</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Kind</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Parent</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-border/70 last:border-0" key={`${row.kind}:${row.id}`}>
                <td className="px-4 py-2.5 font-medium">{row.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{row.key}</td>
                <td className="px-4 py-2.5 capitalize">{row.kind}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{row.parentName ?? "-"}</td>
                <td className="px-4 py-2.5"><WorkspaceStatusBadge label={row.status} tone={row.active ? "success" : "neutral"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && !loading ? <WorkspaceTableEmptyState>No registry rows found.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}
