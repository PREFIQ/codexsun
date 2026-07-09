import { WorkspaceStatusBadge } from "@codexsun/ui/workspace";

export function AccountsModuleList() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Status title="Ledgers" />
      <Status title="Vouchers" />
      <Status title="Tally Ready" />
    </div>
  );
}

function Status({ title }: { title: string }) {
  return <div className="rounded-md border bg-card p-4 text-sm font-medium">{title}<div className="mt-3"><WorkspaceStatusBadge label="Ready" tone="success" /></div></div>;
}
