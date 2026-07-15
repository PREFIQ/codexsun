import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel
} from "@codexsun/ui/workspace/table";
import type { MigrationJob } from "./migration-manager.types";
export function MigrationManagerList({
  jobs,
  loading,
  onView,
  onEdit
}: {
  jobs: MigrationJob[];
  loading: boolean;
  onView: (job: MigrationJob) => void;
  onEdit: (job: MigrationJob) => void;
}) {
  return (
    <WorkspaceTablePanel>
      <table className="w-full min-w-[800px] text-sm">
        <thead className="bg-muted/50">
          <tr>
            <WorkspaceTableHeaderCell>Reference</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Job</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Tenant</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Source</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Target</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Action</WorkspaceTableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="cursor-pointer border-b last:border-0"
              onClick={() => onView(job)}
            >
              <td className="px-4 py-2.5 font-mono text-xs">MJ-{job.id}</td>
              <td className="px-4 py-2.5 font-medium">{job.name}</td>
              <td className="px-4 py-2.5">{job.tenant}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{job.source.database}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{job.target.database}</td>
              <td className="px-4 py-2.5">
                <WorkspaceStatusBadge
                  label={job.status}
                  tone={
                    job.status === "completed" || job.status === "ready"
                      ? "success"
                      : job.status === "failed"
                        ? "danger"
                        : "warning"
                  }
                />
              </td>
              <td className="px-4 py-2.5" onClick={(event) => event.stopPropagation()}>
                <WorkspaceRowActions
                  title={job.name}
                  onView={() => onView(job)}
                  onEdit={() => onEdit(job)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!jobs.length ? (
        <WorkspaceTableEmptyState>
          {loading ? "Loading migration jobs..." : "No migration jobs found."}
        </WorkspaceTableEmptyState>
      ) : null}
    </WorkspaceTablePanel>
  );
}
