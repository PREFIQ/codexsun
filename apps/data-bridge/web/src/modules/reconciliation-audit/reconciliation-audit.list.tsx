import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel
} from "@codexsun/ui/workspace/table";
import type { ReconciliationReport } from "./reconciliation-audit.types";
export function ReconciliationAuditList({
  records,
  loading,
  onView
}: {
  records: ReconciliationReport[];
  loading: boolean;
  onView: (report: ReconciliationReport) => void;
}) {
  return (
    <WorkspaceTablePanel>
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <WorkspaceTableHeaderCell>Report</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Transfer</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Tenant</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Exceptions</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {records.map((report) => (
            <tr
              key={report.id}
              className="cursor-pointer border-b last:border-0"
              onClick={() => onView(report)}
            >
              <td className="px-4 py-2.5 font-mono text-xs">RC-{report.id}</td>
              <td className="px-4 py-2.5 font-medium">{report.name}</td>
              <td className="px-4 py-2.5">{report.tenant}</td>
              <td className="px-4 py-2.5">
                {report.exceptions.filter((item) => item.status === "open").length} open
              </td>
              <td className="px-4 py-2.5">
                <WorkspaceStatusBadge
                  label={report.status}
                  tone={
                    report.status === "signed_off"
                      ? "success"
                      : report.status === "needs_attention"
                        ? "danger"
                        : "warning"
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!records.length ? (
        <WorkspaceTableEmptyState>
          {loading ? "Loading reports..." : "No reconciliation reports generated."}
        </WorkspaceTableEmptyState>
      ) : null}
    </WorkspaceTablePanel>
  );
}
