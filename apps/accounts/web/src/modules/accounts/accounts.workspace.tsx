import { useMemo, useState } from "react";
import { BookOpenCheck, FileText, Landmark, Plus, RefreshCw, WalletCards } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters, WorkspacePage, WorkspacePagination, buildShowingLabel } from "@codexsun/ui/workspace";
import { Card, StatusBadge } from "@codexsun/ui";
import { createLedger, createVoucher, updateLedger } from "./accounts.services";
import { useAccountGroups, useAccountsReports, useLedgers, useVouchers } from "./accounts.hooks";
import { LedgerForm, VoucherForm } from "./accounts.form";
import { LedgersList, NewButton, VouchersList } from "./accounts.list";
import { AccountsReportsWorkspace } from "./accounts.reports";
import type { AccountsView, Ledger, LedgerSavePayload, VoucherSavePayload } from "./accounts.types";

export function AccountsWorkspace({ page = "overview" }: { page?: "overview" | "ledgers" | "vouchers" | "reports" | "settings" }) {
  const initialMode = page === "ledgers" ? "ledgers" : page === "vouchers" ? "vouchers" : page === "reports" ? "reports" : "overview";
  const [view, setView] = useState<AccountsView>({ mode: initialMode });
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const groupsQuery = useAccountGroups();
  const ledgersQuery = useLedgers(search);
  const vouchersQuery = useVouchers(search);
  const reportsQuery = useAccountsReports();

  const ledgerMutation = useMutation({
    mutationFn: ({ ledger, payload }: { ledger: Ledger | null; payload: LedgerSavePayload }) => ledger ? updateLedger(ledger.id, payload) : createLedger(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Ledger saved");
      setView({ mode: "ledgers" });
    }
  });
  const voucherMutation = useMutation({
    mutationFn: (payload: VoucherSavePayload) => createVoucher(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts", "vouchers"] });
      toast.success("Voucher posted");
      setView({ mode: "vouchers" });
    }
  });

  if (view.mode === "ledger-upsert") {
    return (
      <LedgerForm
        groups={groupsQuery.data ?? []}
        ledger={view.ledger}
        loading={ledgerMutation.isPending}
        saveError={ledgerMutation.error instanceof Error ? ledgerMutation.error.message : ""}
        onBack={() => setView({ mode: "ledgers" })}
        onSave={(payload) => ledgerMutation.mutate({ ledger: view.ledger, payload })}
      />
    );
  }

  if (view.mode === "voucher-upsert") {
    return (
      <VoucherForm
        ledgers={(ledgersQuery.data ?? []).filter((ledger) => ledger.status === "active")}
        loading={voucherMutation.isPending}
        saveError={voucherMutation.error instanceof Error ? voucherMutation.error.message : ""}
        onBack={() => setView({ mode: "vouchers" })}
        onSave={(payload) => voucherMutation.mutate(payload)}
      />
    );
  }

  if (view.mode === "ledgers") {
    const ledgers = ledgersQuery.data ?? [];
    return (
      <WorkspacePage title="Ledgers" description="Accounts ledgers with group, classification, balance, and Tally-ready names." actions={<NewButton label="New ledger" onClick={() => setView({ mode: "ledger-upsert", ledger: null })} />}>
        <WorkspaceFilters searchPlaceholder="Search ledger, code, group, or classification" searchValue={search} onSearchValueChange={(value) => { setSearch(value); setCurrentPage(1); }} />
        <LedgersList ledgers={pageRows(ledgers, currentPage, rowsPerPage)} loading={ledgersQuery.isLoading} onEdit={(ledger) => setView({ mode: "ledger-upsert", ledger })} />
        <WorkspacePagination page={currentPage} rowsPerPage={rowsPerPage} showingLabel={buildShowingLabel(currentPage, rowsPerPage, ledgers.length)} singularLabel="ledger" totalCount={ledgers.length} totalPages={Math.max(1, Math.ceil(ledgers.length / rowsPerPage))} onNextPage={() => setCurrentPage((pageNo) => pageNo + 1)} onPageChange={setCurrentPage} onPreviousPage={() => setCurrentPage((pageNo) => Math.max(1, pageNo - 1))} onRowsPerPageChange={setRowsPerPage} />
      </WorkspacePage>
    );
  }

  if (view.mode === "vouchers") {
    const vouchers = vouchersQuery.data ?? [];
    return (
      <WorkspacePage title="Vouchers" description="Balanced double-entry vouchers from billing postings and manual accounts entries." actions={<NewButton label="New voucher" onClick={() => setView({ mode: "voucher-upsert" })} />}>
        <WorkspaceFilters searchPlaceholder="Search voucher, source document, type, or status" searchValue={search} onSearchValueChange={(value) => { setSearch(value); setCurrentPage(1); }} />
        <VouchersList vouchers={pageRows(vouchers, currentPage, rowsPerPage)} loading={vouchersQuery.isLoading} onNew={() => setView({ mode: "voucher-upsert" })} />
        <WorkspacePagination page={currentPage} rowsPerPage={rowsPerPage} showingLabel={buildShowingLabel(currentPage, rowsPerPage, vouchers.length)} singularLabel="voucher" totalCount={vouchers.length} totalPages={Math.max(1, Math.ceil(vouchers.length / rowsPerPage))} onNextPage={() => setCurrentPage((pageNo) => pageNo + 1)} onPageChange={setCurrentPage} onPreviousPage={() => setCurrentPage((pageNo) => Math.max(1, pageNo - 1))} onRowsPerPageChange={setRowsPerPage} />
      </WorkspacePage>
    );
  }

  if (view.mode === "reports") {
    return (
      <WorkspacePage title="Reports" description="Accounts reports generated from ledger and voucher postings.">
        <AccountsReportsWorkspace reports={reportsQuery.data} loading={reportsQuery.isFetching} onRefresh={() => void reportsQuery.refetch()} />
      </WorkspacePage>
    );
  }

  return <AccountsOverview onOpen={(mode) => setView({ mode })} ledgers={ledgersQuery.data ?? []} vouchers={vouchersQuery.data ?? []} refreshing={ledgersQuery.isFetching || vouchersQuery.isFetching} onRefresh={() => { void ledgersQuery.refetch(); void vouchersQuery.refetch(); }} />;
}

function AccountsOverview({ ledgers, onOpen, onRefresh, refreshing, vouchers }: { ledgers: Ledger[]; onOpen: (mode: "ledgers" | "vouchers") => void; onRefresh: () => void; refreshing: boolean; vouchers: { status: string }[] }) {
  const totals = useMemo(() => ({
    credit: ledgers.reduce((sum, ledger) => sum + ledger.currentCredit, 0),
    debit: ledgers.reduce((sum, ledger) => sum + ledger.currentDebit, 0),
    ledgers: ledgers.length,
    posted: vouchers.filter((voucher) => voucher.status === "posted").length
  }), [ledgers, vouchers]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border bg-card p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground">Accounts</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">Accounts Desk</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">Ledgers, vouchers, double-entry postings, balances, reports, and Tally-ready accounting output.</p>
        </div>
        <Button type="button" variant="outline" onClick={onRefresh} disabled={refreshing}><RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} />Refresh</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <AccountsMetric title="Ledgers" value={String(totals.ledgers)} icon={Landmark} />
        <AccountsMetric title="Posted vouchers" value={String(totals.posted)} icon={FileText} />
        <AccountsMetric title="Debit total" value={money(totals.debit)} icon={WalletCards} />
        <AccountsMetric title="Credit total" value={money(totals.credit)} icon={BookOpenCheck} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Ledgers" description="Create account ledgers and inspect debit, credit, and closing balances.">
          <div className="flex items-center justify-between gap-3"><StatusBadge tone="green">Double entry ready</StatusBadge><Button type="button" onClick={() => onOpen("ledgers")}><Plus className="size-4" />Open</Button></div>
        </Card>
        <Card title="Vouchers" description="Review billing postings and create manual balanced vouchers.">
          <div className="flex items-center justify-between gap-3"><StatusBadge tone="blue">Tally ready</StatusBadge><Button type="button" onClick={() => onOpen("vouchers")}><Plus className="size-4" />Open</Button></div>
        </Card>
      </div>
    </section>
  );
}

function AccountsMetric({ icon: Icon, title, value }: { icon: typeof Landmark; title: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-5 shadow-sm">
      <Icon className="size-5 text-muted-foreground" />
      <div className="mt-5 text-2xl font-semibold tracking-normal">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{title}</div>
    </div>
  );
}

function pageRows<T>(rows: T[], page: number, rowsPerPage: number) {
  return rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Number(value || 0));
}
