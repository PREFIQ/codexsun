import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, ChevronDown, Eye, Pencil, Plus, Printer, RefreshCw, RotateCcw, Save, Send, Sparkles, Trash2, X } from "lucide-react";
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
import { createEmptySale, createEmptySaleEinvoice, createEmptySaleEway, type Sale, type SaleEinvoiceDetails, type SaleEwayDetails, type SaleSavePayload, type SaleTaxType, type SaleView } from "./sales.types";
import { SaleShowPage } from "./sales.show";
import {
  buildSaleAddressChoices,
  findPreferredSaleAddress,
  formatSaleAddress,
  SaleAddressDialog,
  SaleAddressField,
  saleAddressDraftFromText,
  type SaleAddressDraft,
} from "./sales-address-editor";
import {
  createSale,
  createSaleAddressType,
  createSaleContact,
  createSaleLookup,
  createSaleLocation,
  deleteSale,
  formatDate,
  formatMoney,
  generateSaleEinvoice,
  generateSaleEway,
  listSaleColours,
  listSaleContacts,
  listSaleAddressTypes,
  listSaleLocations,
  listSaleHsnCodes,
  listSaleProductCategories,
  listSaleProducts,
  listSaleSizes,
  listSaleTaxes,
  listSaleTransports,
  listSaleUnits,
  listSaleWorkOrders,
  saleToPayload,
  setSaleStatus,
  revokeSale,
  totalSaleQuantity,
  updateSaleContact,
  updateSaleLookup,
  updateSale,
  type SaleContactSavePayload,
  type SaleLocationKind,
  type SaleLocationRecord,
  type SaleLookupOption,
  type SaleLookupRecord,
  type SaleMasterSavePayload,
  createSaleTransport,
  type SaleTransportSavePayload,
} from "./sales.services";
import { useSaleList } from "./sales.hooks";
import { getToken } from "../../shared/api/tenant-context";

const statusFilters = [
  { id: "all", label: "All sales" },
  { id: "draft", label: "Draft" },
  { id: "confirmed", label: "Confirmed" },
  { id: "cancelled", label: "Cancelled" },
];

const saleColumnCatalog = [
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

export function SalePage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <BillingLayout
      currentPath={pathname}
      headerTitle="Sale"
      subtitle="Create, review, print, and convert tenant-isolated sale vouchers."
      title="Billing Workspace"
    >
      <PageTitle title="Sale" />
      <SaleWorkspace />
    </BillingLayout>
  );
}

export function SaleWorkspace() {
  const queryClient = useQueryClient();
  const salesQuery = useSaleList();
  const settingsQuery = useSalesSettings();
  const settings = settingsQuery.data ?? defaultBillingSettings;
  const saleLayout = settings.layout;
  const canAdminRevoke = isAdminSession();
  const [view, setView] = useState<SaleView>({ mode: "list" });
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contactFilter, setContactFilter] = useState("all");
  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<string>>(() => new Set());
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => Object.fromEntries(saleColumnCatalog.map((column) => [column.id, true])));
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: SaleSavePayload }) => id ? updateSale(id, payload) : createSale(payload),
    onSuccess: async (sale) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["billing", "sales"] }),
        queryClient.invalidateQueries({ queryKey: ["billing", "settings"] }),
        queryClient.invalidateQueries({ queryKey: ["billing", "document-settings"] }),
      ]);
      toast.success(view.mode === "upsert" && view.sale ? "Sale updated" : "Sale created", {
        description: `${sale.saleNumber} is ready.`,
      });
      setView({ mode: "show", sale });
    },
    onError: (error) => {
      toast.error("Sale save failed", { description: error instanceof Error ? error.message : "Please try again." });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "cancelled" | "confirmed" }) => setSaleStatus(id, status),
    onSuccess: async (sale) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "sales"] });
      toast.success("Sale status updated", { description: `${sale.saleNumber} is now ${sale.status}.` });
      setView((current) => current.mode === "show" ? { mode: "show", sale } : current);
    },
    onError: (error) => {
      toast.error("Status update failed", { description: error instanceof Error ? error.message : "Please try again." });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeSale(id),
    onSuccess: async (sale) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "sales"] });
      toast.success("Sale revoked", { description: `${sale.saleNumber} is editable again.` });
    },
    onError: (error) => {
      toast.error("Sale revoke failed", { description: error instanceof Error ? error.message : "Please try again." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSale(id),
    onSuccess: async (sale) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "sales"] });
      toast.success("Sale deleted", { description: sale.saleNumber });
    },
    onError: (error) => {
      toast.error("Sale could not be deleted", { description: error instanceof Error ? error.message : "Only draft sales can be deleted." });
    },
  });

  const entries = salesQuery.data ?? [];
  const contactOptions = useMemo(() => buildSaleContactFilterOptions(entries), [entries]);
  const filteredEntries = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return entries.filter((sale) => {
      const matchesSearch = !term || [
        sale.saleNumber,
        sale.customerName,
        sale.workOrderNo,
        sale.issuedOn,
        sale.status,
        String(sale.amount),
      ].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
      const matchesContact = contactFilter === "all" || saleContactKey(sale) === contactFilter;
      return matchesSearch && matchesStatus && matchesContact;
    });
  }, [contactFilter, entries, searchValue, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / rowsPerPage));
  const pageEntries = filteredEntries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const pageTotals = useMemo(() => pageEntries.reduce(
    (totals, sale) => ({
      amount: totals.amount + sale.amount,
      quantity: totals.quantity + totalSaleQuantity(sale),
      subtotal: totals.subtotal + sale.subtotal,
      taxAmount: totals.taxAmount + sale.taxAmount,
    }),
    { amount: 0, quantity: 0, subtotal: 0, taxAmount: 0 },
  ), [pageEntries]);
  const selectedEntries = useMemo(() => entries.filter((sale) => selectedSaleIds.has(sale.id)), [entries, selectedSaleIds]);
  const pageSelectableEntries = pageEntries.filter(canGenerateInvoiceFromSale);
  const pageSelected = pageSelectableEntries.length > 0 && pageSelectableEntries.every((sale) => selectedSaleIds.has(sale.id));

  useEffect(() => {
    setSelectedSaleIds((current) => {
      const available = new Set(entries.map((sale) => sale.id));
      const next = new Set(Array.from(current).filter((id) => available.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [entries]);

  async function openNewSale() {
    await settingsQuery.refetch();
    setView({ mode: "upsert", sale: null, returnTo: "list" });
  }

  function toggleSaleSelection(sale: Sale, checked: boolean) {
    if (!canGenerateInvoiceFromSale(sale)) return;
    setSelectedSaleIds((current) => {
      const next = new Set(current);
      if (checked) next.add(sale.id);
      else next.delete(sale.id);
      return next;
    });
  }

  function togglePageSelection(checked: boolean) {
    setSelectedSaleIds((current) => {
      const next = new Set(current);
      for (const sale of pageSelectableEntries) {
        if (checked) next.add(sale.id);
        else next.delete(sale.id);
      }
      return next;
    });
  }

  if (view.mode === "show") {
    const freshSale = entries.find((entry) => entry.id === view.sale.id) ?? view.sale;
    const currentIndex = entries.findIndex((entry) => entry.id === freshSale.id);
    const previousSale = currentIndex > 0 ? entries[currentIndex - 1] : null;
    const nextSale = currentIndex >= 0 && currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null;
    return (
      <SaleShowPage
        sale={freshSale}
        onBack={() => setView({ mode: "list" })}
        onEdit={() => setView({ mode: "upsert", sale: freshSale, returnTo: "show" })}
        onNew={() => void openNewSale()}
        onPrint={() => window.print()}
        onSuspend={() => statusMutation.mutate({ id: freshSale.id, status: "cancelled" })}
        canEdit={freshSale.status === "draft"}
        {...(previousSale ? { onPrevious: () => setView({ mode: "show", sale: previousSale }) } : {})}
        {...(nextSale ? { onNext: () => setView({ mode: "show", sale: nextSale }) } : {})}
      />
    );
  }

  if (view.mode === "upsert") {
    return (
        <SaleUpsertPage
        errorMessage={saveMutation.error instanceof Error ? saveMutation.error.message : ""}
        loading={saveMutation.isPending}
        sale={view.sale}
        settings={saleLayout}
        numbering={settings.numbering.sales}
        canAdminRevoke={canAdminRevoke}
        {...(view.sale && canAdminRevoke ? { onRevoke: () => revokeMutation.mutate(view.sale!.id) } : {})}
        onBack={() => setView(view.returnTo === "show" && view.sale ? { mode: "show", sale: view.sale } : { mode: "list" })}
        onSubmit={(payload, printAfter) => {
          saveMutation.mutate(view.sale ? { id: view.sale.id, payload } : { payload }, {
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
      title="Sales"
      description="Create and review tenant-isolated sale vouchers with sales layout controls."
      technicalName="page.billing.sale.list"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button className="h-9 rounded-md" disabled={salesQuery.isFetching} onClick={() => void salesQuery.refetch()} type="button" variant="outline">
            <RefreshCw className={cn("size-4", salesQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button className="h-9 rounded-md" onClick={() => void openNewSale()} type="button">
            <Plus className="size-4" />
            New sale
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
        searchPlaceholder="Search sale, customer, work order, date, or total"
        searchValue={searchValue}
        columnOptions={saleColumnCatalog.map((column) => ({ ...column, checked: Boolean(visibleColumns[column.id]), onCheckedChange: (checked: boolean) => setVisibleColumns((current) => ({ ...current, [column.id]: checked })) }))}
        onShowAllColumns={() => setVisibleColumns(Object.fromEntries(saleColumnCatalog.map((column) => [column.id, true])))}
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
                  setSelectedSaleIds(new Set());
                  setCurrentPage(1);
                }
              }}
              onValueChange={(value) => {
                setContactFilter(value || "all");
                setSelectedSaleIds(new Set());
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{selectedEntries.length} selected</span>
          <Button className="h-8 rounded-md px-2" disabled={!selectedEntries.length} onClick={() => setSelectedSaleIds(new Set())} type="button" variant="ghost">Clear</Button>
        </div>
      </div>
      {salesQuery.isError ? (
        <WorkspaceTablePanel>
          <WorkspaceTableEmptyState>{salesQuery.error instanceof Error ? salesQuery.error.message : "Sales could not be loaded."}</WorkspaceTableEmptyState>
        </WorkspaceTablePanel>
      ) : null}
      <SaleList
        entries={pageEntries}
        loading={salesQuery.isLoading}
        onEdit={(sale) => setView({ mode: "upsert", sale, returnTo: "list" })}
        onSetStatus={(sale, status) => statusMutation.mutate({ id: sale.id, status })}
        onForceDelete={(sale) => {
          if (window.confirm(`Force delete ${sale.saleNumber}? This cannot be undone.`)) deleteMutation.mutate(sale.id);
        }}
        onRevoke={(sale) => revokeMutation.mutate(sale.id)}
        canAdminRevoke={canAdminRevoke}
        onView={(sale) => setView({ mode: "show", sale })}
        page={currentPage}
        rowsPerPage={rowsPerPage}
        pageSelected={pageSelected}
        pageSelectableCount={pageSelectableEntries.length}
        selectedSaleIds={selectedSaleIds}
        onTogglePageSelection={togglePageSelection}
        onToggleSelection={toggleSaleSelection}
        visibleColumns={visibleColumns}
      />
      <SalePageTotals amount={pageTotals.amount} quantity={pageTotals.quantity} subtotal={pageTotals.subtotal} taxAmount={pageTotals.taxAmount} />
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filteredEntries.length)}
        singularLabel="sales"
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

function SalePageTotals({ amount, quantity, subtotal, taxAmount }: { amount: number; quantity: number; subtotal: number; taxAmount: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-border/70 bg-card px-4 py-2.5 shadow-sm md:grid-cols-4">
      <PageTotal label="Total quantity" value={String(quantity)} />
      <PageTotal label="Total taxable" value={formatMoney(subtotal)} />
      <PageTotal label="Total GST" value={formatMoney(taxAmount)} />
      <PageTotal label="Grand total" strong value={formatMoney(amount)} />
    </div>
  );
}

export const SalesPage = SalePage;

function PageTotal({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex h-full items-center justify-start gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-foreground", strong && "font-semibold")}>{value}</span>
    </div>
  );
}

function SaleList({ canAdminRevoke, entries, loading, onEdit, onForceDelete, onRevoke, onSetStatus, onView, page, pageSelected, pageSelectableCount, rowsPerPage, selectedSaleIds, onTogglePageSelection, onToggleSelection, visibleColumns }: { canAdminRevoke: boolean; entries: Sale[]; loading: boolean; onEdit: (sale: Sale) => void; onForceDelete: (sale: Sale) => void; onRevoke: (sale: Sale) => void; onSetStatus: (sale: Sale, status: "cancelled" | "confirmed") => void; onView: (sale: Sale) => void; page: number; pageSelected: boolean; pageSelectableCount: number; rowsPerPage: number; selectedSaleIds: Set<string>; onTogglePageSelection: (checked: boolean) => void; onToggleSelection: (sale: Sale, checked: boolean) => void; visibleColumns: Record<string, boolean> }) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12 border-b border-border/70 px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <input aria-label="Select sales on this page" checked={pageSelected} className="size-4 accent-primary disabled:cursor-not-allowed disabled:opacity-40" disabled={pageSelectableCount === 0} onChange={(event) => onTogglePageSelection(event.target.checked)} type="checkbox" />
              </th>
              { ["Sale", ...(visibleColumns.customer ? ["Customer"] : []), ...(visibleColumns.issuedOn ? ["Date"] : []), ...(visibleColumns.items ? ["Items"] : []), ...(visibleColumns.taxable ? ["Taxable"] : []), ...(visibleColumns.gst ? ["GST"] : []), ...(visibleColumns.total ? ["Total"] : []), ...(visibleColumns.status ? ["Status"] : []), ...(visibleColumns.invoice ? ["Invoice"] : []), ...(visibleColumns.action ? ["Action"] : [])].map((heading) => (
                <th key={heading} className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((sale, index) => (
              <tr key={sale.id} className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/20">
                <td className="px-4 py-2.5 text-center">
                  <input aria-label={`Select ${sale.saleNumber}`} checked={selectedSaleIds.has(sale.id)} className="size-4 accent-primary disabled:cursor-not-allowed disabled:opacity-40" disabled={!canGenerateInvoiceFromSale(sale)} onChange={(event) => onToggleSelection(sale, event.target.checked)} title={sale.generatedSalesInvoiceNo ? `Already invoiced by ${sale.generatedSalesInvoiceNo}` : undefined} type="checkbox" />
                </td>
                <td className="px-4 py-2.5">
                  <button className="font-semibold text-foreground underline-offset-4 hover:underline" onClick={() => onView(sale)} title="View sale" type="button">{sale.saleNumber}</button>
                </td>
                {visibleColumns.customer ? <td className="px-4 py-2.5">
                  <button className={cn("font-medium underline-offset-4", sale.status === "draft" ? "hover:underline" : "cursor-not-allowed text-muted-foreground")} disabled={sale.status !== "draft"} onClick={() => onEdit(sale)} title={sale.status === "draft" ? "Edit sale" : "Submitted sales cannot be edited"} type="button">{sale.customerName}</button>
                </td> : null}
                {visibleColumns.issuedOn ? <td className="px-4 py-2.5">{formatDate(sale.issuedOn)}</td> : null}
                {visibleColumns.items ? <td className="px-4 py-2.5">{totalSaleQuantity(sale)}</td> : null}
                {visibleColumns.taxable ? <td className="px-4 py-2.5">{formatMoney(sale.subtotal)}</td> : null}
                {visibleColumns.gst ? <td className="px-4 py-2.5">{formatMoney(sale.taxAmount)}</td> : null}
                {visibleColumns.total ? <td className="px-4 py-2.5 font-semibold">{formatMoney(sale.amount)}</td> : null}
                {visibleColumns.status ? <td className="px-4 py-2.5"><StatusPill sale={sale} /></td> : null}
                {visibleColumns.invoice ? <td className="px-4 py-2.5 font-semibold text-sky-700">{sale.generatedSalesInvoiceNo || "-"}</td> : null}
                {visibleColumns.action ? <td className="px-4 py-2.5">
                  <WorkspaceRowActions
                    actions={[
                      ...(sale.status === "draft" ? [{ id: "confirm", label: "Confirm", icon: <Eye className="size-4" />, onSelect: () => onSetStatus(sale, "confirmed") }] : []),
                      ...(canAdminRevoke && sale.status === "confirmed" && !sale.generatedSalesInvoiceNo ? [{ id: "revoke", label: "Revoke by admin", icon: <RotateCcw className="size-4" />, onSelect: () => onRevoke(sale) }] : []),
                      ...(sale.status !== "cancelled" && !sale.generatedSalesInvoiceNo ? [{ id: "suspend", label: "Suspend", icon: <Trash2 className="size-4" />, tone: "destructive" as const, onSelect: () => onSetStatus(sale, "cancelled") }] : []),
                      ...(sale.status === "draft" ? [{ id: "force-delete", label: "Force delete", icon: <Trash2 className="size-4" />, tone: "destructive" as const, onSelect: () => onForceDelete(sale) }] : []),
                    ]}
                    {...(sale.status === "draft" ? { onEdit: () => onEdit(sale) } : {})}
                    onView={() => onView(sale)}
                    title={sale.saleNumber}
                  />
                </td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.length === 0 ? <WorkspaceTableEmptyState>{loading ? "Loading sales..." : "No sales found."}</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}

function SaleUpsertPage({ canAdminRevoke, errorMessage, loading, numbering, onBack, onRevoke, onSubmit, sale, settings }: { canAdminRevoke: boolean; errorMessage: string; loading: boolean; numbering: BillingDocumentNumberSettings; onBack: () => void; onRevoke?: () => void; onSubmit: (payload: SaleSavePayload, printAfter?: boolean) => void; sale: Sale | null; settings: BillingDocumentLayoutSettings }) {
  const [activeTab, setActiveTab] = useState("details");
  const [workflowAction, setWorkflowAction] = useState<"draft" | "submit" | "revoke">(sale?.status === "confirmed" ? "revoke" : "draft");
  const [form, setForm] = useState<SaleSavePayload>(() => sale ? saleToPayload(sale) : {
    ...createEmptySale(),
    saleNumber: numbering.automatic ? formatDocumentNumber(numbering) : createEmptySale().saleNumber,
  });
  useEffect(() => {
    if (sale || !numbering.automatic) return;
    const nextSaleNumber = formatDocumentNumber(numbering);
    setForm((current) => current.saleNumber === nextSaleNumber ? current : { ...current, saleNumber: nextSaleNumber });
  }, [numbering, sale]);
  const [itemDraft, setItemDraft] = useState(() => createEmptySale().items[0] ?? {
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
  const [editingContact, setEditingContact] = useState<SaleLookupOption["record"] | null>(null);
  const [editingProduct, setEditingProduct] = useState<SaleLookupRecord | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<SaleLookupRecord | null>(null);
  const [editingAddressKind, setEditingAddressKind] = useState<"billing" | "shipping" | null>(null);
  const [roundOffManual, setRoundOffManual] = useState(Boolean(sale && Number(sale.roundOff || 0) !== 0));
  const [billingAddressDraft, setBillingAddressDraft] = useState<SaleAddressDraft>(() => saleAddressDraftFromText(form.billingAddress, "Billing"));
  const [shippingAddressDraft, setShippingAddressDraft] = useState<SaleAddressDraft>(() => saleAddressDraftFromText(form.shippingAddress, "Shipping"));
  const [billingAddressChoice, setBillingAddressChoice] = useState("");
  const [shippingAddressChoice, setShippingAddressChoice] = useState("");
  const contactsQuery = useQuery({ queryFn: listSaleContacts, queryKey: ["billing", "sale", "lookups", "contacts"] });
  const workOrdersQuery = useQuery({ queryFn: listSaleWorkOrders, queryKey: ["billing", "sale", "lookups", "work-orders"] });
  const productsQuery = useQuery({ queryFn: listSaleProducts, queryKey: ["billing", "sale", "lookups", "products"] });
  const coloursQuery = useQuery({ queryFn: listSaleColours, queryKey: ["billing", "sale", "lookups", "colours"] });
  const sizesQuery = useQuery({ queryFn: listSaleSizes, queryKey: ["billing", "sale", "lookups", "sizes"] });
  const transportsQuery = useQuery({ queryFn: listSaleTransports, queryKey: ["billing", "sale", "lookups", "transports"] });
  const contactSaveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: SaleContactSavePayload }) => id ? updateSaleContact(id, payload) : createSaleContact(payload),
  });
  const masterSaveMutation = useMutation({
    mutationFn: ({ id, kind, payload }: { id?: string; kind: "products" | "workOrders"; payload: SaleMasterSavePayload }) =>
      id ? updateSaleLookup(kind, id, masterPayload(kind, payload)) : createSaleLookup(kind, masterPayload(kind, payload)),
  });
  const transportSaveMutation = useMutation({ mutationFn: createSaleTransport });
  const complianceMutation = useMutation({ mutationFn: ({ id, kind, details }: { id: string; kind: "einvoice" | "eway"; details: SaleEinvoiceDetails | SaleEwayDetails }) => kind === "einvoice" ? generateSaleEinvoice(id, details as SaleEinvoiceDetails) : generateSaleEway(id, details as SaleEwayDetails) });
  const selectedContact = (contactsQuery.data ?? []).find((option) => option.value === form.customerName || option.label === form.customerName);
  const selectedWorkOrder = (workOrdersQuery.data ?? []).find((option) => option.value === form.workOrderNo || option.label === form.workOrderNo);
  const contactAddressChoices = useMemo(() => buildSaleAddressChoices(selectedContact?.record), [selectedContact?.record]);
  const itemTotals = useMemo(() => computeSaleTotals(form.items, form.taxType), [form.items, form.taxType]);
  const suggestedRoundOff = useMemo(() => computeSuggestedRoundOff(itemTotals.amount), [itemTotals.amount]);
  const eway = form.eway ?? createEmptySaleEway();
  const einvoice = form.einvoice ?? createEmptySaleEinvoice();
  const selectedTransport = (transportsQuery.data ?? []).find((option) => option.value === eway.transport || option.label === eway.transport);

  function patch(next: Partial<SaleSavePayload>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function patchDraft(next: Partial<typeof itemDraft>) {
    setItemDraft((current) => ({ ...current, ...next }));
  }

  useEffect(() => {
    if (roundOffManual) return;
    setForm((current) => current.roundOff === suggestedRoundOff ? current : { ...current, roundOff: suggestedRoundOff });
  }, [roundOffManual, suggestedRoundOff]);

  function applyAddressDraft(kind: "billing" | "shipping", draft: SaleAddressDraft, choiceValue = "") {
    const formatted = formatSaleAddress(draft);
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

  function applyContactAddresses(record?: SaleLookupRecord | null) {
    const choices = buildSaleAddressChoices(record);
    const preferredBilling = findPreferredSaleAddress(choices, "Billing");
    const preferredShipping = findPreferredSaleAddress(choices, "Shipping");
    if (preferredBilling) applyAddressDraft("billing", preferredBilling.draft, preferredBilling.value);
    if (preferredShipping) applyAddressDraft("shipping", preferredShipping.draft, preferredShipping.value);
  }

  function applyContactSelection(value: string, option?: SaleLookupOption | null) {
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

  function patchEway(next: Partial<SaleEwayDetails>) {
    patch({ eway: { ...eway, ...next } });
  }

  function patchEinvoice(next: Partial<SaleEinvoiceDetails>) {
    patch({ einvoice: { ...einvoice, ...next } });
  }

  async function generateEway() {
    if (!sale) { toast.error("Save the sale before generating the E-way bill."); return; }
    try {
      const updated = await complianceMutation.mutateAsync({ id: sale.id, kind: "eway", details: eway });
      patch({ eway: updated.eway, einvoice: updated.einvoice });
      toast.success("E-way bill generated");
    } catch (error) {
      toast.error("E-way generation failed", { description: error instanceof Error ? error.message : "Please check WhiteBooks settings." });
    }
  }

  async function generateEinvoice() {
    if (!sale) { toast.error("Save the sale before generating the E-invoice."); return; }
    try {
      const updated = await complianceMutation.mutateAsync({ id: sale.id, kind: "einvoice", details: einvoice });
      patch({ einvoice: updated.einvoice });
      toast.success("E-invoice generated");
    } catch (error) {
      toast.error("E-invoice generation failed", { description: error instanceof Error ? error.message : "Please check WhiteBooks settings." });
    }
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

  function applyProductSelection(value: string, option?: SaleLookupOption | null) {
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
                createDescription="Add contact details and address without leaving this sale."
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
                onValueChange={(value, option) => applyContactSelection(value, option as SaleLookupOption | null | undefined)}
                renderCreateForm={({ initialName, onCancel, onCreated }) => (
                  <SaleContactQuickForm
                    initialValue={contactDraftFromRecord(undefined, initialName)}
                    loading={contactSaveMutation.isPending}
                    onCancel={onCancel}
                    onSave={async (payload) => {
                      const created = await contactSaveMutation.mutateAsync({ payload });
                      await contactsQuery.refetch();
                      const option = saleContactOption(created);
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
                createDescription="Add a work order without leaving this sale."
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
                  <SaleMasterQuickForm
                    kind="workOrders"
                    initialValue={masterDraftFromRecord(undefined, initialName)}
                    loading={masterSaveMutation.isPending}
                    onCancel={onCancel}
                    onSave={async (payload) => {
                      const created = await masterSaveMutation.mutateAsync({ kind: "workOrders", payload });
                      await workOrdersQuery.refetch();
                      const option = saleWorkOrderOption(created);
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
            <Field label="Sale number"><Input value={form.saleNumber} onChange={(event) => patch({ saleNumber: event.target.value.toUpperCase() })} /></Field>
            <Field label="Date"><WorkspaceDatePicker value={form.issuedOn} onValueChange={(value) => patch({ issuedOn: value })} /></Field>
            <Field label="Sale tax type">
              <WorkspaceSelect
                value={form.taxType}
                options={[{ label: "CGST + SGST", value: "cgst-sgst" }, { label: "IGST", value: "igst" }]}
                onValueChange={(taxType) => patch({ taxType: taxType as SaleTaxType })}
              />
            </Field>
          </div>
          </div>
          <SaleItemsSection
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
            const created = await createSaleLookup("colours", { isActive: true, name });
            await coloursQuery.refetch();
            toast.success("Colour saved", { description: name });
            return saleCommonOption(created);
          }}
          onCreateProduct={async (name) => {
            const created = await masterSaveMutation.mutateAsync({ kind: "products", payload: masterDraftFromRecord(undefined, name) });
            await productsQuery.refetch();
            toast.success("Product saved", { description: name });
            return saleProductOption(created);
          }}
          renderProductCreateForm={({ initialName, onCancel, onCreated }) => (
            <SaleProductQuickForm
              initialValue={masterDraftFromRecord(undefined, initialName)}
              loading={masterSaveMutation.isPending}
              onCancel={onCancel}
              onSave={async (payload) => {
                const created = await masterSaveMutation.mutateAsync({ kind: "products", payload });
                await productsQuery.refetch();
                const option = saleProductOption(created);
                onCreated(option);
                toast.success("Product saved", { description: option.label });
              }}
              title="New product"
            />
          )}
          onCreateSize={async (name) => {
            const created = await createSaleLookup("sizes", { isActive: true, name });
            await sizesQuery.refetch();
            toast.success("Size saved", { description: name });
            return saleCommonOption(created);
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
          <SaleAddressField
            choices={contactAddressChoices}
            description={form.billingAddress}
            disabled={!selectedContact?.record}
            label="Billing address"
            selectedValue={billingAddressChoice}
            onEdit={() => setEditingAddressKind("billing")}
            onSelect={(choice) => applyAddressDraft("billing", choice.draft, choice.value)}
          />
          <SaleAddressField
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
    ...(settings.useEway ? [{
      value: "eway",
      label: "E-way",
      content: <SaleEwayTab value={eway} onChange={patchEway} onGenerate={generateEway} options={transportsQuery.data ?? []} loading={transportsQuery.isLoading} selected={selectedTransport} onTransportChange={(value, option) => patchEway({ transport: option?.label ?? value, transportGst: option?.record?.gst ?? "" })} onCreateTransport={async (payload) => { const created = await transportSaveMutation.mutateAsync(payload); await transportsQuery.refetch(); return { description: created.gst || created.vehicleNo || "", label: created.name || created.id, meta: created.gst || "", value: created.name || created.id, record: created }; }} />,
    }] : []),
    ...(settings.useEinvoice ? [{
      value: "einvoice",
      label: "E-invoice",
      content: <SaleEinvoiceTab value={einvoice} onChange={patchEinvoice} onGenerate={generateEinvoice} />,
    }] : []),
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

  function submit(printAfter = false, status: SaleSavePayload["status"] = form.status) {
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
      title={sale ? "Edit Sale" : "New Sale"}
      description="Create or update a tenant-isolated sale voucher."
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
                  aria-label="Sale workflow action"
                  className={cn(
                    "h-8 w-20 min-w-20 justify-center gap-1 px-2 text-xs transition-[background-color,border-color,color,transform] duration-300 ease-out",
                    workflowAction === "draft" && "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100",
                    workflowAction === "submit" && "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                    workflowAction === "revoke" && "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
                  )}
                  disabled={loading}
                  title="Sale workflow action"
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
                {(workflowAction === "submit" || sale?.status === "confirmed") && !sale?.generatedSalesInvoiceNo ? <><DropdownMenuSeparator /><DropdownMenuItem className="gap-1 px-2 text-xs" onSelect={() => setWorkflowAction("revoke")}><RotateCcw className="size-4" />Revoke</DropdownMenuItem></> : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </WorkspaceFormActions>
        <Dialog open={Boolean(editingContact)} onOpenChange={(open) => !open && setEditingContact(null)}>
          <DialogContent className="rounded-md p-0 sm:max-w-3xl" onInteractOutside={(event) => event.preventDefault()}>
            {editingContact ? (
              <SaleContactQuickForm
                initialValue={contactDraftFromRecord(editingContact)}
                loading={contactSaveMutation.isPending}
                onCancel={() => setEditingContact(null)}
                onSave={async (payload) => {
                  const saved = await contactSaveMutation.mutateAsync({ id: editingContact.id, payload });
                  await contactsQuery.refetch();
                  patch({ customerName: saleContactOption(saved).label });
                  applyContactAddresses(saved);
                  setEditingContact(null);
                  toast.success("Contact saved", { description: saleContactOption(saved).label });
                }}
                title="Edit contact"
              />
            ) : null}
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(editingProduct)} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="rounded-md p-0 sm:max-w-3xl" onInteractOutside={(event) => event.preventDefault()}>
            {editingProduct ? <SaleProductQuickForm initialValue={masterDraftFromRecord(editingProduct)} loading={masterSaveMutation.isPending} onCancel={() => setEditingProduct(null)} onSave={async (payload) => { const saved = await masterSaveMutation.mutateAsync({ id: editingProduct.id, kind: "products", payload }); await productsQuery.refetch(); patchDraft({ productName: saleProductOption(saved).label }); setEditingProduct(null); toast.success("Product saved", { description: saleProductOption(saved).label }); }} title="Edit product" /> : null}
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(editingWorkOrder)} onOpenChange={(open) => !open && setEditingWorkOrder(null)}>
          <DialogContent className="rounded-md p-0 sm:max-w-3xl" onInteractOutside={(event) => event.preventDefault()}>
            {editingWorkOrder ? <SaleMasterQuickForm kind="workOrders" initialValue={masterDraftFromRecord(editingWorkOrder)} loading={masterSaveMutation.isPending} onCancel={() => setEditingWorkOrder(null)} onSave={async (payload) => { const saved = await masterSaveMutation.mutateAsync({ id: editingWorkOrder.id, kind: "workOrders", payload }); await workOrdersQuery.refetch(); patch({ workOrderNo: saleWorkOrderOption(saved).value }); setEditingWorkOrder(null); toast.success("Work order saved", { description: saleWorkOrderOption(saved).label }); }} title="Edit work order" /> : null}
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(editingAddressKind)} onOpenChange={(open) => !open && setEditingAddressKind(null)}>
          <DialogContent className="rounded-md p-0 sm:max-w-3xl" onInteractOutside={(event) => event.preventDefault()}>
            {editingAddressKind ? (
              <SaleAddressDialog
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

function SaleContactQuickForm({ initialValue, loading, onCancel, onSave, title }: { initialValue: SaleContactSavePayload; loading: boolean; onCancel: () => void; onSave: (payload: SaleContactSavePayload) => Promise<void>; title: string }) {
  const [form, setForm] = useState(initialValue);
  const [activeTab, setActiveTab] = useState("details");
  const [legalNameManual, setLegalNameManual] = useState(Boolean(initialValue.legalName && initialValue.legalName !== initialValue.name.toUpperCase()));
  const addressTypesQuery = useQuery({ queryFn: listSaleAddressTypes, queryKey: ["billing", "sale", "lookups", "address-types"] });
  const countriesQuery = useQuery({ queryFn: () => listSaleLocations("countries"), queryKey: ["billing", "sale", "lookups", "countries"] });
  const statesQuery = useQuery({ queryFn: () => listSaleLocations("states"), queryKey: ["billing", "sale", "lookups", "states"] });
  const districtsQuery = useQuery({ queryFn: () => listSaleLocations("districts"), queryKey: ["billing", "sale", "lookups", "districts"] });
  const citiesQuery = useQuery({ queryFn: () => listSaleLocations("cities"), queryKey: ["billing", "sale", "lookups", "cities"] });
  const pincodesQuery = useQuery({ queryFn: () => listSaleLocations("pincodes"), queryKey: ["billing", "sale", "lookups", "pincodes"] });

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

  async function createLocation(kind: SaleLocationKind, name: string) {
    const dependency = kind === "states" ? form.countryId : kind === "districts" ? form.stateId : kind === "cities" ? form.districtId : form.cityId;
    if (!dependency) {
      toast.error(`Select ${kind === "states" ? "India" : kind === "districts" ? "a state" : kind === "cities" ? "a district" : "a city"} first.`);
      return undefined;
    }
    const created = await createSaleLocation(kind, locationPayload(kind, name, form));
    await ({ cities: citiesQuery, districts: districtsQuery, pincodes: pincodesQuery, states: statesQuery }[kind]).refetch();
    toast.success(`${kind === "pincodes" ? "Pincode" : kind.slice(0, -1)} saved`, { description: name });
    return saleLocationOption(created);
  }

  const tabs: WorkspaceAnimatedTab[] = [
    {
      content: (
        <div className="grid gap-4">
          <ContactQuickField label="Contact name" required value={form.name} onChange={(name) => setForm((current) => ({ ...current, name, ...(!legalNameManual ? { legalName: name.toUpperCase() } : {}) }))} />
          <ContactQuickField forceUppercase label="Legal name" value={form.legalName} onChange={(legalName) => { setLegalNameManual(true); setForm((current) => ({ ...current, legalName })); }} onMagic={() => { setLegalNameManual(false); setForm((current) => ({ ...current, legalName: current.name.trim().toUpperCase() })); }} />
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
              options={(addressTypesQuery.data ?? []).filter((record) => record.isActive !== false).map(saleContactOption)}
              placeholder="Search address type"
              value={form.addressTypeName}
              onCreate={async (name) => {
                const created = await createSaleAddressType(name);
                await addressTypesQuery.refetch();
                toast.success("Address type saved", { description: name });
                return saleContactOption(created);
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

function ContactQuickField({ className, forceUppercase = false, label, onChange, onMagic, required, type = "text", value }: { className?: string; forceUppercase?: boolean; label: string; onChange: (value: string) => void; onMagic?: () => void; required?: boolean; type?: string; value: string }) {
  return (
    <label className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-2"><Label>{label}{required ? <span className="text-destructive"> *</span> : null}</Label>{onMagic ? <Button aria-label="Refresh legal name from contact name" className="size-7 rounded-md p-0" onClick={(event) => { event.preventDefault(); onMagic(); }} title="Refresh legal name from contact name" type="button" variant="outline"><Sparkles className="size-3.5" /></Button> : null}</div>
      <Input autoCapitalize={forceUppercase ? "characters" : "none"} autoFocus={label === "Contact name"} className={cn("h-11 rounded-md", forceUppercase && "uppercase")} required={required} type={type} value={value} onChange={(event) => onChange(forceUppercase ? event.target.value.toUpperCase() : event.target.value)} />
    </label>
  );
}

function ContactLocationLookup({ kind, label, loading, onCreate, onPick, options, value }: { kind: SaleLocationKind; label: string; loading: boolean; onCreate: (kind: SaleLocationKind, name: string) => Promise<SaleLookupOption | undefined>; onPick: (record: SaleLocationRecord) => void; options: SaleLocationRecord[]; value: string }) {
  const lookupOptions = options.filter((record) => record.status !== "inactive").map(saleLocationOption);
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
          const record = ((option as SaleLookupOption | undefined)?.record as SaleLocationRecord | undefined) ?? options.find((item) => item.id === selected);
          if (record) onPick(record);
        }}
      />
    </label>
  );
}

function saleLocationOption(record: SaleLocationRecord): SaleLookupOption {
  const label = record.name || record.pincode || record.code;
  return {
    label,
    record,
    value: record.id,
  };
}

function locationPayload(kind: SaleLocationKind, name: string, form: SaleContactSavePayload) {
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

function locationPatch(kind: SaleLocationKind, record: SaleLocationRecord, form: SaleContactSavePayload): SaleContactSavePayload {
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

function contactDraftFromRecord(record?: SaleLookupRecord, initialName = ""): SaleContactSavePayload {
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

function saleContactOption(record: SaleLookupRecord): SaleLookupOption {
  const label = record.name || record.code || record.id;
  return {
    description: record.primaryPhone || record.primaryEmail || "",
    label,
    meta: record.code || "",
    record,
    value: label,
  };
}

function SaleMasterQuickForm({ initialValue, kind, loading, onCancel, onSave, title }: { initialValue: SaleMasterSavePayload; kind: "products" | "workOrders"; loading: boolean; onCancel: () => void; onSave: (payload: SaleMasterSavePayload) => Promise<void>; title: string }) {
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

function masterDraftFromRecord(record?: SaleLookupRecord, initialName = ""): SaleMasterSavePayload {
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

function masterPayload(kind: "products" | "workOrders", payload: SaleMasterSavePayload) {
  return kind === "products"
    ? { code: payload.code.trim(), hsnCode: payload.hsnCode.trim(), hsnCodeId: payload.hsnCodeId || null, isActive: true, name: payload.name.trim(), openingRate: Number(payload.openingRate || 0), productCategoryId: payload.productCategoryId || null, productCategoryName: payload.productCategoryName?.trim() || null, taxId: payload.taxId || null, taxName: payload.taxName?.trim() || null, taxRate: Number(payload.taxRate || 0), unitId: payload.unitId || null, unitName: payload.unitName.trim() }
    : { code: payload.code.trim(), isActive: true, name: payload.name.trim(), typeName: payload.typeName.trim() };
}

function saleProductOption(record: SaleLookupRecord): SaleLookupOption {
  const label = record.name || record.code || record.id;
  return { description: [record.hsnCode, record.unitName].filter(Boolean).join(" | "), label, meta: record.code || "", record, value: label };
}

function saleWorkOrderOption(record: SaleLookupRecord): SaleLookupOption {
  const value = record.code || record.workOrderNo || record.name || record.id;
  return { description: record.name || record.typeName || "", label: value, meta: record.typeName || "", record, value };
}

function saleCommonOption(record: SaleLookupRecord): SaleLookupOption {
  const label = record.name || record.code || record.id;
  return { label, record, value: label };
}

function SaleItemsSection({
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
  colourOptions: SaleLookupOption[];
  coloursLoading: boolean;
  draft: SaleSavePayload["items"][number];
  editing: boolean;
  items: SaleSavePayload["items"];
  productOptions: SaleLookupOption[];
  productsLoading: boolean;
  resetSignal: number;
  settings: BillingDocumentLayoutSettings;
  sizeOptions: SaleLookupOption[];
  sizesLoading: boolean;
  taxType: SaleTaxType;
  roundOff: number;
  roundOffManual: boolean;
  suggestedRoundOff: number;
  onAdd: () => void;
  onCreateColour: (name: string) => Promise<SaleLookupOption | undefined>;
  onCreateProduct: (name: string) => Promise<SaleLookupOption | undefined>;
  onCreateSize: (name: string) => Promise<SaleLookupOption | undefined>;
  renderProductCreateForm: (context: { initialName: string; onCancel: () => void; onCreated: (option: SaleLookupOption) => void }) => ReactNode;
  onDraftChange: (next: Partial<SaleSavePayload["items"][number]>) => void;
  onEditProduct: (record: SaleLookupRecord) => void;
  onEdit: (index: number) => void;
  onProductSelect: (value: string, option?: SaleLookupOption | null) => void;
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
  const totals = computeSaleTotals(items, taxType);
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
        <h3 className="text-lg font-semibold tracking-normal text-foreground underline decoration-foreground/70 underline-offset-4">Sale Items</h3>
        <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1 pt-1.5">
          <div className="min-w-[980px]">
            <div ref={rowRef} className="grid gap-1" style={{ gridTemplateColumns: templateColumns }}>
              {showPo ? <Field label="PO"><Input value={draft.poNo} onChange={(event) => onDraftChange({ poNo: event.target.value })} /></Field> : null}
              {showDc ? <Field label="DC"><Input value={draft.dcNo} onChange={(event) => onDraftChange({ dcNo: event.target.value })} /></Field> : null}
              <Field label="Product name">
                <WorkspaceLookup
                  createDescription="Add a product without leaving this sale."
                  createLabel="New product"
                  createMode="popup"
                  createTitle="New product"
                  emptyLabel="No products found. Create a new product."
                  loading={productsLoading}
                  options={productOptions}
                  placeholder="Search product"
                  value={draft.productName}
                  onTextChange={(value) => onDraftChange({ productName: value })}
                  onValueChange={(value, option) => onProductSelect(value, option as SaleLookupOption | null | undefined)}
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
                const line = computeSaleLine(item, taxType);
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
                    Add sale items to see them here.
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

function SaleTransportQuickForm({ initialName, onCancel, onCreated, onSave }: { initialName: string; onCancel: () => void; onCreated: (option: SaleLookupOption) => void; onSave: (payload: SaleTransportSavePayload) => Promise<SaleLookupOption> }) {
  const [form, setForm] = useState<SaleTransportSavePayload>({ address: "", contactNo: "", contactPerson: "", gst: "", name: initialName, vehicleNo: "" });
  const update = (next: Partial<SaleTransportSavePayload>) => setForm((current) => ({ ...current, ...next }));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Transporter name" required><Input value={form.name} onChange={(event) => update({ name: event.target.value })} /></Field>
      <Field label="Transporter GST"><Input value={form.gst} onChange={(event) => update({ gst: event.target.value.toUpperCase() })} /></Field>
      <Field label="Vehicle no"><Input value={form.vehicleNo} onChange={(event) => update({ vehicleNo: event.target.value.toUpperCase() })} /></Field>
      <Field label="Contact no"><Input value={form.contactNo} onChange={(event) => update({ contactNo: event.target.value })} /></Field>
      <Field label="Contact person"><Input value={form.contactPerson} onChange={(event) => update({ contactPerson: event.target.value })} /></Field>
      <Field label="Address"><Input value={form.address} onChange={(event) => update({ address: event.target.value })} /></Field>
      <div className="flex justify-end gap-2 md:col-span-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="button" disabled={!form.name.trim()} onClick={async () => onCreated(await onSave(form))}><Save className="size-4" />Save transport</Button></div>
    </div>
  );
}

function SaleEwayTab({ loading, onChange, onCreateTransport, onGenerate, onTransportChange, options, selected, value }: { loading: boolean; onChange: (next: Partial<SaleEwayDetails>) => void; onCreateTransport: (payload: SaleTransportSavePayload) => Promise<{ description: string; label: string; meta: string; value: string }>; onGenerate: () => void; onTransportChange: (value: string, option?: SaleLookupOption | null) => void; options: SaleLookupOption[]; selected: SaleLookupOption | undefined; value: SaleEwayDetails }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-3">
        <div className="text-sm text-muted-foreground">E-way status <span className="ml-2 rounded-sm bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">{value.status === "generated" ? "Generated" : "Not generated"}</span></div>
        <Button type="button" className="h-9 rounded-md" onClick={onGenerate}><Send className="size-4" />Generate</Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="E-way bill no"><Input value={value.billNo} onChange={(event) => onChange({ billNo: event.target.value })} /></Field>
        <Field label="E-way bill date"><WorkspaceDatePicker value={value.billDate} onValueChange={(billDate) => onChange({ billDate })} /></Field>
        <Field label="Transport">
          <WorkspaceLookup
            createDescription="Add transporter details without leaving this sale."
            createLabel="New transport"
            createMode="popup"
            createTitle="New transport"
            emptyLabel="No transport found. Create a new transport."
            loading={loading}
            options={options}
            placeholder="Search transport"
            value={value.transport}
            onTextChange={(next) => onChange({ transport: next })}
            onValueChange={onTransportChange}
            renderCreateForm={({ initialName, onCancel, onCreated }) => <SaleTransportQuickForm initialName={initialName} onCancel={onCancel} onCreated={onCreated} onSave={onCreateTransport} />}
          />
          {value.transportGst || selected?.record?.gst ? <div className="mt-1 text-xs text-muted-foreground">Transporter GST: <span className="font-medium text-foreground">{value.transportGst || selected?.record?.gst}</span></div> : null}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="E-way part"><WorkspaceSelect value={value.part} options={[{ label: "Part A", value: "Part A" }, { label: "Part B", value: "Part B" }]} onValueChange={(part) => onChange({ part: part as SaleEwayDetails["part"] })} /></Field>
          <Field label="Vehicle no"><Input value={value.vehicleNo} onChange={(event) => onChange({ vehicleNo: event.target.value.toUpperCase() })} /></Field>
        </div>
      </div>
      <Field label="Transport / vehicle notes"><Textarea className="min-h-28" value={value.notes} onChange={(event) => onChange({ notes: event.target.value })} /></Field>
    </div>
  );
}

function SaleEinvoiceTab({ onChange, onGenerate, value }: { onChange: (next: Partial<SaleEinvoiceDetails>) => void; onGenerate: () => void; value: SaleEinvoiceDetails }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-3">
        <div className="text-sm text-muted-foreground">E-invoice status <span className="ml-2 rounded-sm bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">{value.status === "generated" ? "Generated" : "Not generated"}</span></div>
        <Button type="button" className="h-9 rounded-md" onClick={onGenerate}><Send className="size-4" />Generate</Button>
      </div>
      <Field label="IRN"><Input value={value.irn} onChange={(event) => onChange({ irn: event.target.value.toUpperCase() })} /></Field>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="Ack no"><Input value={value.ackNo} onChange={(event) => onChange({ ackNo: event.target.value })} /></Field>
        <Field label="Ack date"><WorkspaceDatePicker value={value.ackDate} onValueChange={(ackDate) => onChange({ ackDate })} /></Field>
      </div>
      <Field label="Signed QR"><Textarea className="min-h-28" value={value.signedQr} onChange={(event) => onChange({ signedQr: event.target.value })} /></Field>
    </div>
  );
}

function Field({ children, label, required }: { children: ReactNode; label: string; required?: boolean }) {
  return <label className="block space-y-2 text-sm font-medium text-muted-foreground">{label}{required ? <span className="text-destructive"> *</span> : null}{children}</label>;
}

function StatusPill({ sale, status }: { sale?: Sale; status?: Sale["status"] }) {
  const label = sale?.generatedSalesInvoiceNo ? "invoiced" : status ?? sale?.status ?? "draft";
  const tone = label === "invoiced" ? "info" : label === "confirmed" ? "success" : label === "cancelled" ? "danger" : "warning";
  return <WorkspaceStatusBadge label={label} tone={tone} />;
}

function SaleProductQuickForm({ initialValue, loading, onCancel, onSave, title }: { initialValue: SaleMasterSavePayload; loading: boolean; onCancel: () => void; onSave: (payload: SaleMasterSavePayload) => Promise<void>; title: string }) {
  const [form, setForm] = useState(initialValue);
  const categoriesQuery = useQuery({ queryFn: listSaleProductCategories, queryKey: ["billing", "sale", "lookups", "product-categories"] });
  const hsnCodesQuery = useQuery({ queryFn: listSaleHsnCodes, queryKey: ["billing", "sale", "lookups", "hsn-codes"] });
  const unitsQuery = useQuery({ queryFn: listSaleUnits, queryKey: ["billing", "sale", "lookups", "units"] });
  const taxesQuery = useQuery({ queryFn: listSaleTaxes, queryKey: ["billing", "sale", "lookups", "taxes"] });

  function patchProduct(next: Partial<SaleMasterSavePayload>) { setForm((current) => ({ ...current, ...next })); }

  async function createOption(kind: "productCategories" | "hsnCodes" | "units" | "taxes", name: string) {
    const value = name.trim();
    const payload = kind === "hsnCodes"
      ? { code: value.toUpperCase(), description: value, isActive: true }
      : kind === "taxes"
        ? { description: `GST ${Number(value.replace(/%/g, "")) || 0}%`, isActive: true, ratePercent: Number(value.replace(/%/g, "")) || 0 }
        : { isActive: true, name: value };
    const created = await createSaleLookup(kind, payload);
    const query = { productCategories: categoriesQuery, hsnCodes: hsnCodesQuery, units: unitsQuery, taxes: taxesQuery }[kind];
    await query.refetch();
    toast.success(`${kind === "productCategories" ? "Product category" : kind === "hsnCodes" ? "HSN code" : kind === "units" ? "Unit" : "GST tax rate"} saved`, { description: value });
    return created;
  }

  const categoryOptions = (categoriesQuery.data ?? []).map(saleCommonOption);
  const hsnOptions = (hsnCodesQuery.data ?? []).map((record) => ({ ...saleCommonOption(record), label: record.code || record.name || record.id, value: record.id }));
  const unitOptions = (unitsQuery.data ?? []).map(saleCommonOption);
  const taxOptions = (taxesQuery.data ?? []).map((record) => ({ ...saleCommonOption(record), label: record.name || record.code || `${record.ratePercent ?? record.taxRate ?? 0}%`, value: record.id }));

  return (
    <form className="grid gap-0" onSubmit={(event) => { event.preventDefault(); void onSave(form); }}>
      <DialogHeader className="border-b border-border/80 px-5 py-4 pr-12"><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
        <ContactQuickField label="Product name" required value={form.name} onChange={(name) => patchProduct({ name })} />
        <ProductPopupLookup label="Product category" loading={categoriesQuery.isLoading} options={categoryOptions} value={form.productCategoryId || form.productCategoryName || ""} placeholder="Search product category" onCreate={(name) => createOption("productCategories", name)} onValueChange={(value, option) => patchProduct({ productCategoryId: option?.value ?? value, productCategoryName: option?.label ?? value })} />
        <ProductPopupLookup label="HSN code" loading={hsnCodesQuery.isLoading} options={hsnOptions} value={form.hsnCodeId || form.hsnCode || ""} placeholder="Search HSN code" onCreate={(name) => createOption("hsnCodes", name)} onValueChange={(value, option) => patchProduct({ hsnCodeId: option?.value ?? value, hsnCode: option?.label ?? value })} />
        <ProductPopupLookup label="Units" loading={unitsQuery.isLoading} options={unitOptions} value={form.unitId || form.unitName || ""} placeholder="Search units" onCreate={(name) => createOption("units", name)} onValueChange={(value, option) => patchProduct({ unitId: option?.value ?? value, unitName: option?.label ?? value })} />
        <ProductPopupLookup numericOnly label="GST tax rate" loading={taxesQuery.isLoading} options={taxOptions} value={form.taxId || (form.taxRate !== undefined ? String(form.taxRate) : "")} placeholder="Search GST tax rate" onCreate={(name) => createOption("taxes", name)} onValueChange={(value, option) => { const record = option?.record; patchProduct({ taxId: option?.value ?? value, taxName: option?.label ?? value, taxRate: Number(record?.ratePercent ?? record?.taxRate ?? value) || 0 }); }} />
        <ContactQuickField label="Opening price" type="number" value={String(form.openingRate)} onChange={(openingRate) => patchProduct({ openingRate: Number(openingRate || 0) })} />
      </div>
      <DialogFooter className="border-t border-border/80 px-5 py-4"><Button disabled={loading} type="button" variant="outline" onClick={onCancel}><X className="size-4" />Cancel</Button><Button disabled={loading || !form.name.trim()} type="submit"><Save className="size-4" />Save product</Button></DialogFooter>
    </form>
  );
}

function ProductPopupLookup({ label, loading, numericOnly = false, onCreate, onValueChange, options, placeholder, value }: { label: string; loading: boolean; numericOnly?: boolean; onCreate: (name: string) => Promise<SaleLookupRecord>; onValueChange: (value: string, option?: SaleLookupOption | null) => void; options: SaleLookupOption[]; placeholder: string; value: string }) {
  const sanitize = numericOnly ? (input: string) => input.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1") : undefined;
  return <label className="grid gap-2"><Label>{label}</Label><WorkspaceLookup createLabel={`Create ${label.toLowerCase()}`} createMode="inline" emptyLabel={`No ${label.toLowerCase()} found. Type a value to create it.`} loading={loading} options={options} placeholder={placeholder} value={value} {...(sanitize ? { sanitizeInput: sanitize } : {})} onCreate={async (name) => saleCommonOption(await onCreate(sanitize ? sanitize(name) : name))} onValueChange={onValueChange} /></label>;
}

function canGenerateInvoiceFromSale(sale: Sale) {
  return sale.status !== "cancelled" && !sale.generatedSalesInvoiceNo;
}

function saleContactKey(sale: Sale) {
  return sale.customerName.trim().toLowerCase();
}

function buildSaleContactFilterOptions(entries: Sale[]) {
  const byKey = new Map<string, string>();
  for (const sale of entries) {
    const key = saleContactKey(sale);
    if (!byKey.has(key)) byKey.set(key, sale.customerName || key);
  }
  return Array.from(byKey, ([id, label]) => ({ id, label })).sort((left, right) => left.label.localeCompare(right.label));
}

function computeSaleLine(item: SaleSavePayload["items"][number], taxType: SaleTaxType) {
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

function computeSaleTotals(items: SaleSavePayload["items"], taxType: SaleTaxType) {
  return items.reduce(
    (totals, item) => {
      const line = computeSaleLine(item, taxType);
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

