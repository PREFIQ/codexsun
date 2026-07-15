import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel
} from "@codexsun/ui/workspace/table";
import type { ExecutionRun } from "./execution-runs.types";
export function ExecutionRunsList({
  records,
  loading,
  onView
}: {
  records: ExecutionRun[];
  loading: boolean;
  onView: (run: ExecutionRun) => void;
}) {
  return (
    <WorkspaceTablePanel>
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <WorkspaceTableHeaderCell>Run</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Transfer</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Tenant</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Progress</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {records.map((run) => {
            const total = run.tables.reduce((sum, item) => sum + item.totalRows, 0);
            const done = run.tables.reduce((sum, item) => sum + item.checkpoint, 0);
            return (
              <tr
                key={run.id}
                className="cursor-pointer border-b last:border-0"
                onClick={() => onView(run)}
              >
                <td className="px-4 py-2.5 font-mono text-xs">EX-{run.id}</td>
                <td className="px-4 py-2.5 font-medium">{run.name}</td>
                <td className="px-4 py-2.5">{run.tenant}</td>
                <td className="px-4 py-2.5">
                  {done} / {total}
                </td>
                <td className="px-4 py-2.5">
                  <WorkspaceStatusBadge
                    label={run.status}
                    tone={
                      run.status === "completed"
                        ? "success"
                        : run.status === "blocked" || run.status === "failed"
                          ? "danger"
                          : run.status === "running"
                            ? "info"
                            : "warning"
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!records.length ? (
        <WorkspaceTableEmptyState>
          {loading ? "Loading execution runs..." : "No execution runs queued."}
        </WorkspaceTableEmptyState>
      ) : null}
    </WorkspaceTablePanel>
  );
}
