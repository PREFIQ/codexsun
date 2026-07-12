import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import {
  WorkspaceStatusBadge,
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel
} from "@codexsun/ui/workspace";
import type { AccountsReportsOverview } from "./accounts.types";

export function AccountsReportsWorkspace({
  loading,
  onRefresh,
  reports
}: {
  loading: boolean;
  onRefresh: () => void;
  reports: AccountsReportsOverview | undefined;
}) {
  const trialBalance = reports?.trialBalance ?? [];
  const outstanding = reports?.outstanding ?? [];
  const gst = reports?.gst ?? [];
  const profitAndLoss = reports?.profitAndLoss ?? [];
  const balanceSheet = reports?.balanceSheet ?? [];
  const voucherRegister = reports?.voucherRegister ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">Accounts Reports</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Trial balance, outstanding, GST, profit and loss, balance sheet, and voucher register.
          </p>
        </div>
        <Button type="button" variant="outline" disabled={loading} onClick={onRefresh}>
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Trial balance rows" value={String(trialBalance.length)} />
        <Metric title="Outstanding parties" value={String(outstanding.length)} />
        <Metric title="GST ledgers" value={String(gst.length)} />
        <Metric title="Vouchers" value={String(voucherRegister.length)} />
      </div>
      <SimpleTable
        empty="No trial balance rows found."
        headers={["Ledger", "Group", "Debit", "Credit", "Closing"]}
        rows={trialBalance.map((row) => [
          row.ledgerName,
          row.groupName,
          money(row.debit),
          money(row.credit),
          money(row.closingBalance)
        ])}
        title="Trial Balance"
      />
      <SimpleTable
        empty="No outstanding balances found."
        headers={["Party", "Type", "Balance"]}
        rows={outstanding.map((row) => [
          row.ledgerName,
          <WorkspaceStatusBadge
            key={row.ledgerId}
            label={row.classification}
            tone={row.classification === "customer" ? "info" : "warning"}
          />,
          money(row.balance)
        ])}
        title="Receivables And Payables"
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <SimpleTable
          empty="No GST movement found."
          headers={["Ledger", "Debit", "Credit", "Net"]}
          rows={gst.map((row) => [
            row.ledgerName,
            money(row.debit),
            money(row.credit),
            money(row.net)
          ])}
          title="GST Summary"
        />
        <SimpleTable
          empty="No P&L rows found."
          headers={["Group", "Nature", "Amount"]}
          rows={profitAndLoss.map((row) => [row.groupName, row.nature, money(row.amount)])}
          title="Profit And Loss"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <SimpleTable
          empty="No balance sheet rows found."
          headers={["Group", "Nature", "Amount"]}
          rows={balanceSheet.map((row) => [row.groupName, row.nature, money(row.amount)])}
          title="Balance Sheet"
        />
        <SimpleTable
          empty="No vouchers found."
          headers={["Voucher", "Date", "Type", "Debit", "Credit", "Tally"]}
          rows={voucherRegister
            .slice(0, 10)
            .map((row) => [
              row.voucherNo,
              row.voucherDate,
              row.voucherType,
              money(row.totalDebit),
              money(row.totalCredit),
              row.tallySyncStatus
            ])}
          title="Voucher Register"
        />
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <div className="text-2xl font-semibold tracking-normal">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{title}</div>
    </div>
  );
}

function SimpleTable({
  empty,
  headers,
  rows,
  title
}: {
  empty: string;
  headers: string[];
  rows: ReactNode[][];
  title: string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold tracking-normal">{title}</h3>
      <WorkspaceTablePanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-muted/45">
              <tr>
                {headers.map((header) => (
                  <WorkspaceTableHeaderCell key={header}>{header}</WorkspaceTableHeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr className="border-b border-border/70 last:border-0" key={index}>
                  {row.map((cell, cellIndex) => (
                    <td className="px-4 py-2.5" key={cellIndex}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length ? <WorkspaceTableEmptyState>{empty}</WorkspaceTableEmptyState> : null}
      </WorkspaceTablePanel>
    </div>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}
