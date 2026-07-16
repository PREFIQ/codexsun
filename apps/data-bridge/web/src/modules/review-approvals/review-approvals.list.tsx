import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel
} from "@codexsun/ui/workspace/table";
import type { ReviewApproval } from "./review-approvals.types";
export function ReviewApprovalsList({
  records,
  loading,
  onView
}: {
  records: ReviewApproval[];
  loading: boolean;
  onView: (record: ReviewApproval) => void;
}) {
  return (
    <WorkspaceTablePanel>
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <WorkspaceTableHeaderCell>Reference</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Plan</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Tenant</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Source rows</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Readiness</WorkspaceTableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="cursor-pointer border-b last:border-0"
              onClick={() => onView(record)}
            >
              <td className="px-4 py-2.5 font-mono text-xs">RV-{record.id}</td>
              <td className="px-4 py-2.5 font-medium">{record.planName}</td>
              <td className="px-4 py-2.5">{record.tenant}</td>
              <td className="px-4 py-2.5">{record.totalSourceRows}</td>
              <td className="px-4 py-2.5">
                <WorkspaceStatusBadge
                  label={record.dryRunSucceeded ? "ready" : "blocked"}
                  tone={record.dryRunSucceeded ? "success" : "danger"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!records.length ? (
        <WorkspaceTableEmptyState>
          {loading ? "Loading reviews..." : "No review packages prepared."}
        </WorkspaceTableEmptyState>
      ) : null}
    </WorkspaceTablePanel>
  );
}
