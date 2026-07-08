import { formatDistanceToNow } from "date-fns";
import { BanIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import { StatusBadge } from "@codexsun/ui";
import { Button } from "@codexsun/ui/components/button";
import type { QueueJobRecord, QueueRuntimeSettings } from "./queue-management.types";

export function QueueManagementList({
  busy,
  jobs,
  settings,
  onCancel,
  onRetry,
  onRun
}: {
  busy: boolean;
  jobs: QueueJobRecord[];
  settings: QueueRuntimeSettings | undefined;
  onCancel: (id: number) => void;
  onRetry: (id: number) => void;
  onRun: (id: number) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Backend" value={settings?.backendLabel ?? "Database queue"} />
        <MetricCard label="Pending" value={String(settings?.pending ?? jobs.filter((job) => job.status === "pending").length)} />
        <MetricCard label="Running" value={String(settings?.running ?? jobs.filter((job) => job.status === "running").length)} />
        <MetricCard label="Failed" value={String(settings?.failed ?? jobs.filter((job) => job.status === "failed").length)} />
        <MetricCard label="Completed" value={String(settings?.completed ?? jobs.filter((job) => job.status === "completed").length)} />
      </div>
      <div className="overflow-x-auto rounded-md border bg-card shadow-sm">
        <table className="w-full min-w-[1120px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Job</th>
              <th className="px-4 py-3 text-left font-semibold">Queue</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Attempts</th>
              <th className="px-4 py-3 text-left font-semibold">Tenant</th>
              <th className="px-4 py-3 text-left font-semibold">Correlation</th>
              <th className="px-4 py-3 text-left font-semibold">Updated</th>
              <th className="px-4 py-3 text-right font-semibold">Controls</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr className="border-t align-top" key={job.uuid}>
                <td className="px-4 py-3">
                  <div className="font-medium">{job.jobName}</div>
                  <div className="text-muted-foreground">{job.sourceModule}</div>
                  {job.errorMessage ? <div className="mt-1 text-xs text-destructive">{job.errorMessage}</div> : null}
                </td>
                <td className="px-4 py-3">{job.queueName}</td>
                <td className="px-4 py-3"><StatusBadge tone={statusTone(job.status)}>{job.status}</StatusBadge></td>
                <td className="px-4 py-3">{job.attempts}/{job.maxAttempts}</td>
                <td className="px-4 py-3 text-muted-foreground">{job.tenantId ?? "platform"}</td>
                <td className="px-4 py-3 text-muted-foreground">{job.correlationId ?? "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button disabled={busy || (job.status !== "pending" && job.status !== "failed")} size="sm" onClick={() => onRun(job.id)}>
                      <PlayIcon className="size-4" />Run
                    </Button>
                    <Button disabled={busy || (job.status !== "failed" && job.status !== "cancelled")} size="sm" variant="outline" onClick={() => onRetry(job.id)}>
                      <RotateCcwIcon className="size-4" />Retry
                    </Button>
                    <Button disabled={busy || (job.status !== "pending" && job.status !== "failed")} size="sm" variant="outline" onClick={() => onCancel(job.id)}>
                      <BanIcon className="size-4" />Cancel
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 ? <div className="px-4 py-8 text-center text-sm text-muted-foreground">No queue jobs found.</div> : null}
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-5 shadow-sm">
      <div className="text-xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function statusTone(status: QueueJobRecord["status"]) {
  if (status === "completed") return "green";
  if (status === "failed" || status === "cancelled") return "red";
  return "blue";
}
