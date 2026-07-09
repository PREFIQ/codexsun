import { WorkspacePage } from "@codexsun/ui/workspace";
import { AccountsModuleList } from "./accounts.list";

export function AccountsWorkspace({ page = "overview" }: { page?: "overview" | "ledgers" | "vouchers" | "reports" | "settings" }) {
  return (
    <WorkspacePage title={titleForPage(page)} description={descriptionForPage(page)}>
      <AccountsModuleList page={page} />
    </WorkspacePage>
  );
}

function titleForPage(page: "overview" | "ledgers" | "vouchers" | "reports" | "settings") {
  if (page === "ledgers") return "Ledgers";
  if (page === "vouchers") return "Vouchers";
  if (page === "reports") return "Reports";
  if (page === "settings") return "Accounts Settings";
  return "Accounts";
}

function descriptionForPage(page: "overview" | "ledgers" | "vouchers" | "reports" | "settings") {
  if (page === "ledgers") return "Account groups, ledgers, classifications, opening balances, and Tally ledger names.";
  if (page === "vouchers") return "Manual and backend-created double-entry vouchers with balanced debit and credit totals.";
  if (page === "reports") return "Trial balance, ledger statement, outstanding, GST, profit and loss, and balance sheet reports.";
  if (page === "settings") return "Financial year, posting rules, voucher numbering, period locks, and Tally integration settings.";
  return "Ledgers, vouchers, balanced posting, and Tally-ready accounting ownership.";
}
