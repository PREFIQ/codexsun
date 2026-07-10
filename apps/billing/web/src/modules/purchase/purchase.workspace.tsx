import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceTableEmptyState, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { cn } from "@codexsun/ui/lib/utils";
import { useBillingSettings } from "../settings";
import { defaultBillingSettings } from "../settings/settings.types";
import { usePurchaseList } from "./purchase.hooks";
import { PurchaseUpsertPage } from "./purchase.form";
import { PurchaseList } from "./purchase.list";
import { createPurchase, formatMoney, setPurchaseStatus, updatePurchase } from "./purchase.services";
import { PurchaseShowPage } from "./purchase.show";
import type { Purchase, PurchaseView, PurchaseSavePayload } from "./purchase.types";

const filterOptions = [
  { id: "all", label: "All purchases" },
  { id: "draft", label: "Draft" },
  { id: "confirmed", label: "Confirmed" },
  { id: "cancelled", label: "Cancelled" },
];

const columnOptions = [
  { id: "invoice", label: "Invoice" },
  { id: "date", label: "Date" },
  { id: "customer", label: "Supplier" },
  { id: "items", label: "Items" },
  { id: "subtotal", label: "Subtotal" },
  { id: "tax", label: "Tax" },
  { id: "total", label: "Grand Total" },
  { id: "status", label: "Status" },
];

export function PurchaseWorkspace() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<PurchaseView>({ mode: "list" });
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    customer: true,
    date: true,
    invoice: true,
    items: true,
    status: true,
    subtotal: true,
    tax: true,
    total: true,
  });
  const purchaseQuery = usePurchaseList();
  const settingsQuery = useBillingSettings();
  const billingSettings = settingsQuery.data ?? defaultBillingSettings;
  const purchaseLayout = billingSettings.layout;

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: PurchaseSavePayload }) => id ? updatePurchase(id, payload) : createPurchase(payload),
    onSuccess: async (purchase) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "purchase"] });
      toast.success(view.mode === "upsert" && view.sale ? "Purchase updated" : "Purchase created", {
        description: `${purchase.invoiceNumber} is ready in the purchase workspace.`,
      });
      setView({ mode: "show", sale: purchase });
    },
    onError: (error) => {
      toast.error("Purchase save failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "cancelled" | "confirmed" }) => setPurchaseStatus(id, status),
    onSuccess: async (purchase) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "purchase"] });
      toast.success("Purchase status updated", { description: `${purchase.invoiceNumber} is now ${purchase.status}.` });
      setView((current) => current.mode === "show" ? { mode: "show", sale: purchase } : current);
    },
    onError: (error) => {
      toast.error("Status update failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const entries = purchaseQuery.data ?? [];
  const filteredEntries = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return entries.filter((purchase) => {
      const matchesSearch =
        !term ||
        [
          purchase.invoiceNumber,
          purchase.customerName,
          purchase.customerEmail,
          purchase.customerPhone,
          purchase.issuedOn,
          purchase.status,
          String(purchase.amount),
        ].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || purchase.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [entries, searchValue, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / rowsPerPage));
  const pageEntries = filteredEntries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  function openPrintPage(purchase: Purchase) {
    window.open(`/billing/purchase/print?id=${encodeURIComponent(purchase.id)}`, "_blank", "noopener,noreferrer");
  }

  if (view.mode === "show") {
    const freshPurchase = entries.find((entry) => entry.id === view.sale.id) ?? view.sale;
    return (
      <PurchaseShowPage
        sale={freshPurchase}
        onBack={() => setView({ mode: "list" })}
        onEdit={() => setView({ mode: "upsert", sale: freshPurchase, returnTo: "show" })}
        onNew={() => setView({ mode: "upsert", sale: null, returnTo: "list" })}
        onPrint={() => openPrintPage(freshPurchase)}
      />
    );
  }

  if (view.mode === "upsert") {
    return (
      <PurchaseUpsertPage
        purchase={view.sale}
        errorMessage={saveMutation.error instanceof Error ? saveMutation.error.message : ""}
        loading={saveMutation.isPending}
        onBack={() => setView(view.returnTo === "show" && view.sale ? { mode: "show", sale: view.sale } : { mode: "list" })}
        onSubmit={(payload) => saveMutation.mutate(view.sale ? { id: view.sale.id, payload } : { payload })}
        settings={purchaseLayout}
        numbering={billingSettings.numbering.purchase}
      />
    );
  }

  return (
    <WorkspacePage
      title="Purchase"
      description="Purchase workspace with list, show, upsert, and print-ready bill previews."
      technicalName="page.billing.purchase.list"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" disabled={purchaseQuery.isFetching} onClick={() => void purchaseQuery.refetch()}>
            <RefreshCw className={cn("size-4", purchaseQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", sale: null, returnTo: "list" })}>
            <Plus className="size-4" />
            New purchase
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        columnOptions={columnOptions.map((column) => ({
          ...column,
          checked: visibleColumns[column.id] ?? true,
          disabled: column.id === "invoice",
          onCheckedChange: (checked) => setVisibleColumns((current) => ({ ...current, [column.id]: checked })),
        }))}
        filterOptions={filterOptions}
        filterValue={statusFilter}
        onFilterValueChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}
        onSearchValueChange={(value) => {
          setSearchValue(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search purchase, supplier, phone, email, date, or total"
        searchValue={searchValue}
        onShowAllColumns={() => setVisibleColumns(Object.fromEntries(columnOptions.map((column) => [column.id, true])))}
        toolbarAction={
          <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Total value: {formatMoney(filteredEntries.reduce((sum, purchase) => sum + purchase.amount, 0))}
          </div>
        }
      />
      {purchaseQuery.isError ? (
        <WorkspaceTablePanel>
          <WorkspaceTableEmptyState>
            {purchaseQuery.error instanceof Error ? purchaseQuery.error.message : "Purchases could not be loaded."}
          </WorkspaceTableEmptyState>
        </WorkspaceTablePanel>
      ) : null}
      <PurchaseList
        currentPage={currentPage}
        entries={pageEntries}
        loading={purchaseQuery.isLoading}
        onEdit={(sale) => setView({ mode: "upsert", sale, returnTo: "list" })}
        onPrint={openPrintPage}
        onSetStatus={(sale, status) => statusMutation.mutate({ id: sale.id, status })}
        onView={(sale) => setView({ mode: "show", sale })}
        rowsPerPage={rowsPerPage}
        visibleColumns={visibleColumns}
      />
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filteredEntries.length)}
        singularLabel="purchases"
        totalCount={filteredEntries.length}
        totalPages={totalPages}
        onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        onPageChange={setCurrentPage}
        onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setCurrentPage(1);
        }}
      />
    </WorkspacePage>
  );
}
