import { formatDistanceToNow } from "date-fns";
import { DownloadIcon, RotateCcwIcon, UploadIcon } from "lucide-react";
import { StatusBadge } from "@codexsun/ui";
import { Button } from "@codexsun/ui/components/button";
import type { TenantDatabaseStatus } from "./tenant-database.types";

export function TenantDatabaseList({
  busy,
  records,
  onBackup,
  onMigrate,
  onRestore
}: {
  busy: boolean;
  records: TenantDatabaseStatus[];
  onBackup: (tenantId: number) => void;
  onMigrate: (tenantId: number) => void;
  onRestore: (tenantId: number) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Tenant databases" value={String(records.length)} />
        <MetricCard label="Online" value={String(records.filter((record) => record.status === "online").length)} />
        <MetricCard label="Pending runs" value={String(records.flatMap((record) => record.runs).filter((run) => run.status === "requested" || run.status === "running").length)} />
      </div>
      <div className="overflow-x-auto rounded-md border bg-card shadow-sm">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Tenant</th>
              <th className="px-4 py-3 text-left font-semibold">Database</th>
              <th className="px-4 py-3 text-left font-semibold">Live</th>
              <th className="px-4 py-3 text-left font-semibold">Version</th>
              <th className="px-4 py-3 text-left font-semibold">Tables</th>
              <th className="px-4 py-3 text-left font-semibold">Migrations</th>
              <th className="px-4 py-3 text-left font-semibold">Last run</th>
              <th className="px-4 py-3 text-right font-semibold">Tools</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const lastRun = record.runs[0];
              return (
                <tr className="border-t align-top" key={record.tenantId}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{record.tenantName}</div>
                    <div className="text-muted-foreground">{record.tenantCode}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{record.databaseName}</div>
                    <div className="text-muted-foreground">{record.host}:{record.port}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge tone={record.status === "online" ? "green" : "red"}>{record.status}</StatusBadge></td>
                  <td className="px-4 py-3 text-muted-foreground">{record.version}</td>
                  <td className="px-4 py-3">{record.tableCount}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{record.migrations.length}</div>
                    <div className="text-muted-foreground">{record.migrations[0]?.name ?? "No migration row"}</div>
                  </td>
                  <td className="px-4 py-3">
                    {lastRun ? (
                      <>
                        <div className="font-medium">{lastRun.operation}</div>
                        <div className="text-muted-foreground">{formatDistanceToNow(new Date(lastRun.createdAt), { addSuffix: true })}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No runs</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button disabled={busy} size="sm" variant="outline" onClick={() => onBackup(record.tenantId)}>
                        <DownloadIcon className="size-4" />Backup
                      </Button>
                      <Button disabled={busy} size="sm" variant="outline" onClick={() => onRestore(record.tenantId)}>
                        <UploadIcon className="size-4" />Restore
                      </Button>
                      <Button disabled={busy} size="sm" onClick={() => onMigrate(record.tenantId)}>
                        <RotateCcwIcon className="size-4" />Migrate
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {records.length === 0 ? <div className="px-4 py-8 text-center text-sm text-muted-foreground">No tenant databases found.</div> : null}
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-5 shadow-sm">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
