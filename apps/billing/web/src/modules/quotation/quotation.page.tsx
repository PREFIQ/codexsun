import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, ChevronDown, Eye, Pencil, Plus, Printer, RefreshCw, RotateCcw, Save, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@codexsun/ui/components/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@codexsun/ui/components/dropdown-menu";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceAnimatedTabs, type WorkspaceAnimatedTab } from "@codexsun/ui/workspace/animated-tabs";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableEmptyState, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import { WorkspaceFormActions, WorkspaceFormSurface, WorkspaceFormTabbedBody } from "@codexsun/ui/workspace/upsert";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { cn } from "@codexsun/ui/lib/utils";
import { PageTitle } from "../../shared/document/PageTitle";
import { BillingLayout } from "../../shared/layout/BillingLayout";
import { useSalesSettings } from "../settings";
import { defaultBillingSettings, formatDocumentNumber, type BillingDocumentLayoutSettings, type BillingDocumentNumberSettings } from "../settings/settings.types";
import { createEmptyQuotation, type Quotation, type QuotationSavePayload, type QuotationTaxType, type QuotationView } from "./quotation.types";
import { QuotationShowPage } from "./quotation.show";
import {
  buildQuotationAddressChoices,
  findPreferredQuotationAddress,
  formatQuotationAddress,
  QuotationAddressDialog,
  QuotationAddressField,
  quotationAddressDraftFromText,
  type QuotationAddressDraft,
} from "./quotation-address-editor";
import {
  createQuotation,
  createQuotationAddressType,
  createQuotationContact,
  createQuotationLookup,
  createQuotationLocation,
  convertQuotationToSale,
  convertQuotationsToSale,
  deleteQuotation,
  formatDate,
  formatMoney,
  listQuotationColours,
  listQuotationContacts,
  listQuotationAddressTypes,
  listQuotationLocations,
  listQuotationHsnCodes,
  listQuotationProductCategories,
  listQuotationProducts,
  listQuotationSizes,
  listQuotationTaxes,
  listQuotationUnits,
  listQuotationWorkOrders,
  quotationToPayload,
  setQuotationStatus,
  revokeQuotation,
  totalQuotationQuantity,
  updateQuotationContact,
  updateQuotationLookup,
  updateQuotation,
  type QuotationContactSavePayload,
  type QuotationLocationKind,
  type QuotationLocationRecord,
  type QuotationLookupOption,
  type QuotationLookupRecord,
  type QuotationMasterSavePayload,
} from "./quotation.services";
import { useQuotationList } from "./quotation.hooks";
import { getToken } from "../../shared/api/tenant-context";

const statusFilters = [
  { id: "all", label: "All quotations" },
  { id: "draft", label: "Draft" },
  { id: "confirmed", label: "Confirmed" },
  { id: "cancelled", label: "Cancelled" },
];

const quotationColumnCatalog = [
  { id: "date", label: "Date" },
  { id: "customer", label: "Customer" },
  { id: "items", label: "Items" },
  { id: "taxable", label: "Taxable" },
  { id: "gst", label: "GST" },
  { id: "total", label: "Total" },
  { id: "status", label: "Status" },
  { id: "invoice", label: "Invoice" },
  { id: "action", label: "Action" },
] as const;

function isAdminSession() {
  const token = getToken("tenant");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as { userType?: string };
    return payload.userType === "staff" || payload.userType === "super_admin";
  } catch {
    return false;
  }
}

export function QuotationPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <BillingLayout
      currentPath={pathname}
      headerTitle="Quotation"
      subtitle="Create, review, print, and convert tenant-isolated quotation vouchers."
      title="Billing Workspace"
    >
      <PageTitle title="Quotation" />
      <QuotationWorkspace />
    </BillingLayout>
  );
}

export function QuotationWorkspace() {
  const queryClient = useQueryClient();
  const quotationsQuery = useQuotationList();
  const settingsQuery = useSalesSettings();
  const settings = settingsQuery.data ?? defaultBillingSettings;
  const quotationLayout = settings.layout;
  const canAdminRevoke = isAdminSession();
  const [view, setView] = useState<QuotationView>({ mode: "list" });
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contactFilter, setContactFilter] = useState("all");
  const [selectedQuotationIds, setSelectedQuotationIds] = useState<Set<string>>(() => new Set());
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => Object.fromEntries(quotationColumnCatalog.map((column) => [column.id, true])));
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: QuotationSavePayload }) => id ? updateQuotation(id, payload) : createQuotation(payload),
    onSuccess: async (quotation) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "quotations"] });
      toast.success(view.mode === "upsert" && view.quotation ? "Quotation updated" : "Quotation created", {
        description: `${quotation.quotationNumber} is ready.`,
      });
      setView({ mode: "show", quotation });
    },
    onError: (error) => {
      toast.error("Quotation save failed", { description: error instanceof Error ? error.message : "Please try again." });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "cancelled" | "confirmed" }) => setQuotationStatus(id, status),
    onSuccess: async (quotation) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "quotations"] });
      toast.success("Quotation status updated", { description: `${quotation.quotationNumber} is now ${quotation.status}.` });
      setView((current) => current.mode === "show" ? { mode: "show", quotation } : current);
    },
    onError: (error) => {
      toast.error("Status update failed", { description: error instanceof Error ? error.message : "Please try again." });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeQuotation(id),
    onSuccess: async (quotation) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "quotations"] });
      toast.success("Quotation revoked", { description: `${quotation.quotationNumber} is editable again.` });
    },
    onError: (error) => {
      toast.error("Quotation revoke failed", { description: error instanceof Error ? error.message : "Please try again." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuotation(id),
    onSuccess: async (quotation) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "quotations"] });
      toast.success("Quotation deleted", { description: quotation.quotationNumber });
    },
    onError: (error) => {
      toast.error("Quotation could not be deleted", { description: error instanceof Error ? error.message : "Only draft quotations can be deleted." });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => convertQuotationToSale(id),
    onSuccess: async ({ quotation, sale }) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "quotations"] });
      toast.success("Quotation converted", { description: `${quotation.quotationNumber} created sales invoice ${sale.invoiceNumber}.` });
      setView({ mode: "show", quotation });
    },
    onError: (error) => {
      toast.error("Quotation conversion failed", { description: error instanceof Error ? error.message : "Please try again." });
    },
  });

  const batchConvertMutation = useMutation({
    mutationFn: (ids: string[]) => convertQuotationsToSale(ids),
    onSuccess: async ({ sale }) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "quotations"] });
      setSelectedQuotationIds(new Set());
      toast.success("Draft sales invoice generated", { description: sale.invoiceNumber });
    },
    onError: (error) => {
      toast.error("Invoice generation failed", { description: error instanceof Error ? error.message : "Please try again." });
    },
  });

  const entries = quotationsQuery.data ?? [];
  const contactOptions = useMemo(() => buildQuotationContactFilterOptions(entries), [entries]);
  const filteredEntries = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return entries.filter((quotation) => {
      const matchesSearch = !term || [
        quotation.quotationNumber,
        quotation.customerName,
        quotation.workOrderNo,
        quotation.date,
        quotation.status,
        String(quotation.amount),
      ].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;
      const matchesContact = contactFilter === "all" || quotationContactKey(quotation) === contactFilter;
      return matchesSearch && matchesStatus && matchesContact;
    });
  }, [contactFilter, entries, searchValue, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / rowsPerPage));
  const pageEntries = filteredEntries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const pageTotals = useMemo(() => pageEntries.reduce(
    (totals, quotation) => ({
      amount: totals.amount + quotation.amount,
      quantity: totals.quantity + totalQuotationQuantity(quotation),
      subtotal: totals.subtotal + quotation.subtotal,
      taxAmount: totals.taxAmount + quotation.taxAmount,
    }),
    { amount: 0, quantity: 0, subtotal: 0, taxAmount: 0 },
  ), [pageEntries]);
  const selectedEntries = useMemo(() => entries.filter((quotation) => selectedQuotationIds.has(quotation.id)), [entries, selectedQuotationIds]);
  const pageSelectableEntries = pageEntries.filter(canGenerateInvoiceFromQuotation);
  const pageSelected = pageSelectableEntries.length > 0 && pageSelectableEntries.every((quotation) => selectedQuotationIds.has(quotation.id));

  useEffect(() => {
    setSelectedQuotationIds((current) => {
      const available = new Set(entries.map((quotation) => quotation.id));
      const next = new Set(Array.from(current).filter((id) => available.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [entries]);

  function toggleQuotationSelection(quotation: Quotation, checked: boolean) {
    if (!canGenerateInvoiceFromQuotation(quotation)) return;
    setSelectedQuotationIds((current) => {
      const next = new Set(current);
      if (checked) next.add(quotation.id);
      else next.delete(quotation.id);
      return next;
    });
  }

  function togglePageSelection(checked: boolean) {
    setSelectedQuotationIds((current) => {
      const next = new Set(current);
      for (const quotation of pageSelectableEntries) {
        if (checked) next.add(quotation.id);
        else next.delete(quotation.id);
      }
      return next;
    });
  }

  function generateInvoice() {
    if (!selectedEntries.length) {
      toast.error("Select at least one quotation.");
      return;
    }
    const contact = quotationContactKey(selectedEntries[0]!);
    if (selectedEntries.some((quotation) => quotationContactKey(quotation) !== contact)) {
      toast.error("Selected quotations must belong to the same contact.");
      return;
    }
    batchConvertMutation.mutate(selectedEntries.map((quotation) => quotation.id));
  }

  if (view.mode === "show") {
    const freshQuotation = entries.find((entry) => entry.id === view.quotation.id) ?? view.quotation;
    const currentIndex = entries.findIndex((entry) => entry.id === freshQuotation.id);
    const previousQuotation = currentIndex > 0 ? entries[currentIndex - 1] : null;
    const nextQuotation = currentIndex >= 0 && currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null;
    return (
      <QuotationShowPage
        quotation={freshQuotation}
        onBack={() => setView({ mode: "list" })}
        onEdit={() => setView({ mode: "upsert", quotation: freshQuotation, returnTo: "show" })}
        onNew={() => setView({ mode: "upsert", quotation: null, returnTo: "list" })}
        onPrint={() => window.print()}
        onConvert={() => convertMutation.mutate(freshQuotation.id)}
        onSuspend={() => statusMutation.mutate({ id: freshQuotation.id, status: "cancelled" })}
        converting={convertMutation.isPending}
        canEdit={freshQuotation.status === "draft"}
        {...(previousQuotation ? { onPrevious: () => setView({ mode: "show", quotation: previousQuotation }) } : {})}
        {...(nextQuotation ? { onNext: () => setView({ mode: "show", quotation: nextQuotation }) } : {})}
      />
    );
  }

  if (view.mode === "upsert") {
    return (
        <QuotationUpsertPage
        errorMessage={saveMutation.error instanceof Error ? saveMutation.error.message : ""}
        loading={saveMutation.isPending}
        quotation={view.quotation}
        settings={quotationLayout}
        numbering={settings.numbering.quotation}
        canAdminRevoke={canAdminRevoke}
        {...(view.quotation && canAdminRevoke ? { onRevoke: () => revokeMutation.mutate(view.quotation!.id) } : {})}
        onBack={() => setView(view.returnTo === "show" && view.quotation ? { mode: "show", quotation: view.quotation } : { mode: "list" })}
        onSubmit={(payload, printAfter) => {
          saveMutation.mutate(view.quotation ? { id: view.quotation.id, payload } : { payload }, {
            onSuccess: () => {
              if (printAfter) window.setTimeout(() => window.print(), 250);
            },
          });
        }}
      />
    );
  }

  return (
    <WorkspacePage
      title="Quotations"
      description="Create and review tenant-isolated quotation vouchers with sales layout controls."
      technicalName="page.billing.quotation.list"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button className="h-9 rounded-md" disabled={quotationsQuery.isFetching} onClick={() => void quotationsQuery.refetch()} type="button" variant="outline">
            <RefreshCw className={cn("size-4", quotationsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button className="h-9 rounded-md" disabled={!selectedEntries.length || batchConvertMutation.isPending} onClick={generateInvoice} type="button" variant="secondary">
            <Send className="size-4" />
            Generate invoice{selectedEntries.length ? ` (${selectedEntries.length})` : ""}
          </Button>
          <Button className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", quotation: null, returnTo: "list" })} type="button">
            <Plus className="size-4" />
            New quotation
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        filterOptions={statusFilters}
        filterValue={statusFilter}
        onFilterValueChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}
        onSearchValueChange={(value) => {
          setSearchValue(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search quotation, customer, work order, date, or total"
        searchValue={searchValue}
        columnOptions={quotationColumnCatalog.map((column) => ({ ...column, checked: Boolean(visibleColumns[column.id]), onCheckedChange: (checked: boolean) => setVisibleColumns((current) => ({ ...current, [column.id]: checked })) }))}
        onShowAllColumns={() => setVisibleColumns(Object.fromEntries(quotationColumnCatalog.map((column) => [column.id, true])))}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/70 bg-card px-4 py-3 text-sm shadow-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="ml-1 min-w-64">
            <WorkspaceLookup
              options={[{ label: "All contacts", value: "all" }, ...contactOptions.map((option) => ({ label: option.label, value: option.id }))]}
              placeholder="Search contact"
              value={contactFilter}
              onTextChange={(value) => {
                if (!value) {
                  setContactFilter("all");
                  setSelectedQuotationIds(new Set());
                  setCurrentPage(1);
                }
              }}
              onValueChange={(value) => {
                setContactFilter(value || "all");
                setSelectedQuotationIds(new Set());
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{selectedEntries.length} selected</span>
          <Button className="h-8 rounded-md px-2" disabled={!selectedEntries.length} onClick={() => setSelectedQuotationIds(new Set())} type="button" variant="ghost">Clear</Button>
        </div>
      </div>
      {quotationsQuery.isError ? (
        <WorkspaceTablePanel>
          <WorkspaceTableEmptyState>{quotationsQuery.error instanceof Error ? quotationsQuery.error.message : "Quotations could not be loaded."}</WorkspaceTableEmptyState>
        </WorkspaceTablePanel>
      ) : null}
      <QuotationList
        entries={pageEntries}
        loading={quotationsQuery.isLoading}
        onEdit={(quotation) => setView({ mode: "upsert", quotation, returnTo: "list" })}
        onSetStatus={(quotation, status) => statusMutation.mutate({ id: quotation.id, status })}
        onForceDelete={(quotation) => {
          if (window.confirm(`Force delete ${quotation.quotationNumber}? This cannot be undone.`)) deleteMutation.mutate(quotation.id);
        }}
        onRevoke={(quotation) => revokeMutation.mutate(quotation.id)}
        canAdminRevoke={canAdminRevoke}
        onView={(quotation) => setView({ mode: "show", quotation })}
        page={currentPage}
        rowsPerPage={rowsPerPage}
        pageSelected={pageSelected}
        pageSelectableCount={pageSelectableEntries.length}
        selectedQuotationIds={selectedQuotationIds}
        onTogglePageSelection={togglePageSelection}
        onToggleSelection={toggleQuotationSelection}
        visibleColumns={visibleColumns}
      />
      <QuotationPageTotals amount={pageTotals.amount} quantity={pageTotals.quantity} subtotal={pageTotals.subtotal} taxAmount={pageTotals.taxAmount} />
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filteredEntries.length)}
        singularLabel="quotations"
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

function QuotationPageTotals({ amount, quantity, subtotal, taxAmount }: { amount: number; quantity: number; subtotal: number; taxAmount: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-border/70 bg-card px-4 py-2.5 shadow-sm md:grid-cols-4">
      <PageTotal label="Total quantity" value={String(quantity)} />
      <PageTotal label="Total taxable" value={formatMoney(subtotal)} />
      <PageTotal label="Total GST" value={formatMoney(taxAmount)} />
      <PageTotal label="Grand total" strong value={formatMoney(amount)} />
    </div>
  );
}

function PageTotal({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex h-full items-center justify-start gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-foreground", strong && "font-semibold")}>{value}</span>
    </div>
  );
}

function QuotationList({ canAdminRevoke, entries, loading, onEdit, onForceDelete, onRevoke, onSetStatus, onView, page, pageSelected, pageSelectableCount, rowsPerPage, selectedQuotationIds, onTogglePageSelection, onToggleSelection, visibleColumns }: { canAdminRevoke: boolean; entries: Quotation[]; loading: boolean; onEdit: (quotation: Quotation) => void; onForceDelete: (quotation: Quotation) => void; onRevoke: (quotation: Quotation) => void; onSetStatus: (quotation: Quotation, status: "cancelled" | "confirmed") => void; onView: (quotation: Quotation) => void; page: number; pageSelected: boolean; pageSelectableCount: number; rowsPerPage: number; selectedQuotationIds: Set<string>; onTogglePageSelection: (checked: boolean) => void; onToggleSelection: (quotation: Quotation, checked: boolean) => void; visibleColumns: Record<string, boolean> }) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12 border-b border-border/70 px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <input aria-label="Select quotations on this page" checked={pageSelected} className="size-4 accent-primary disabled:cursor-not-allowed disabled:opacity-40" disabled={pageSelectableCount === 0} onChange={(event) => onTogglePageSelection(event.target.checked)} type="checkbox" />
              </th>
              { ["Quotation", ...(visibleColumns.customer ? ["Customer"] : []), ...(visibleColumns.date ? ["Date"] : []), ...(visibleColumns.items ? ["Items"] : []), ...(visibleColumns.taxable ? ["Taxable"] : []), ...(visibleColumns.gst ? ["GST"] : []), ...(visibleColumns.total ? ["Total"] : []), ...(visibleColumns.status ? ["Status"] : []), ...(visibleColumns.invoice ? ["Invoice"] : []), ...(visibleColumns.action ? ["Action"] : [])].map((heading) => (
                <th key={heading} className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((quotation, index) => (
              <tr key={quotation.id} className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/20">
                <td className="px-4 py-2.5 text-center">
                  <input aria-label={`Select ${quotation.quotationNumber}`} checked={selectedQuotationIds.has(quotation.id)} className="size-4 accent-primary disabled:cursor-not-allowed disabled:opacity-40" disabled={!canGenerateInvoiceFromQuotation(quotation)} onChange={(event) => onToggleSelection(quotation, event.target.checked)} title={quotation.generatedSalesInvoiceNo ? `Already invoiced by ${quotation.generatedSalesInvoiceNo}` : undefined} type="checkbox" />
                </td>
                <td className="px-4 py-2.5">
                  <button className="font-semibold text-foreground underline-offset-4 hover:underline" onClick={() => onView(quotation)} title="View quotation" type="button">{quotation.quotationNumber}</button>
                </td>
                {visibleColumns.customer ? <td className="px-4 py-2.5">
                  <button className={cn("font-medium underline-offset-4", quotation.status === "draft" ? "hover:underline" : "cursor-not-allowed text-muted-foreground")} disabled={quotation.status !== "draft"} onClick={() => onEdit(quotation)} title={quotation.status === "draft" ? "Edit quotation" : "Submitted quotations cannot be edited"} type="button">{quotation.customerName}</button>
                </td> : null}
                {visibleColumns.date ? <td className="px-4 py-2.5">{formatDate(quotation.date)}</td> : null}
                {visibleColumns.items ? <td className="px-4 py-2.5">{totalQuotationQuantity(quotation)}</td> : null}
                {visibleColumns.taxable ? <td className="px-4 py-2.5">{formatMoney(quotation.subtotal)}</td> : null}
                {visibleColumns.gst ? <td className="px-4 py-2.5">{formatMoney(quotation.taxAmount)}</td> : null}
                {visibleColumns.total ? <td className="px-4 py-2.5 font-semibold">{formatMoney(quotation.amount)}</td> : null}
                {visibleColumns.status ? <td className="px-4 py-2.5"><StatusPill quotation={quotation} /></td> : null}
                {visibleColumns.invoice ? <td className="px-4 py-2.5 font-semibold text-sky-700">{quotation.generatedSalesInvoiceNo || "-"}</td> : null}
                {visibleColumns.action ? <td className="px-4 py-2.5">
                  <WorkspaceRowActions
                    actions={[
                      ...(quotation.status === "draft" ? [{ id: "confirm", label: "Confirm", icon: <Eye className="size-4" />, onSelect: () => onSetStatus(quotation, "confirmed") }] : []),
                      ...(canAdminRevoke && quotation.status === "confirmed" && !quotation.generatedSalesInvoiceNo ? [{ id: "revoke", label: "Revoke by admin", icon: <RotateCcw className="size-4" />, onSelect: () => onRevoke(quotation) }] : []),
                      ...(quotation.status !== "cancelled" && !quotation.generatedSalesInvoiceNo ? [{ id: "suspend", label: "Suspend", icon: <Trash2 className="size-4" />, tone: "destructive" as const, onSelect: () => onSetStatus(quotation, "cancelled") }] : []),
                      ...(quotation.status === "draft" ? [{ id: "force-delete", label: "Force delete", icon: <Trash2 className="size-4" />, tone: "destructive" as const, onSelect: () => onForceDelete(quotation) }] : []),
                    ]}
                    {...(quotation.status === "draft" ? { onEdit: () => onEdit(quotation) } : {})}
                    onView={() => onView(quotation)}
                    title={quotation.quotationNumber}
                  />
                </td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.length === 0 ? <WorkspaceTableEmptyState>{loading ? "Loading quotations..." : "No quotations found."}</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}

function QuotationUpsertPage({ canAdminRevoke, errorMessage, loading, numbering, onBack, onRevoke, onSubmit, quotation, settings }: { canAdminRevoke: boolean; errorMessage: string; loading: boolean; numbering: BillingDocumentNumberSettings; onBack: () => void; onRevoke?: () => void; onSubmit: (payload: QuotationSavePayload, printAfter?: boolean) => void; quotation: Quotation | null; settings: BillingDocumentLayoutSettings }) {
  const [activeTab, setActiveTab] = useState("details");
  const [workflowAction, setWorkflowAction] = useState<"draft" | "submit" | "revoke">(quotation?.status === "confirmed" ? "revoke" : "draft");
  const [form, setForm] = useState<QuotationSavePayload>(() => quotation ? quotationToPayload(quotation) : {
    ...createEmptyQuotation(),
    quotationNumber: numbering.automatic ? formatDocumentNumber(numbering) : createEmptyQuotation().quotationNumber,
  });
  const [itemDraft, setItemDraft] = useState(() => createEmptyQuotation().items[0] ?? {
    colour: "",
    dcNo: "",
    description: "",
    hsnCode: "",
    poNo: "",
    productName: "",
    quantity: 1,
    rate: 0,
    size: "",
    taxRate: 18,
    unit: "Nos",
  });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemResetSignal, setItemResetSignal] = useState(0);
  const [editingContact, setEditingContact] = useState<QuotationLookupOption["record"] | null>(null);
  const [editingProduct, setEditingProduct] = useState<QuotationLookupRecord | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<QuotationLookupRecord | null>(null);
  const [editingAddressKind, setEditingAddressKind] = useState<"billing" | "shipping" | null>(null);
  const [roundOffManual, setRoundOffManual] = useState(Boolean(quotation && Number(quotation.roundOff || 0) !== 0));
  const [billingAddressDraft, setBillingAddressDraft] = useState<QuotationAddressDraft>(() => quotationAddressDraftFromText(form.billingAddress, "Billing"));
  const [shippingAddressDraft, setShippingAddressDraft] = useState<QuotationAddressDraft>(() => quotationAddressDraftFromText(form.shippingAddress, "Shipping"));
  const [billingAddressChoice, setBillingAddressChoice] = useState("");
  const [shippingAddressChoice, setShippingAddressChoice] = useState("");
  const contactsQuery = useQuery({ queryFn: listQuotationContacts, queryKey: ["billing", "quotation", "lookups", "contacts"] });
  const workOrdersQuery = useQuery({ queryFn: listQuotationWorkOrders, queryKey: ["billing", "quotation", "lookups", "work-orders"] });
  const productsQuery = useQuery({ queryFn: listQuotationProducts, queryKey: ["billing", "quotation", "lookups", "products"] });
  const coloursQuery = useQuery({ queryFn: listQuotationColours, queryKey: ["billing", "quotation", "lookups", "colours"] });
  const sizesQuery = useQuery({ queryFn: listQuotationSizes, queryKey: ["billing", "quotation", "lookups", "sizes"] });
  const contactSaveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: QuotationContactSavePayload }) => id ? updateQuotationContact(id, payload) : createQuotationContact(payload),
  });
  const masterSaveMutation = useMutation({
    mutationFn: ({ id, kind, payload }: { id?: string; kind: "products" | "workOrders"; payload: QuotationMasterSavePayload }) =>
      id ? updateQuotationLookup(kind, id, masterPayload(kind, payload)) : createQuotationLookup(kind, masterPayload(kind, payload)),
  });
  const selectedContact = (contactsQuery.data ?? []).find((option) => option.value === form.customerName || option.label === form.customerName);
  const selectedWorkOrder = (workOrdersQuery.data ?? []).find((option) => option.value === form.workOrderNo || option.label === form.workOrderNo);
  const contactAddressChoices = useMemo(() => buildQuotationAddressChoices(selectedContact?.record), [selectedContact?.record]);
  const itemTotals = useMemo(() => computeQuotationTotals(form.items, form.taxType), [form.items, form.taxType]);
  const suggestedRoundOff = useMemo(() => computeSuggestedRoundOff(itemTotals.amount), [itemTotals.amount]);

  function patch(next: Partial<QuotationSavePayload>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function patchDraft(next: Partial<typeof itemDraft>) {
    setItemDraft((current) => ({ ...current, ...next }));
  }

  useEffect(() => {
    if (roundOffManual) return;
    setForm((current) => current.roundOff === suggestedRoundOff ? current : { ...current, roundOff: suggestedRoundOff });
  }, [roundOffManual, suggestedRoundOff]);

  function applyAddressDraft(kind: "billing" | "shipping", draft: QuotationAddressDraft, choiceValue = "") {
    const formatted = formatQuotationAddress(draft);
    if (kind === "billing") {
      setBillingAddressDraft(draft);
      setBillingAddressChoice(choiceValue);
      patch({ billingAddress: formatted });
      return;
    }
    setShippingAddressDraft(draft);
    setShippingAddressChoice(choiceValue);
    patch({ shippingAddress: formatted });
  }

  function applyContactAddresses(record?: QuotationLookupRecord | null) {
    const choices = buildQuotationAddressChoices(record);
    const preferredBilling = findPreferredQuotationAddress(choices, "Billing");
    const preferredShipping = findPreferredQuotationAddress(choices, "Shipping");
    if (preferredBilling) applyAddressDraft("billing", preferredBilling.draft, preferredBilling.value);
    if (preferredShipping) applyAddressDraft("shipping", preferredShipping.draft, preferredShipping.value);
  }

  function applyContactSelection(value: string, option?: QuotationLookupOption | null) {
    patch({ customerName: option?.label ?? value });
    if (option?.record) applyContactAddresses(option.record);
  }

  function applyRoundOff(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setRoundOffManual(false);
      patch({ roundOff: suggestedRoundOff });
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) return;
    setRoundOffManual(true);
    patch({ roundOff: parsed });
  }

  function resetDraft() {
    setItemDraft({
      colour: "",
      dcNo: "",
      description: "",
      hsnCode: "",
      poNo: "",
      productName: "",
      quantity: 1,
      rate: 0,
      size: "",
      taxRate: 18,
      unit: "Nos",
    });
    setEditingItemIndex(null);
    setItemResetSignal((current) => current + 1);
  }

  function addOrUpdateItem() {
    if (!itemDraft.productName.trim()) {
      toast.error("Product name is required");
      return;
    }
    setForm((current) => ({
      ...current,
      items: editingItemIndex === null
        ? [...current.items, { ...itemDraft }]
        : current.items.map((item, index) => index === editingItemIndex ? { ...itemDraft } : item),
    }));
    resetDraft();
  }

  function editItem(index: number) {
    const item = form.items[index];
    if (!item) return;
    setItemDraft({ ...item });
    setEditingItemIndex(index);
  }

  function removeItem(index: number) {
    setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
    if (editingItemIndex === index) resetDraft();
  }

  function applyProductSelection(value: string, option?: QuotationLookupOption | null) {
    const record = option?.record;
    patchDraft({
      hsnCode: record?.hsnCode ?? itemDraft.hsnCode,
      productName: option?.label ?? value,
      rate: Number(record?.price ?? record?.openingRate ?? itemDraft.rate ?? 0),
      taxRate: Number(record?.taxRate ?? itemDraft.taxRate ?? 18),
      unit: record?.unitName ?? itemDraft.unit,
    });
  }

  const tabs: WorkspaceAnimatedTab[] = [
    {
      value: "details",
      label: "Details",
      content: (
        <div className="space-y-0">
          <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
          <div className="space-y-5">
            <Field label="Customer name" required>
              <WorkspaceLookup
                createDescription="Add contact details and address without leaving this quotation."
                createLabel="New contact"
                createMode="popup"
                createTitle="New contact"
                emptyLabel="No contacts found. Create a new contact."
                loading={contactsQuery.isLoading}
                options={contactsQuery.data ?? []}
                placeholder="Search contact"
                required
                value={form.customerName}
                onTextChange={(value) => patch({ customerName: value })}
                onValueChange={(value, option) => applyContactSelection(value, option as QuotationLookupOption | null | undefined)}
                renderCreateForm={({ initialName, onCancel, onCreated }) => (
                  <QuotationContactQuickForm
                    initialValue={contactDraftFromRecord(undefined, initialName)}
                    loading={contactSaveMutation.isPending}
                    onCancel={onCancel}
                    onSave={async (payload) => {
                      const created = await contactSaveMutation.mutateAsync({ payload });
                      await contactsQuery.refetch();
                      const option = quotationContactOption(created);
                      onCreated(option);
                      patch({ customerName: option.label });
                      applyContactAddresses(created);
                      toast.success("Contact saved", { description: option.label });
                    }}
                    title="New contact"
                  />
                )}
                trailingAction={selectedContact?.record ? (
                  <button
                    aria-label="Edit selected contact"
                    className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Edit selected contact"
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => { event.stopPropagation(); setEditingContact(selectedContact.record); }}
                  >
                    <ArrowUpRight className="size-4" />
                  </button>
                ) : undefined}
              />
            </Field>
            <Field label="Work order no">
              <WorkspaceLookup
                createDescription="Add a work order without leaving this quotation."
                createLabel="New work order"
                createMode="popup"
                createTitle="New work order"
                emptyLabel="No work orders found. Create a new work order."
                loading={workOrdersQuery.isLoading}
                options={workOrdersQuery.data ?? []}
                placeholder="Search work order"
                value={form.workOrderNo}
                onTextChange={(value) => patch({ workOrderNo: value })}
                onValueChange={(value, option) => patch({ workOrderNo: option?.value ?? value })}
                renderCreateForm={({ initialName, onCancel, onCreated }) => (
                  <QuotationMasterQuickForm
                    kind="workOrders"
                    initialValue={masterDraftFromRecord(undefined, initialName)}
                    loading={masterSaveMutation.isPending}
                    onCancel={onCancel}
                    onSave={async (payload) => {
                      const created = await masterSaveMutation.mutateAsync({ kind: "workOrders", payload });
                      await workOrdersQuery.refetch();
                      const option = quotationWorkOrderOption(created);
                      onCreated(option);
                      patch({ workOrderNo: option.value });
                      toast.success("Work order saved", { description: option.label });
                    }}
                    title="New work order"
                  />
                )}
                trailingAction={selectedWorkOrder?.record ? (
                  <button aria-label="Edit selected work order" className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Edit selected work order" type="button" onMouseDown={(event) => event.preventDefault()} onClick={(event) => { event.stopPropagation(); if (selectedWorkOrder.record) setEditingWorkOrder(selectedWorkOrder.record); }}><ArrowUpRight className="size-4" /></button>
                ) : undefined}
              />
            </Field>
          </div>
          <div className="space-y-5">
            <Field label="Quotation number"><Input disabled={!quotation && numbering.automatic} value={form.quotationNumber} onChange={(event) => patch({ quotationNumber: event.target.value })} /></Field>
            <Field label="Date"><WorkspaceDatePicker value={form.date} onValueChange={(value) => patch({ date: value })} /></Field>
            <Field label="Quotation tax type">
              <WorkspaceSelect
                value={form.taxType}
                options={[{ label: "CGST + SGST", value: "cgst-sgst" }, { label: "IGST", value: "igst" }]}
                onValueChange={(taxType) => patch({ taxType: taxType as QuotationTaxType })}
              />
            </Field>
          </div>
          </div>
          <QuotationItemsSection
          draft={itemDraft}
          editing={editingItemIndex !== null}
          items={form.items}
          colourOptions={coloursQuery.data ?? []}
          coloursLoading={coloursQuery.isLoading}
          productOptions={productsQuery.data ?? []}
          productsLoading={productsQuery.isLoading}
          resetSignal={itemResetSignal}
          settings={settings}
          sizeOptions={sizesQuery.data ?? []}
          sizesLoading={sizesQuery.isLoading}
          taxType={form.taxType}
          roundOff={Number(form.roundOff ?? 0)}
          roundOffManual={roundOffManual}
          suggestedRoundOff={suggestedRoundOff}
          onAdd={addOrUpdateItem}
          onDraftChange={patchDraft}
          onEdit={editItem}
          onProductSelect={applyProductSelection}
          onRoundOffChange={applyRoundOff}
          onRemove={removeItem}
          onResetRoundOff={() => {
            setRoundOffManual(false);
            patch({ roundOff: suggestedRoundOff });
          }}
          onReset={resetDraft}
          onCreateColour={async (name) => {
            const created = await createQuotationLookup("colours", { isActive: true, name });
            await coloursQuery.refetch();
            toast.success("Colour saved", { description: name });
            return quotationCommonOption(created);
          }}
          onCreateProduct={async (name) => {
            const created = await masterSaveMutation.mutateAsync({ kind: "products", payload: masterDraftFromRecord(undefined, name) });
            await productsQuery.refetch();
            toast.success("Product saved", { description: name });
            return quotationProductOption(created);
          }}
          renderProductCreateForm={({ initialName, onCancel, onCreated }) => (
            <QuotationMasterQuickForm
              kind="products"
              initialValue={masterDraftFromRecord(undefined, initialName)}
              loading={masterSaveMutation.isPending}
              onCancel={onCancel}
              onSave={async (payload) => {
                const created = await masterSaveMutation.mutateAsync({ kind: "products", payload });
                await productsQuery.refetch();
                const option = quotationProductOption(created);
                onCreated(option);
                toast.success("Product saved", { description: option.label });
              }}
              title="New product"
            />
          )}
          onCreateSize={async (name) => {
            const created = await createQuotationLookup("sizes", { isActive: true, name });
            await sizesQuery.refetch();
            toast.success("Size saved", { description: name });
            return quotationCommonOption(created);
          }}
            onEditProduct={(record) => setEditingProduct(record)}
          />
        </div>
      ),
    },
    {
      value: "address",
      label: "Address",
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <QuotationAddressField
            choices={contactAddressChoices}
            description={form.billingAddress}
            disabled={!selectedContact?.record}
            label="Billing address"
            selectedValue={billingAddressChoice}
            onEdit={() => setEditingAddressKind("billing")}
            onSelect={(choice) => applyAddressDraft("billing", choice.draft, choice.value)}
          />
          <QuotationAddressField
            choices={contactAddressChoices}
            description={form.shippingAddress}
            disabled={!selectedContact?.record}
            label="Shipping address"
            selectedValue={shippingAddressChoice}
            onEdit={() => setEditingAddressKind("shipping")}
            onSelect={(choice) => applyAddressDraft("shipping", choice.draft, choice.value)}
          />
        </div>
      ),
    },
    {
      value: "terms",
      label: "Terms",
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Terms"><Textarea className="min-h-32" value={form.terms} onChange={(event) => patch({ terms: event.target.value })} /></Field>
          <Field label="Comments"><Textarea className="min-h-32" value={form.notes} onChange={(event) => patch({ notes: event.target.value })} /></Field>
        </div>
      ),
    },
  ];

  function submit(printAfter = false, status: QuotationSavePayload["status"] = form.status) {
    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!form.items.length) {
      toast.error("Add at least one item");
      return;
    }
    onSubmit({ ...form, status }, printAfter);
  }

  return (
    <WorkspacePage
      className="max-w-[96rem]"
      title={quotation ? "Edit Quotation" : "New Quotation"}
      description="Create or update a tenant-isolated quotation voucher."
      actions={<Button className="h-9 rounded-md" onClick={onBack} type="button" variant="outline"><X className="size-4" />Cancel</Button>}
    >
      <WorkspaceFormSurface>
        <WorkspaceFormTabbedBody className="pb-7">
          <WorkspaceAnimatedTabs
            tabs={tabs}
            value={activeTab}
            onValueChange={setActiveTab}
            className="min-w-0"
            contentClassName="px-0 pb-0"
            listClassName="border-border/80"
          />
        </WorkspaceFormTabbedBody>
        {errorMessage ? <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}
        <WorkspaceFormActions>
          <Button disabled={loading} onClick={() => submit(false, "draft")} type="button"><Save className="size-4" />Save</Button>
          <Button disabled={loading} onClick={() => submit(true)} type="button" variant="outline"><Printer className="size-4" />Save & Print</Button>
          <Button onClick={onBack} type="button" variant="outline"><X className="size-4" />Cancel</Button>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Quotation workflow action"
                  className={cn(
                    "h-8 w-20 min-w-20 justify-center gap-1 px-2 text-xs transition-[background-color,border-color,color,transform] duration-300 ease-out",
                    workflowAction === "draft" && "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100",
                    workflowAction === "submit" && "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                    workflowAction === "revoke" && "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
                  )}
                  disabled={loading}
                  title="Quotation workflow action"
                  type="button"
                  variant="outline"
                >
                  {workflowAction === "draft" ? "Draft" : workflowAction === "submit" ? "Submit" : "Revoke"}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-20 min-w-20 rounded-md p-1">
                <DropdownMenuItem className="gap-1 px-2 text-xs" onSelect={() => setWorkflowAction("draft")}><Save className="size-4" />Draft</DropdownMenuItem>
                <DropdownMenuItem className="gap-1 px-2 text-xs" onSelect={() => setWorkflowAction("submit")}><Send className="size-4" />Submit</DropdownMenuItem>
                {(workflowAction === "submit" || quotation?.status === "confirmed") && !quotation?.generatedSalesInvoiceNo ? <><DropdownMenuSeparator /><DropdownMenuItem className="gap-1 px-2 text-xs" onSelect={() => setWorkflowAction("revoke")}><RotateCcw className="size-4" />Revoke</DropdownMenuItem></> : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </WorkspaceFormActions>
        <Dialog open={Boolean(editingContact)} onOpenChange={(open) => !open && setEditingContact(null)}>
          <DialogContent className="rounded-md p-0 sm:max-w-3xl" onInteractOutside={(event) => event.preventDefault()}>
            {editingContact ? (
              <QuotationContactQuickForm
                initialValue={contactDraftFromRecord(editingContact)}
                loading={contactSaveMutation.isPending}
                onCancel={() => setEditingContact(null)}
                onSave={async (payload) => {
                  const saved = await contactSaveMutation.mutateAsync({ id: editingContact.id, payload });
                  await contactsQuery.refetch();
                  patch({ customerName: quotationContactOption(saved).label });
                  applyContactAddresses(saved);
                  setEditingContact(null);
                  toast.success("Contact saved", { description: quotationContactOption(saved).label });
                }}
                title="Edit contact"
              />
            ) : null}
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(editingProduct)} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="rounded-md p-0 sm:max-w-3xl" onInteractOutside={(event) => event.preventDefault()}>
            {editingProduct ? <QuotationMasterQuickForm kind="products" initialValue={masterDraftFromRecord(editingProduct)} loading={masterSaveMutation.isPending} onCancel={() => setEditingProduct(null)} onSave={async (payload) => { const saved = await masterSaveMutation.mutateAsync({ id: editingProduct.id, kind: "products", payload }); await productsQuery.refetch(); patchDraft({ productName: quotationProductOption(saved).label }); setEditingProduct(null); toast.success("Product saved", { description: quotationProductOption(saved).label }); }} title="Edit product" /> : null}
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(editingWorkOrder)} onOpenChange={(open) => !open && setEditingWorkOrder(null)}>
          <DialogContent className="rounded-md p-0 sm:max-w-3xl" onInteractOutside={(event) => event.preventDefault()}>
            {editingWorkOrder ? <QuotationMasterQuickForm kind="workOrders" initialValue={masterDraftFromRecord(editingWorkOrder)} loading={masterSaveMutation.isPending} onCancel={() => setEditingWorkOrder(null)} onSave={async (payload) => { const saved = await masterSaveMutation.mutateAsync({ id: editingWorkOrder.id, kind: "workOrders", payload }); await workOrdersQuery.refetch(); patch({ workOrderNo: quotationWorkOrderOption(saved).value }); setEditingWorkOrder(null); toast.success("Work order saved", { description: quotationWorkOrderOption(saved).label }); }} title="Edit work order" /> : null}
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(editingAddressKind)} onOpenChange={(open) => !open && setEditingAddressKind(null)}>
          <DialogContent className="rounded-md p-0 sm:max-w-3xl" onInteractOutside={(event) => event.preventDefault()}>
            {editingAddressKind ? (
              <QuotationAddressDialog
                draft={editingAddressKind === "billing" ? billingAddressDraft : shippingAddressDraft}
                onCancel={() => setEditingAddressKind(null)}
                onSave={(draft) => {
                  applyAddressDraft(editingAddressKind, draft);
                  setEditingAddressKind(null);
                  toast.success(`${editingAddressKind === "billing" ? "Billing" : "Shipping"} address saved`);
                }}
                title="Edit contact"
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </WorkspaceFormSurface>
    </WorkspacePage>
  );
}

function QuotationContactQuickForm({ initialValue, loading, onCancel, onSave, title }: { initialValue: QuotationContactSavePayload; loading: boolean; onCancel: () => void; onSave: (payload: QuotationContactSavePayload) => Promise<void>; title: string }) {
  const [form, setForm] = useState(initialValue);
  const [activeTab, setActiveTab] = useState("details");
  const [legalNameManual, setLegalNameManual] = useState(Boolean(initialValue.legalName && initialValue.legalName !== initialValue.name.toUpperCase()));
  const addressTypesQuery = useQuery({ queryFn: listQuotationAddressTypes, queryKey: ["billing", "quotation", "lookups", "address-types"] });
  const countriesQuery = useQuery({ queryFn: () => listQuotationLocations("countries"), queryKey: ["billing", "quotation", "lookups", "countries"] });
  const statesQuery = useQuery({ queryFn: () => listQuotationLocations("states"), queryKey: ["billing", "quotation", "lookups", "states"] });
  const districtsQuery = useQuery({ queryFn: () => listQuotationLocations("districts"), queryKey: ["billing", "quotation", "lookups", "districts"] });
  const citiesQuery = useQuery({ queryFn: () => listQuotationLocations("cities"), queryKey: ["billing", "quotation", "lookups", "cities"] });
  const pincodesQuery = useQuery({ queryFn: () => listQuotationLocations("pincodes"), queryKey: ["billing", "quotation", "lookups", "pincodes"] });

  useEffect(() => {
    const india = (countriesQuery.data ?? []).find((record) => record.name.toLowerCase() === "india" || record.code.toUpperCase() === "IN");
    if (!india || form.countryId) return;
    setForm((current) => ({ ...current, countryId: india.id, countryName: india.name }));
  }, [countriesQuery.data, form.countryId]);

  const locations = {
    cities: citiesQuery.data ?? [],
    districts: districtsQuery.data ?? [],
    pincodes: pincodesQuery.data ?? [],
    states: statesQuery.data ?? [],
  };

  async function createLocation(kind: QuotationLocationKind, name: string) {
    const dependency = kind === "states" ? form.countryId : kind === "districts" ? form.stateId : kind === "cities" ? form.districtId : form.cityId;
    if (!dependency) {
      toast.error(`Select ${kind === "states" ? "India" : kind === "districts" ? "a state" : kind === "cities" ? "a district" : "a city"} first.`);
      return undefined;
    }
    const created = await createQuotationLocation(kind, locationPayload(kind, name, form));
    await ({ cities: citiesQuery, districts: districtsQuery, pincodes: pincodesQuery, states: statesQuery }[kind]).refetch();
    toast.success(`${kind === "pincodes" ? "Pincode" : kind.slice(0, -1)} saved`, { description: name });
    return quotationLocationOption(created);
  }

  const tabs: WorkspaceAnimatedTab[] = [
    {
      content: (
        <div className="grid gap-4">
          <ContactQuickField label="Contact name" required value={form.name} onChange={(name) => setForm((current) => ({ ...current, name, ...(!legalNameManual ? { legalName: name.toUpperCase() } : {}) }))} />
          <ContactQuickField forceUppercase label="Legal name" value={form.legalName} onChange={(legalName) => { setLegalNameManual(true); setForm((current) => ({ ...current, legalName })); }} />
          <ContactQuickField forceUppercase label="GSTIN" value={form.gstin} onChange={(gstin) => setForm((current) => ({ ...current, gstin }))} />
          <ContactQuickField label="Phone" value={form.primaryPhone} onChange={(primaryPhone) => setForm((current) => ({ ...current, primaryPhone }))} />
        </div>
      ),
      label: "Details",
      value: "details",
    },
    {
      content: (
        <div className="grid gap-4">
          <label className="grid gap-2">
            <Label>Address type</Label>
            <WorkspaceLookup
              createLabel="Save address type"
              createMode="inline"
              emptyLabel="No address types found. Type a value to create it."
              loading={addressTypesQuery.isLoading}
              options={(addressTypesQuery.data ?? []).filter((record) => record.isActive !== false).map(quotationContactOption)}
              placeholder="Search address type"
              value={form.addressTypeName}
              onCreate={async (name) => {
                const created = await createQuotationAddressType(name);
                await addressTypesQuery.refetch();
                toast.success("Address type saved", { description: name });
                return quotationContactOption(created);
              }}
              onValueChange={(value, option) => setForm((current) => ({ ...current, addressTypeName: option?.label ?? value }))}
            />
          </label>
          <ContactQuickField label="Address line 1" value={form.addressLine1} onChange={(addressLine1) => setForm((current) => ({ ...current, addressLine1 }))} />
          <ContactQuickField label="Address line 2" value={form.addressLine2} onChange={(addressLine2) => setForm((current) => ({ ...current, addressLine2 }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <ContactLocationLookup label="State" kind="states" loading={statesQuery.isLoading} options={locations.states.filter((record) => !form.countryId || record.countryId === form.countryId)} value={form.stateId || form.stateName} onCreate={createLocation} onPick={(record) => setForm((current) => locationPatch("states", record, current))} />
            <ContactLocationLookup label="District" kind="districts" loading={districtsQuery.isLoading} options={locations.districts.filter((record) => !form.stateId || record.stateId === form.stateId)} value={form.districtId || form.districtName} onCreate={createLocation} onPick={(record) => setForm((current) => locationPatch("districts", record, current))} />
            <ContactLocationLookup label="City" kind="cities" loading={citiesQuery.isLoading} options={locations.cities.filter((record) => !form.districtId || record.districtId === form.districtId)} value={form.cityId || form.cityName} onCreate={createLocation} onPick={(record) => setForm((current) => locationPatch("cities", record, current))} />
            <ContactLocationLookup label="Pincode" kind="pincodes" loading={pincodesQuery.isLoading} options={locations.pincodes.filter((record) => !form.cityId || record.cityId === form.cityId)} value={form.pincodeId || form.pincodeName} onCreate={createLocation} onPick={(record) => setForm((current) => locationPatch("pincodes", record, current))} />
          </div>
        </div>
      ),
      label: "Address",
      value: "address",
    },
  ];

  return (
    <form
      className="grid gap-0"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(form);
      }}
    >
      <DialogHeader className="border-b border-border/80 px-5 py-4 pr-12">
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <WorkspaceAnimatedTabs contentClassName="h-[26rem] overflow-y-auto px-5 pb-5" listClassName="rounded-none border-x-0 border-t-0 px-5 shadow-none" tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
      <DialogFooter className="border-t border-border/80 px-5 py-4">
        <Button disabled={loading} type="button" variant="outline" onClick={onCancel}><X className="size-4" />Cancel</Button>
        <Button disabled={loading || !form.name.trim()} type="submit"><Save className="size-4" />Save contact</Button>
      </DialogFooter>
    </form>
  );
}

function ContactQuickField({ className, forceUppercase = false, label, onChange, required, type = "text", value }: { className?: string; forceUppercase?: boolean; label: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
  return (
    <label className={cn("grid gap-2", className)}>
      <Label>{label}{required ? <span className="text-destructive"> *</span> : null}</Label>
      <Input autoCapitalize={forceUppercase ? "characters" : "none"} autoFocus={label === "Contact name"} className={cn("h-11 rounded-md", forceUppercase && "uppercase")} required={required} type={type} value={value} onChange={(event) => onChange(forceUppercase ? event.target.value.toUpperCase() : event.target.value)} />
    </label>
  );
}

function ContactLocationLookup({ kind, label, loading, onCreate, onPick, options, value }: { kind: QuotationLocationKind; label: string; loading: boolean; onCreate: (kind: QuotationLocationKind, name: string) => Promise<QuotationLookupOption | undefined>; onPick: (record: QuotationLocationRecord) => void; options: QuotationLocationRecord[]; value: string }) {
  const lookupOptions = options.filter((record) => record.status !== "inactive").map(quotationLocationOption);
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      <WorkspaceLookup
        allowTextValue={false}
        createLabel={`Create ${label.toLowerCase()}`}
        createMode="inline"
        emptyLabel={`No ${label.toLowerCase()} found. Type a value to create it.`}
        loading={loading}
        options={lookupOptions}
        placeholder={`Search ${label.toLowerCase()}`}
        value={value}
        onCreate={(name) => onCreate(kind, name)}
        onValueChange={(selected, option) => {
          const record = ((option as QuotationLookupOption | undefined)?.record as QuotationLocationRecord | undefined) ?? options.find((item) => item.id === selected);
          if (record) onPick(record);
        }}
      />
    </label>
  );
}

function quotationLocationOption(record: QuotationLocationRecord): QuotationLookupOption {
  const label = record.name || record.pincode || record.code;
  return {
    label,
    record,
    value: record.id,
  };
}

function locationPayload(kind: QuotationLocationKind, name: string, form: QuotationContactSavePayload) {
  const trimmedName = name.trim();
  const payload: Record<string, unknown> = {
    code: locationCode(trimmedName),
    name: trimmedName,
    sortOrder: 1000,
    status: "active",
    countryId: form.countryId || null,
    countryName: form.countryName || "India",
  };
  if (kind !== "states") {
    payload.stateId = form.stateId || null;
    payload.stateName = form.stateName || null;
  }
  if (kind === "cities" || kind === "pincodes") {
    payload.districtId = form.districtId || null;
    payload.districtName = form.districtName || null;
  }
  if (kind === "pincodes") {
    payload.areaName = trimmedName;
    payload.cityId = form.cityId || null;
    payload.cityName = form.cityName || null;
    payload.pincode = trimmedName;
  }
  return payload;
}

function locationPatch(kind: QuotationLocationKind, record: QuotationLocationRecord, form: QuotationContactSavePayload): QuotationContactSavePayload {
  const label = record.pincode || record.name;
  const next = { ...form };
  if (kind === "states") {
    next.stateId = record.id;
    next.stateName = record.name;
    next.districtId = "";
    next.districtName = "";
    next.cityId = "";
    next.cityName = "";
    next.pincodeId = "";
    next.pincodeName = "";
  } else if (kind === "districts") {
    next.districtId = record.id;
    next.districtName = record.name;
    next.cityId = "";
    next.cityName = "";
    next.pincodeId = "";
    next.pincodeName = "";
  } else if (kind === "cities") {
    next.cityId = record.id;
    next.cityName = record.name;
    next.pincodeId = "";
    next.pincodeName = "";
  } else {
    next.pincodeId = record.id;
    next.pincodeName = label;
    next.cityId = record.cityId || next.cityId;
    next.cityName = record.cityName || next.cityName;
    next.districtId = record.districtId || next.districtId;
    next.districtName = record.districtName || next.districtName;
    next.stateId = record.stateId || next.stateId;
    next.stateName = record.stateName || next.stateName;
    next.countryId = record.countryId || next.countryId;
    next.countryName = record.countryName || next.countryName || "India";
  }
  return next;
}

function locationCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "LOCATION";
}

function contactDraftFromRecord(record?: QuotationLookupRecord, initialName = ""): QuotationContactSavePayload {
  const address = record?.addresses?.[0] ?? {};
  return {
    addressTypeName: String(address.addressTypeName ?? "Billing"),
    addressLine1: String(address.addressLine1 ?? ""),
    addressLine2: String(address.addressLine2 ?? ""),
    cityId: String(address.cityId ?? ""),
    cityName: String(address.cityName ?? ""),
    countryId: String(address.countryId ?? ""),
    countryName: String(address.countryName ?? "India"),
    districtId: String(address.districtId ?? ""),
    districtName: String(address.districtName ?? ""),
    gstin: String(record?.gstin ?? ""),
    legalName: record?.legalName ?? initialName,
    name: record?.name ?? initialName,
    pincodeId: String(address.pincodeId ?? ""),
    pincodeName: String(address.pincodeName ?? ""),
    primaryEmail: record?.primaryEmail ?? "",
    primaryPhone: record?.primaryPhone ?? "",
    stateId: String(address.stateId ?? ""),
    stateName: String(address.stateName ?? ""),
  };
}

function quotationContactOption(record: QuotationLookupRecord): QuotationLookupOption {
  const label = record.name || record.code || record.id;
  return {
    description: record.primaryPhone || record.primaryEmail || "",
    label,
    meta: record.code || "",
    record,
    value: label,
  };
}

function QuotationMasterQuickForm({ initialValue, kind, loading, onCancel, onSave, title }: { initialValue: QuotationMasterSavePayload; kind: "products" | "workOrders"; loading: boolean; onCancel: () => void; onSave: (payload: QuotationMasterSavePayload) => Promise<void>; title: string }) {
  const [form, setForm] = useState(initialValue);
  const product = kind === "products";
  return (
    <form className="grid gap-0" onSubmit={(event) => { event.preventDefault(); void onSave(form); }}>
      <DialogHeader className="border-b border-border/80 px-5 py-4 pr-12"><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div className="grid gap-4 px-5 py-5">
        <ContactQuickField label={product ? "Product name" : "Work order name"} required value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} />
        <ContactQuickField label="Code" value={form.code} onChange={(code) => setForm((current) => ({ ...current, code: code.toUpperCase() }))} />
        {product ? <><ContactQuickField label="HSN code" value={form.hsnCode} onChange={(hsnCode) => setForm((current) => ({ ...current, hsnCode }))} /><ContactQuickField label="Unit" value={form.unitName} onChange={(unitName) => setForm((current) => ({ ...current, unitName }))} /><ContactQuickField label="Opening rate" type="number" value={String(form.openingRate)} onChange={(openingRate) => setForm((current) => ({ ...current, openingRate: Number(openingRate || 0) }))} /></> : <ContactQuickField label="Work order type" value={form.typeName} onChange={(typeName) => setForm((current) => ({ ...current, typeName }))} />}
      </div>
      <DialogFooter className="border-t border-border/80 px-5 py-4"><Button disabled={loading} type="button" variant="outline" onClick={onCancel}><X className="size-4" />Cancel</Button><Button disabled={loading || !form.name.trim()} type="submit"><Save className="size-4" />Save</Button></DialogFooter>
    </form>
  );
}

function masterDraftFromRecord(record?: QuotationLookupRecord, initialName = ""): QuotationMasterSavePayload {
  return {
    code: record?.code ?? "",
    hsnCode: record?.hsnCode ?? "",
    hsnCodeId: record?.hsnCodeId ?? "",
    name: record?.name ?? initialName,
    openingRate: Number(record?.openingRate ?? record?.price ?? 0),
    productCategoryId: record?.productCategoryId ?? "",
    productCategoryName: record?.productCategoryName ?? "",
    taxId: record?.taxId ?? "",
    taxName: record?.taxName ?? "",
    taxRate: Number(record?.taxRate ?? record?.ratePercent ?? 0),
    typeName: record?.typeName ?? "",
    unitId: record?.unitId ?? "",
    unitName: record?.unitName ?? "",
  };
}

function masterPayload(kind: "products" | "workOrders", payload: QuotationMasterSavePayload) {
  return kind === "products"
    ? { code: payload.code.trim(), hsnCode: payload.hsnCode.trim(), hsnCodeId: payload.hsnCodeId || null, isActive: true, name: payload.name.trim(), openingRate: Number(payload.openingRate || 0), productCategoryId: payload.productCategoryId || null, productCategoryName: payload.productCategoryName?.trim() || null, taxId: payload.taxId || null, taxName: payload.taxName?.trim() || null, taxRate: Number(payload.taxRate || 0), unitId: payload.unitId || null, unitName: payload.unitName.trim() }
    : { code: payload.code.trim(), isActive: true, name: payload.name.trim(), typeName: payload.typeName.trim() };
}

function quotationProductOption(record: QuotationLookupRecord): QuotationLookupOption {
  const label = record.name || record.code || record.id;
  return { description: [record.hsnCode, record.unitName].filter(Boolean).join(" | "), label, meta: record.code || "", record, value: label };
}

function quotationWorkOrderOption(record: QuotationLookupRecord): QuotationLookupOption {
  const value = record.code || record.workOrderNo || record.name || record.id;
  return { description: record.name || record.typeName || "", label: value, meta: record.typeName || "", record, value };
}

function quotationCommonOption(record: QuotationLookupRecord): QuotationLookupOption {
  const label = record.name || record.code || record.id;
  return { label, record, value: label };
}

function QuotationItemsSection({
  colourOptions,
  coloursLoading,
  draft,
  editing,
  items,
  productOptions,
  productsLoading,
  resetSignal,
  settings,
  sizeOptions,
  sizesLoading,
  taxType,
  roundOff,
  roundOffManual,
  suggestedRoundOff,
  onAdd,
  onCreateColour,
  onCreateProduct,
  onCreateSize,
  renderProductCreateForm,
  onDraftChange,
  onEditProduct,
  onEdit,
  onProductSelect,
  onRoundOffChange,
  onRemove,
  onResetRoundOff,
  onReset,
}: {
  colourOptions: QuotationLookupOption[];
  coloursLoading: boolean;
  draft: QuotationSavePayload["items"][number];
  editing: boolean;
  items: QuotationSavePayload["items"];
  productOptions: QuotationLookupOption[];
  productsLoading: boolean;
  resetSignal: number;
  settings: BillingDocumentLayoutSettings;
  sizeOptions: QuotationLookupOption[];
  sizesLoading: boolean;
  taxType: QuotationTaxType;
  roundOff: number;
  roundOffManual: boolean;
  suggestedRoundOff: number;
  onAdd: () => void;
  onCreateColour: (name: string) => Promise<QuotationLookupOption | undefined>;
  onCreateProduct: (name: string) => Promise<QuotationLookupOption | undefined>;
  onCreateSize: (name: string) => Promise<QuotationLookupOption | undefined>;
  renderProductCreateForm: (context: { initialName: string; onCancel: () => void; onCreated: (option: QuotationLookupOption) => void }) => ReactNode;
  onDraftChange: (next: Partial<QuotationSavePayload["items"][number]>) => void;
  onEditProduct: (record: QuotationLookupRecord) => void;
  onEdit: (index: number) => void;
  onProductSelect: (value: string, option?: QuotationLookupOption | null) => void;
  onRoundOffChange: (value: string) => void;
  onRemove: (index: number) => void;
  onResetRoundOff: () => void;
  onReset: () => void;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const showPo = settings.usePo;
  const showDc = settings.useDc;
  const showColour = settings.useColour;
  const showSize = settings.useSize;
  const splitTax = taxType === "cgst-sgst";
  const totals = computeQuotationTotals(items, taxType);
  const grandTotal = totals.amount + roundOff;
  const templateColumns = [
    ...(showPo ? ["minmax(6.5rem,0.7fr)"] : []),
    ...(showDc ? ["minmax(6.5rem,0.7fr)"] : []),
    "minmax(16rem,2fr)",
    "minmax(14rem,1.2fr)",
    ...(showColour ? ["minmax(7rem,0.8fr)"] : []),
    ...(showSize ? ["minmax(7rem,0.8fr)"] : []),
    "minmax(6rem,0.7fr)",
    "minmax(7rem,0.7fr)",
    "auto",
  ].join(" ");

  useEffect(() => {
    if (!resetSignal) return;
    window.requestAnimationFrame(() => {
      rowRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
    });
  }, [resetSignal]);

  return (
    <div className="mt-8 px-0 pb-0 pt-5">
      <div>
        <h3 className="text-lg font-semibold tracking-normal text-foreground underline decoration-foreground/70 underline-offset-4">Quotation Items</h3>
        <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1 pt-1.5">
          <div className="min-w-[980px]">
            <div ref={rowRef} className="grid gap-1" style={{ gridTemplateColumns: templateColumns }}>
              {showPo ? <Field label="PO"><Input value={draft.poNo} onChange={(event) => onDraftChange({ poNo: event.target.value })} /></Field> : null}
              {showDc ? <Field label="DC"><Input value={draft.dcNo} onChange={(event) => onDraftChange({ dcNo: event.target.value })} /></Field> : null}
              <Field label="Product name">
                <WorkspaceLookup
                  createDescription="Add a product without leaving this quotation."
                  createLabel="New product"
                  createMode="popup"
                  createTitle="New product"
                  emptyLabel="No products found. Create a new product."
                  loading={productsLoading}
                  options={productOptions}
                  placeholder="Search product"
                  value={draft.productName}
                  onTextChange={(value) => onDraftChange({ productName: value })}
                  onValueChange={(value, option) => onProductSelect(value, option as QuotationLookupOption | null | undefined)}
                  onCreate={onCreateProduct}
                  renderCreateForm={renderProductCreateForm}
                  trailingAction={productOptions.find((option) => option.value === draft.productName || option.label === draft.productName)?.record ? (
                    <button aria-label="Edit selected product" className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Edit selected product" type="button" onMouseDown={(event) => event.preventDefault()} onClick={(event) => { event.stopPropagation(); const record = productOptions.find((option) => option.value === draft.productName || option.label === draft.productName)?.record; if (record) onEditProduct(record); }}><ArrowUpRight className="size-4" /></button>
                  ) : undefined}
                />
              </Field>
              <Field label="Description"><Input value={draft.description} onChange={(event) => onDraftChange({ description: event.target.value })} /></Field>
              {showColour ? (
                <Field label="Colour">
                  <WorkspaceLookup
                    createLabel="Create colour"
                    createMode="inline"
                    emptyLabel="No colours found. Type a value to create it."
                    loading={coloursLoading}
                    options={colourOptions}
                    placeholder="Search colour"
                    value={draft.colour}
                    onTextChange={(value) => onDraftChange({ colour: value })}
                    onValueChange={(value, option) => onDraftChange({ colour: option?.label ?? value })}
                    onCreate={onCreateColour}
                  />
                </Field>
              ) : null}
              {showSize ? (
                <Field label="Size">
                  <WorkspaceLookup
                    createLabel="Create size"
                    createMode="inline"
                    emptyLabel="No sizes found. Type a value to create it."
                    loading={sizesLoading}
                    options={sizeOptions}
                    placeholder="Search size"
                    value={draft.size}
                    onTextChange={(value) => onDraftChange({ size: value })}
                    onValueChange={(value, option) => onDraftChange({ size: option?.label ?? value })}
                    onCreate={onCreateSize}
                  />
                </Field>
              ) : null}
              <Field label="Quantity"><Input className="text-center" inputMode="numeric" type="text" value={String(draft.quantity)} onChange={(event) => onDraftChange({ quantity: Number(event.target.value || 0) })} /></Field>
              <Field label="Price"><Input className="text-right" inputMode="decimal" type="text" value={String(draft.rate)} onChange={(event) => onDraftChange({ rate: Number(event.target.value || 0) })} /></Field>
              <div className="flex items-end gap-2 pb-0.5">
                <Button className="h-11 rounded-md bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700" type="button" onClick={onAdd}>
                  <Plus className="size-4" />
                  {editing ? "Update" : "Add"}
                </Button>
                {editing ? <Button aria-label="Cancel item edit" className="size-11 rounded-md p-0" title="Cancel item edit" type="button" variant="outline" onClick={onReset}><X className="size-4" /></Button> : null}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto rounded-md border border-border/70">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
            <thead className="bg-muted/60">
              <tr>
                {["#", ...(showPo ? ["PO"] : []), ...(showDc ? ["DC"] : []), "Particulars", "HSN Code", ...(showColour ? ["Colour"] : []), ...(showSize ? ["Size"] : []), "Qty", "Rate", "Unit", "Taxable", "GST %", ...(splitTax ? ["CGST", "SGST"] : ["IGST"]), "Total", "Action"].map((heading) => (
                  <th
                    key={heading}
                    className={cn(
                      "border-b border-r border-border/70 px-3 py-2 text-sm font-medium text-muted-foreground last:border-r-0",
                      heading === "Particulars" ? "text-left" : "text-center",
                    )}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const line = computeQuotationLine(item, taxType);
                return (
                  <tr key={`${item.productName}-${index}`} className="border-b border-border/70 last:border-b-0">
                    <td className="border-r border-border/70 px-3 py-2">{index + 1}</td>
                    {showPo ? <td className="border-r border-border/70 px-3 py-2">{item.poNo || "-"}</td> : null}
                    {showDc ? <td className="border-r border-border/70 px-3 py-2">{item.dcNo || "-"}</td> : null}
                    <td className="border-r border-border/70 px-3 py-2">{[item.productName, item.description].filter(Boolean).join(" - ")}</td>
                    <td className="border-r border-border/70 px-3 py-2 text-center">{item.hsnCode || "-"}</td>
                    {showColour ? <td className="border-r border-border/70 px-3 py-2">{item.colour || "-"}</td> : null}
                    {showSize ? <td className="border-r border-border/70 px-3 py-2">{item.size || "-"}</td> : null}
                    <td className="border-r border-border/70 px-3 py-2 text-center">{item.quantity}</td>
                    <td className="border-r border-border/70 px-3 py-2 text-right">{formatMoney(item.rate)}</td>
                    <td className="border-r border-border/70 px-3 py-2">{item.unit || "Nos"}</td>
                    <td className="border-r border-border/70 px-3 py-2 text-right">{formatMoney(line.taxableAmount)}</td>
                    <td className="border-r border-border/70 px-3 py-2 text-center">{item.taxRate}%</td>
                    {splitTax ? (
                      <>
                        <td className="border-r border-border/70 px-3 py-2 text-right">{formatMoney(line.cgstAmount)}</td>
                        <td className="border-r border-border/70 px-3 py-2 text-right">{formatMoney(line.sgstAmount)}</td>
                      </>
                    ) : (
                      <td className="border-r border-border/70 px-3 py-2 text-right">{formatMoney(line.igstAmount)}</td>
                    )}
                    <td className="border-r border-border/70 px-3 py-2 text-right font-semibold">{formatMoney(line.lineTotal)}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button className="rounded-md border border-border/70 p-1.5 text-muted-foreground hover:bg-muted" type="button" onClick={() => onEdit(index)}><Pencil className="size-4" /></button>
                        <button className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50" type="button" onClick={() => onRemove(index)}><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!items.length ? (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-muted-foreground" colSpan={11 + (showPo ? 1 : 0) + (showDc ? 1 : 0) + (showColour ? 1 : 0) + (showSize ? 1 : 0) + (splitTax ? 2 : 1)}>
                    Add quotation items to see them here.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end">
          <div className="grid w-full max-w-[25rem] gap-3 text-sm">
            <TotalRow label="Taxable amount" value={formatMoney(totals.taxableAmount)} />
            <TotalRow label="GST total" value={formatMoney(totals.taxAmount)} />
            <RoundOffRow
              manual={roundOffManual}
              suggestedValue={suggestedRoundOff}
              value={roundOff}
              onChange={onRoundOffChange}
              onReset={onResetRoundOff}
            />
            <TotalRow label="Grand total" strong value={formatMoney(grandTotal)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ children, label, required }: { children: ReactNode; label: string; required?: boolean }) {
  return <label className="block space-y-2 text-sm font-medium text-muted-foreground">{label}{required ? <span className="text-destructive"> *</span> : null}{children}</label>;
}

function StatusPill({ quotation, status }: { quotation?: Quotation; status?: Quotation["status"] }) {
  const label = quotation?.generatedSalesInvoiceNo ? "invoiced" : status ?? quotation?.status ?? "draft";
  const tone = label === "invoiced" ? "info" : label === "confirmed" ? "success" : label === "cancelled" ? "danger" : "warning";
  return <WorkspaceStatusBadge label={label} tone={tone} />;
}

function QuotationProductQuickForm({ initialValue, loading, onCancel, onSave, title }: { initialValue: QuotationMasterSavePayload; loading: boolean; onCancel: () => void; onSave: (payload: QuotationMasterSavePayload) => Promise<void>; title: string }) {
  const [form, setForm] = useState(initialValue);
  const categoriesQuery = useQuery({ queryFn: listQuotationProductCategories, queryKey: ["billing", "quotation", "lookups", "product-categories"] });
  const hsnCodesQuery = useQuery({ queryFn: listQuotationHsnCodes, queryKey: ["billing", "quotation", "lookups", "hsn-codes"] });
  const unitsQuery = useQuery({ queryFn: listQuotationUnits, queryKey: ["billing", "quotation", "lookups", "units"] });
  const taxesQuery = useQuery({ queryFn: listQuotationTaxes, queryKey: ["billing", "quotation", "lookups", "taxes"] });

  function patchProduct(next: Partial<QuotationMasterSavePayload>) { setForm((current) => ({ ...current, ...next })); }

  async function createOption(kind: "productCategories" | "hsnCodes" | "units" | "taxes", name: string) {
    const value = name.trim();
    const payload = kind === "hsnCodes"
      ? { code: value.toUpperCase(), description: value, isActive: true }
      : kind === "taxes"
        ? { description: `GST ${Number(value.replace(/%/g, "")) || 0}%`, isActive: true, ratePercent: Number(value.replace(/%/g, "")) || 0 }
        : { isActive: true, name: value };
    const created = await createQuotationLookup(kind, payload);
    const query = { productCategories: categoriesQuery, hsnCodes: hsnCodesQuery, units: unitsQuery, taxes: taxesQuery }[kind];
    await query.refetch();
    toast.success(`${kind === "productCategories" ? "Product category" : kind === "hsnCodes" ? "HSN code" : kind === "units" ? "Unit" : "GST tax rate"} saved`, { description: value });
    return created;
  }

  const categoryOptions = (categoriesQuery.data ?? []).map(quotationCommonOption);
  const hsnOptions = (hsnCodesQuery.data ?? []).map((record) => ({ ...quotationCommonOption(record), label: record.code || record.name || record.id, value: record.id }));
  const unitOptions = (unitsQuery.data ?? []).map(quotationCommonOption);
  const taxOptions = (taxesQuery.data ?? []).map((record) => ({ ...quotationCommonOption(record), label: record.name || record.code || `${record.ratePercent ?? record.taxRate ?? 0}%`, value: record.id }));

  return (
    <form className="grid gap-0" onSubmit={(event) => { event.preventDefault(); void onSave(form); }}>
      <DialogHeader className="border-b border-border/80 px-5 py-4 pr-12"><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
        <ContactQuickField label="Product name" required value={form.name} onChange={(name) => patchProduct({ name })} />
        <ProductPopupLookup label="Product category" loading={categoriesQuery.isLoading} options={categoryOptions} value={form.productCategoryId || form.productCategoryName || ""} placeholder="Search product category" onCreate={(name) => createOption("productCategories", name)} onValueChange={(value, option) => patchProduct({ productCategoryId: option?.value ?? value, productCategoryName: option?.label ?? value })} />
        <ProductPopupLookup label="HSN code" loading={hsnCodesQuery.isLoading} options={hsnOptions} value={form.hsnCodeId || form.hsnCode || ""} placeholder="Search HSN code" onCreate={(name) => createOption("hsnCodes", name)} onValueChange={(value, option) => patchProduct({ hsnCodeId: option?.value ?? value, hsnCode: option?.label ?? value })} />
        <ProductPopupLookup label="Units" loading={unitsQuery.isLoading} options={unitOptions} value={form.unitId || form.unitName || ""} placeholder="Search units" onCreate={(name) => createOption("units", name)} onValueChange={(value, option) => patchProduct({ unitId: option?.value ?? value, unitName: option?.label ?? value })} />
        <ProductPopupLookup label="GST tax rate" loading={taxesQuery.isLoading} options={taxOptions} value={form.taxId || (form.taxRate !== undefined ? String(form.taxRate) : "")} placeholder="Search GST tax rate" onCreate={(name) => createOption("taxes", name)} onValueChange={(value, option) => { const record = option?.record; patchProduct({ taxId: option?.value ?? value, taxName: option?.label ?? value, taxRate: Number(record?.ratePercent ?? record?.taxRate ?? value) || 0 }); }} />
        <ContactQuickField label="Opening price" type="number" value={String(form.openingRate)} onChange={(openingRate) => patchProduct({ openingRate: Number(openingRate || 0) })} />
      </div>
      <DialogFooter className="border-t border-border/80 px-5 py-4"><Button disabled={loading} type="button" variant="outline" onClick={onCancel}><X className="size-4" />Cancel</Button><Button disabled={loading || !form.name.trim()} type="submit"><Save className="size-4" />Save product</Button></DialogFooter>
    </form>
  );
}

function ProductPopupLookup({ label, loading, onCreate, onValueChange, options, placeholder, value }: { label: string; loading: boolean; onCreate: (name: string) => Promise<QuotationLookupRecord>; onValueChange: (value: string, option?: QuotationLookupOption | null) => void; options: QuotationLookupOption[]; placeholder: string; value: string }) {
  return <label className="grid gap-2"><Label>{label}</Label><WorkspaceLookup createLabel={`Create ${label.toLowerCase()}`} createMode="inline" emptyLabel={`No ${label.toLowerCase()} found. Type a value to create it.`} loading={loading} options={options} placeholder={placeholder} value={value} onCreate={async (name) => quotationCommonOption(await onCreate(name))} onValueChange={onValueChange} /></label>;
}

function canGenerateInvoiceFromQuotation(quotation: Quotation) {
  return quotation.status !== "cancelled" && !quotation.generatedSalesInvoiceNo;
}

function quotationContactKey(quotation: Quotation) {
  return quotation.customerName.trim().toLowerCase();
}

function buildQuotationContactFilterOptions(entries: Quotation[]) {
  const byKey = new Map<string, string>();
  for (const quotation of entries) {
    const key = quotationContactKey(quotation);
    if (!byKey.has(key)) byKey.set(key, quotation.customerName || key);
  }
  return Array.from(byKey, ([id, label]) => ({ id, label })).sort((left, right) => left.label.localeCompare(right.label));
}

function computeQuotationLine(item: QuotationSavePayload["items"][number], taxType: QuotationTaxType) {
  const taxableAmount = Number(item.quantity || 0) * Number(item.rate || 0);
  const taxAmount = taxableAmount * Number(item.taxRate || 0) / 100;
  const igstAmount = taxType === "igst" ? taxAmount : 0;
  const cgstAmount = taxType === "cgst-sgst" ? taxAmount / 2 : 0;
  const sgstAmount = taxType === "cgst-sgst" ? taxAmount / 2 : 0;
  return {
    amount: taxableAmount + taxAmount,
    cgstAmount,
    igstAmount,
    lineTotal: taxableAmount + taxAmount,
    sgstAmount,
    taxAmount,
    taxableAmount,
  };
}

function computeQuotationTotals(items: QuotationSavePayload["items"], taxType: QuotationTaxType) {
  return items.reduce(
    (totals, item) => {
      const line = computeQuotationLine(item, taxType);
      return {
        amount: totals.amount + line.amount,
        taxAmount: totals.taxAmount + line.taxAmount,
        taxableAmount: totals.taxableAmount + line.taxableAmount,
      };
    },
    { amount: 0, taxAmount: 0, taxableAmount: 0 },
  );
}

function computeSuggestedRoundOff(amount: number) {
  const rounded = Math.round(Number(amount || 0));
  return Number((rounded - Number(amount || 0)).toFixed(2));
}

function TotalRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className={cn("grid grid-cols-[1fr_auto_auto] items-center gap-4", strong && "font-semibold")}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">:</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function RoundOffRow({
  manual,
  suggestedValue,
  value,
  onChange,
  onReset,
}: {
  manual: boolean;
  suggestedValue: number;
  value: number;
  onChange: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_minmax(5.5rem,6.5rem)] items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Round off</span>
        <button className="text-xs font-medium text-orange-500 underline-offset-4 hover:text-orange-600 hover:underline" type="button" onClick={onReset}>
          Auto {manual ? formatSignedMoney(suggestedValue) : ""}
        </button>
      </div>
      <span className="text-muted-foreground">:</span>
      <Input
        className="h-8 rounded-md px-2 text-right text-sm"
        inputMode="decimal"
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function formatSignedMoney(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatMoney(value)}`;
}

