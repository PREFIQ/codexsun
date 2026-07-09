import { Pencil, Plus } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceRowActions, WorkspaceStatusBadge, WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel } from "@codexsun/ui/workspace";
import type { Ledger, Voucher } from "./accounts.types";

export function LedgersList({ ledgers, loading, onEdit }: { ledgers: Ledger[]; loading: boolean; onEdit: (ledger: Ledger) => void }) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] border-collapse text-sm">
          <thead className="bg-muted/45">
            <tr>
              <WorkspaceTableHeaderCell>Code</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Ledger</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Group</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Class</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Debit</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Credit</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Closing</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {ledgers.map((ledger) => (
              <tr className="border-b border-border/70 last:border-0" key={ledger.id}>
                <td className="px-4 py-2.5 font-mono text-xs">{ledger.code}</td>
                <td className="px-4 py-2.5 font-medium">{ledger.name}</td>
                <td className="px-4 py-2.5">{ledger.groupName}</td>
                <td className="px-4 py-2.5">{ledger.classification.replace("_", " ")}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(ledger.currentDebit)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(ledger.currentCredit)}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{money(ledger.closingBalance)}</td>
                <td className="px-4 py-2.5"><WorkspaceStatusBadge label={ledger.status} tone={ledger.status === "active" ? "success" : "neutral"} /></td>
                <td className="px-4 py-2.5 text-right">
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(ledger)}><Pencil className="size-3.5" />Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!ledgers.length && !loading ? <WorkspaceTableEmptyState>No ledgers found.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}

export function VouchersList({ loading, onNew, vouchers }: { loading: boolean; onNew: () => void; vouchers: Voucher[] }) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-muted/45">
            <tr>
              <WorkspaceTableHeaderCell>Voucher</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Date</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Type</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Source</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Debit</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Credit</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Tally</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((voucher) => (
              <tr className="border-b border-border/70 last:border-0" key={voucher.id}>
                <td className="px-4 py-2.5 font-semibold">{voucher.voucherNo}</td>
                <td className="px-4 py-2.5">{formatDate(voucher.voucherDate)}</td>
                <td className="px-4 py-2.5">{voucher.voucherType.replace("_", " ")}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{voucher.sourceDocumentNo ?? voucher.sourceApp ?? "-"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(voucher.totalDebit)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(voucher.totalCredit)}</td>
                <td className="px-4 py-2.5"><WorkspaceStatusBadge label={voucher.tallySyncStatus} tone={voucher.tallySyncStatus === "synced" ? "success" : voucher.tallySyncStatus === "failed" ? "danger" : "warning"} /></td>
                <td className="px-4 py-2.5"><WorkspaceStatusBadge label={voucher.status} tone={voucher.status === "posted" ? "success" : voucher.status === "cancelled" || voucher.status === "reversed" ? "danger" : "warning"} /></td>
                <td className="px-4 py-2.5 text-right"><WorkspaceRowActions onView={() => undefined} onEdit={onNew} title={voucher.voucherNo} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!vouchers.length && !loading ? <WorkspaceTableEmptyState>No vouchers found. Billing postings and manual vouchers will appear here.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}

export function NewButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button type="button" onClick={onClick}><Plus className="size-4" />{label}</Button>;
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Number(value || 0));
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}
