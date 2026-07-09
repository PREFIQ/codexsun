import { WorkspaceStatusBadge, WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel } from "@codexsun/ui/workspace";
import type { EntryRecord } from "./entries.types";

export function EntriesList({ entries, loading, onOpen }: { entries: EntryRecord[]; loading: boolean; onOpen: (entry: EntryRecord) => void }) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead className="bg-muted/45">
            <tr>
              <WorkspaceTableHeaderCell>Document</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Date</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Customer</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Total</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Balance</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr className="cursor-pointer border-b border-border/70 last:border-0 hover:bg-muted/35" key={entry.id} onClick={() => onOpen(entry)}>
                <td className="px-4 py-2.5 font-semibold">{entry.documentNo}</td>
                <td className="px-4 py-2.5">{formatDate(entry.documentDate)}</td>
                <td className="px-4 py-2.5">{entry.customerName}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(entry.grandTotal)}</td>
                <td className="px-4 py-2.5"><WorkspaceStatusBadge label={entry.status} tone={entry.status === "posted" ? "success" : entry.status === "cancelled" ? "danger" : "warning"} /></td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(entry.balanceAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!entries.length && !loading ? <WorkspaceTableEmptyState>No entries found.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Number(value || 0));
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}
