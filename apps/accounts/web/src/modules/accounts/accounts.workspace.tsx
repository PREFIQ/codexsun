import { WorkspacePage } from "@codexsun/ui/workspace";
import { AccountsModuleList } from "./accounts.list";

export function AccountsWorkspace() {
  return (
    <WorkspacePage title="Accounts" description="Ledgers, vouchers, balanced posting, and Tally-ready accounting ownership.">
      <AccountsModuleList />
    </WorkspacePage>
  );
}
