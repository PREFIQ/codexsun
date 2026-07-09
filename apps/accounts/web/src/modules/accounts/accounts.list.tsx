import { WorkspaceStatusBadge } from "@codexsun/ui/workspace";

export function AccountsModuleList({ page = "overview" }: { page?: "overview" | "ledgers" | "vouchers" | "reports" | "settings" }) {
  const cards: Array<[string, string]> = page === "overview"
    ? [
        ["Ledgers", "Groups, classifications, opening balances, and Tally ledger names."],
        ["Vouchers", "Balanced double-entry vouchers ready for billing postings."],
        ["Reports", "Trial balance, GST, outstanding, P&L, and balance sheet."],
        ["Settings", "Posting rules, numbering, financial year, and Tally sync."]
      ]
    : detailsFor(page);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(([title, description]) => <Status key={title} description={description} title={title} />)}
    </div>
  );
}

function Status({ description, title }: { description: string; title: string }) {
  return (
    <div className="min-h-32 rounded-md border bg-card p-4 text-sm shadow-sm">
      <div className="font-semibold">{title}</div>
      <p className="mt-2 leading-5 text-muted-foreground">{description}</p>
      <div className="mt-4"><WorkspaceStatusBadge label="Ready" tone="success" /></div>
    </div>
  );
}

function detailsFor(page: "overview" | "ledgers" | "vouchers" | "reports" | "settings"): Array<[string, string]> {
  if (page === "ledgers") return [["Account Groups", "Asset, liability, income, expense, and capital groups."], ["Ledgers", "Customer, supplier, sales, tax, cash, bank, and adjustment ledgers."], ["Opening Balances", "Opening debit or credit values before voucher posting."]];
  if (page === "vouchers") return [["All Vouchers", "Sales, receipt, payment, journal, debit note, and credit note entries."], ["Balanced Posting", "Every voucher must pass debit equals credit validation."], ["Source Tracking", "Billing-created vouchers retain source document references."]];
  if (page === "reports") return [["Trial Balance", "Ledger-wise debit, credit, and closing balance."], ["Outstanding", "Customer and supplier remaining balances."], ["Financial Statements", "Profit and loss plus balance sheet views."]];
  if (page === "settings") return [["Financial Year", "Start date, end date, and period lock policy."], ["Posting Rules", "Save, update, delete, and reversal behavior."], ["Tally Integration", "Company, URL, sync mode, and export readiness."]];
  return [];
}
