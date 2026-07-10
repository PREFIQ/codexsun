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
import { useExportSalesList } from "./export-sales.hooks";
import { ExportSalesUpsertPage } from "./export-sales.form";
import { ExportSalesList } from "./export-sales.list";
import { createExportSale, formatMoney, setExportSaleStatus, updateExportSale } from "./export-sales.services";
import { ExportSalesShowPage } from "./export-sales.show";
import type { ExportSale, ExportSalesView, ExportSaleSavePayload } from "./export-sales.types";

const filterOptions = [
  { id: "all", label: "All export sales" },
  { id: "draft", label: "Draft" },
  { id: "confirmed", label: "Confirmed" },
  { id: "cancelled", label: "Cancelled" },
];

const columnOptions = [
  { id: "invoice", label: "Invoice" },
  { id: "date", label: "Date" },
  { id: "customer", label: "Customer" },
  { id: "items", label: "Items" },
  { id: "subtotal", label: "Subtotal" },
  { id: "tax", label: "Tax" },
  { id: "total", label: "Grand Total" },
  { id: "status", label: "Status" },
];

export function ExportSalesWorkspace() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ExportSalesView>({ mode: "list" });
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
  const exportSalesQuery = useExportSalesList();
  const settingsQuery = useBillingSettings();
  const billingSettings = settingsQuery.data ?? defaultBillingSettings;
  const exportSalesLayout = billingSettings.layout;

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: ExportSaleSavePayload }) => id ? updateExportSale(id, payload) : createExportSale(payload),
    onSuccess: async (sale) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "export-sales"] });
      toast.success(view.mode === "upsert" && view.sale ? "Export sales updated" : "Export sales created", {
        description: `${sale.invoiceNumber} is ready in the export sales workspace.`,
      });
      setView({ mode: "show", sale });
    },
    onError: (error) => {
      toast.error("Export sales save failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "cancelled" | "confirmed" }) => setExportSaleStatus(id, status),
    onSuccess: async (sale) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "export-sales"] });
      toast.success("Export sales status updated", { description: `${sale.invoiceNumber} is now ${sale.status}.` });
      setView((current) => current.mode === "show" ? { mode: "show", sale } : current);
    },
    onError: (error) => {
      toast.error("Status update failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const entries = exportSalesQuery.data ?? [];
  const filteredEntries = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return entries.filter((sale) => {
      const matchesSearch =
        !term ||
        [
          sale.invoiceNumber,
          sale.customerName,
          sale.customerEmail,
          sale.customerPhone,
          sale.issuedOn,
          sale.status,
          String(sale.amount),
        ].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [entries, searchValue, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / rowsPerPage));
  const pageEntries = filteredEntries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  function openPrintPage(sale: ExportSale) {
    window.open(`/billing/export-sales/print?id=${encodeURIComponent(sale.id)}`, "_blank", "noopener,noreferrer");
  }

  if (view.mode === "show") {
    const freshSale = entries.find((entry) => entry.id === view.sale.id) ?? view.sale;
    return (
      <ExportSalesShowPage
        sale={freshSale}
        onBack={() => setView({ mode: "list" })}
        onEdit={() => setView({ mode: "upsert", sale: freshSale, returnTo: "show" })}
        onNew={() => setView({ mode: "upsert", sale: null, returnTo: "list" })}
        onPrint={() => openPrintPage(freshSale)}
      />
    );
  }

  if (view.mode === "upsert") {
    return (
      <ExportSalesUpsertPage
        sale={view.sale}
        errorMessage={saveMutation.error instanceof Error ? saveMutation.error.message : ""}
        loading={saveMutation.isPending}
        onBack={() => setView(view.returnTo === "show" && view.sale ? { mode: "show", sale: view.sale } : { mode: "list" })}
        onSubmit={(payload) => saveMutation.mutate(view.sale ? { id: view.sale.id, payload } : { payload })}
        settings={exportSalesLayout}
        numbering={billingSettings.numbering.exportSales}
      />
    );
  }

  return (
    <WorkspacePage
      title="Export Sales"
      description="Export sales workspace with list, show, upsert, and print-ready invoice previews."
      technicalName="page.billing.export-sales.list"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" disabled={exportSalesQuery.isFetching} onClick={() => void exportSalesQuery.refetch()}>
            <RefreshCw className={cn("size-4", exportSalesQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", sale: null, returnTo: "list" })}>
            <Plus className="size-4" />
            New export sales
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
        searchPlaceholder="Search invoice, customer, phone, email, date, or total"
        searchValue={searchValue}
        onShowAllColumns={() => setVisibleColumns(Object.fromEntries(columnOptions.map((column) => [column.id, true])))}
        toolbarAction={
          <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Total value: {formatMoney(filteredEntries.reduce((sum, sale) => sum + sale.amount, 0))}
          </div>
        }
      />
      {exportSalesQuery.isError ? (
        <WorkspaceTablePanel>
          <WorkspaceTableEmptyState>
            {exportSalesQuery.error instanceof Error ? exportSalesQuery.error.message : "Export sales could not be loaded."}
          </WorkspaceTableEmptyState>
        </WorkspaceTablePanel>
      ) : null}
      <ExportSalesList
        currentPage={currentPage}
        entries={pageEntries}
        loading={exportSalesQuery.isLoading}
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
        singularLabel="export sales"
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
