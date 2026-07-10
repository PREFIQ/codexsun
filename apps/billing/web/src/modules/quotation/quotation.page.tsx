import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { Eye, Pencil, Plus, Printer, RefreshCw, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceAnimatedTabs, type WorkspaceAnimatedTab } from "@codexsun/ui/workspace/animated-tabs";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceTableEmptyState, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import { WorkspaceFormActions, WorkspaceFormSurface, WorkspaceFormTabbedBody } from "@codexsun/ui/workspace/upsert";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { cn } from "@codexsun/ui/lib/utils";
import { PageTitle } from "../../shared/document/PageTitle";
import { BillingLayout } from "../../shared/layout/BillingLayout";
import { useSalesSettings } from "../settings";
import { defaultBillingSettings, formatDocumentNumber, type BillingDocumentLayoutSettings, type BillingDocumentNumberSettings } from "../settings/settings.types";
import { createEmptyQuotation, type Quotation, type QuotationSavePayload, type QuotationTaxType, type QuotationView } from "./quotation.types";
import { createQuotation, formatDate, formatMoney, quotationToPayload, setQuotationStatus, totalQuotationQuantity, updateQuotation } from "./quotation.services";
import { useQuotationList } from "./quotation.hooks";

const statusFilters = [
  { id: "all", label: "All quotations" },
  { id: "draft", label: "Draft" },
  { id: "confirmed", label: "Confirmed" },
  { id: "cancelled", label: "Cancelled" },
];

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
  const [view, setView] = useState<QuotationView>({ mode: "list" });
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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

  const entries = quotationsQuery.data ?? [];
  const filteredEntries = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return entries.filter((quotation) => {
      const matchesSearch = !term || [
        quotation.quotationNumber,
        quotation.customerName,
        quotation.workOrderNo,
        quotation.salesLedger,
        quotation.date,
        quotation.status,
        String(quotation.amount),
      ].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [entries, searchValue, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / rowsPerPage));
  const pageEntries = filteredEntries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (view.mode === "show") {
    const freshQuotation = entries.find((entry) => entry.id === view.quotation.id) ?? view.quotation;
    return (
      <QuotationShowPage
        quotation={freshQuotation}
        onBack={() => setView({ mode: "list" })}
        onEdit={() => setView({ mode: "upsert", quotation: freshQuotation, returnTo: "show" })}
        onNew={() => setView({ mode: "upsert", quotation: null, returnTo: "list" })}
        onPrint={() => window.print()}
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
        searchPlaceholder="Search quotation, customer, work order, ledger, date, or total"
        searchValue={searchValue}
        toolbarAction={<div className="rounded-md border border-border/70 bg-muted/20 px-3 py-1.5 text-xs font-medium text-muted-foreground">Total value: {formatMoney(filteredEntries.reduce((sum, entry) => sum + entry.amount, 0))}</div>}
      />
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
        onView={(quotation) => setView({ mode: "show", quotation })}
        page={currentPage}
        rowsPerPage={rowsPerPage}
      />
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

function QuotationList({ entries, loading, onEdit, onSetStatus, onView, page, rowsPerPage }: { entries: Quotation[]; loading: boolean; onEdit: (quotation: Quotation) => void; onSetStatus: (quotation: Quotation, status: "cancelled" | "confirmed") => void; onView: (quotation: Quotation) => void; page: number; rowsPerPage: number }) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              {["#", "Quotation", "Date", "Customer", "Items", "Taxable", "GST", "Total", "Status", "Action"].map((heading) => (
                <th key={heading} className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((quotation, index) => (
              <tr key={quotation.id} className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/20">
                <td className="px-4 py-2.5">{(page - 1) * rowsPerPage + index + 1}</td>
                <td className="px-4 py-2.5">
                  <button className="font-semibold text-foreground underline-offset-4 hover:underline" onClick={() => onEdit(quotation)} type="button">{quotation.quotationNumber}</button>
                </td>
                <td className="px-4 py-2.5">{formatDate(quotation.date)}</td>
                <td className="px-4 py-2.5">{quotation.customerName}</td>
                <td className="px-4 py-2.5">{totalQuotationQuantity(quotation)}</td>
                <td className="px-4 py-2.5">{formatMoney(quotation.subtotal)}</td>
                <td className="px-4 py-2.5">{formatMoney(quotation.taxAmount)}</td>
                <td className="px-4 py-2.5 font-semibold">{formatMoney(quotation.amount)}</td>
                <td className="px-4 py-2.5"><StatusPill status={quotation.status} /></td>
                <td className="px-4 py-2.5">
                  <WorkspaceRowActions
                    actions={[
                      { id: "confirm", label: "Confirm", icon: <Eye className="size-4" />, onSelect: () => onSetStatus(quotation, "confirmed") },
                    ]}
                    deleteLabel="Cancel"
                    onDelete={() => onSetStatus(quotation, "cancelled")}
                    onEdit={() => onEdit(quotation)}
                    onView={() => onView(quotation)}
                    title={quotation.quotationNumber}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.length === 0 ? <WorkspaceTableEmptyState>{loading ? "Loading quotations..." : "No quotations found."}</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}

function QuotationUpsertPage({ errorMessage, loading, numbering, onBack, onSubmit, quotation, settings }: { errorMessage: string; loading: boolean; numbering: BillingDocumentNumberSettings; onBack: () => void; onSubmit: (payload: QuotationSavePayload, printAfter?: boolean) => void; quotation: Quotation | null; settings: BillingDocumentLayoutSettings }) {
  const [activeTab, setActiveTab] = useState("details");
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

  function patch(next: Partial<QuotationSavePayload>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function patchDraft(next: Partial<typeof itemDraft>) {
    setItemDraft((current) => ({ ...current, ...next }));
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

  const tabs: WorkspaceAnimatedTab[] = [
    {
      value: "details",
      label: "Details",
      content: (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label="Customer name" required><Input required value={form.customerName} onChange={(event) => patch({ customerName: event.target.value })} /></Field>
            <Field label="Work order no"><Input value={form.workOrderNo} onChange={(event) => patch({ workOrderNo: event.target.value })} /></Field>
          </div>
          <div className="space-y-4">
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
      ),
    },
    {
      value: "other-details",
      label: "Other Details",
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Sales ledger"><Input value={form.salesLedger} onChange={(event) => patch({ salesLedger: event.target.value })} /></Field>
        </div>
      ),
    },
    {
      value: "address",
      label: "Address",
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Billing address"><Textarea className="min-h-32" value={form.billingAddress} onChange={(event) => patch({ billingAddress: event.target.value })} /></Field>
          <Field label="Shipping address"><Textarea className="min-h-32" value={form.shippingAddress} onChange={(event) => patch({ shippingAddress: event.target.value })} /></Field>
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

  function submit(printAfter = false) {
    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!form.items.length) {
      toast.error("Add at least one item");
      return;
    }
    onSubmit(form, printAfter);
  }

  return (
    <WorkspacePage
      title={quotation ? "Edit Quotation" : "New Quotation"}
      description="Create or update a tenant-isolated quotation voucher."
      actions={<Button className="h-9 rounded-md" onClick={onBack} type="button" variant="outline"><X className="size-4" />Cancel</Button>}
    >
      <WorkspaceFormSurface>
        <WorkspaceFormTabbedBody className="border-b border-border/90 pb-6">
          <WorkspaceAnimatedTabs
            tabs={tabs}
            value={activeTab}
            onValueChange={setActiveTab}
            contentClassName="px-0"
          />
        </WorkspaceFormTabbedBody>
        {errorMessage ? <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}
        <QuotationItemsSection
          draft={itemDraft}
          editing={editingItemIndex !== null}
          items={form.items}
          settings={settings}
          taxType={form.taxType}
          onAdd={addOrUpdateItem}
          onDraftChange={patchDraft}
          onEdit={editItem}
          onRemove={removeItem}
          onReset={resetDraft}
        />
        <WorkspaceFormActions>
          <Button disabled={loading} onClick={() => submit()} type="button"><Save className="size-4" />Save</Button>
          <Button disabled={loading} onClick={() => submit(true)} type="button" variant="outline"><Printer className="size-4" />Save & Print</Button>
          <Button onClick={onBack} type="button" variant="outline"><X className="size-4" />Cancel</Button>
        </WorkspaceFormActions>
      </WorkspaceFormSurface>
    </WorkspacePage>
  );
}

function QuotationShowPage({ onBack, onEdit, onNew, onPrint, quotation }: { onBack: () => void; onEdit: () => void; onNew: () => void; onPrint: () => void; quotation: Quotation }) {
  return (
    <WorkspacePage
      title={quotation.quotationNumber}
      description={`${quotation.customerName} • ${formatDate(quotation.date)}`}
      actions={<><Button onClick={onNew} type="button"><Plus className="size-4" />New</Button><Button onClick={onEdit} type="button" variant="outline">Edit</Button><Button onClick={onPrint} type="button" variant="outline"><Printer className="size-4" />Print</Button><Button onClick={onBack} type="button" variant="outline">Back</Button></>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-md border border-border/70 bg-card/95 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Quotation</p>
              <h2 className="mt-1 text-2xl font-semibold">{quotation.quotationNumber}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{quotation.customerName}</p>
            </div>
            <StatusPill status={quotation.status} />
          </div>
          <div className="mt-5 grid gap-4 text-sm md:grid-cols-3">
            <Detail label="Date" value={formatDate(quotation.date)} />
            <Detail label="Work order" value={quotation.workOrderNo || "-"} />
            <Detail label="Sales ledger" value={quotation.salesLedger || "-"} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-md border border-border/70 bg-card/95 p-5 shadow-sm">
            <h3 className="font-semibold">Comments</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{quotation.notes || "No comments added."}</p>
          </div>
          <div className="rounded-md border border-border/70 bg-card/95 p-5 shadow-sm">
            <h3 className="font-semibold">Activities</h3>
            <p className="mt-2 text-sm text-muted-foreground">Created {formatDate(quotation.createdAt)}. Last updated {formatDate(quotation.updatedAt)}.</p>
          </div>
        </div>
      </div>
    </WorkspacePage>
  );
}

function QuotationItemsSection({
  draft,
  editing,
  items,
  settings,
  taxType,
  onAdd,
  onDraftChange,
  onEdit,
  onRemove,
  onReset,
}: {
  draft: QuotationSavePayload["items"][number];
  editing: boolean;
  items: QuotationSavePayload["items"];
  settings: BillingDocumentLayoutSettings;
  taxType: QuotationTaxType;
  onAdd: () => void;
  onDraftChange: (next: Partial<QuotationSavePayload["items"][number]>) => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onReset: () => void;
}) {
  const showPo = settings.usePo;
  const showDc = settings.useDc;
  const showColour = settings.useColour;
  const showSize = settings.useSize;
  const totals = computeQuotationTotals(items, taxType);
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

  return (
    <div className="px-6 pb-5">
      <div className="border-t border-border/70 pt-5">
        <h3 className="text-[1.65rem] font-semibold tracking-normal text-foreground">Quotation Items</h3>
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid gap-2" style={{ gridTemplateColumns: templateColumns }}>
              {showPo ? <Field label="PO"><Input value={draft.poNo} onChange={(event) => onDraftChange({ poNo: event.target.value })} /></Field> : null}
              {showDc ? <Field label="DC"><Input value={draft.dcNo} onChange={(event) => onDraftChange({ dcNo: event.target.value })} /></Field> : null}
              <Field label="Product name"><Input value={draft.productName} onChange={(event) => onDraftChange({ productName: event.target.value })} /></Field>
              <Field label="Description"><Input value={draft.description} onChange={(event) => onDraftChange({ description: event.target.value })} /></Field>
              {showColour ? <Field label="Colour"><Input placeholder="Search colour" value={draft.colour} onChange={(event) => onDraftChange({ colour: event.target.value })} /></Field> : null}
              {showSize ? <Field label="Size"><Input placeholder="Search size" value={draft.size} onChange={(event) => onDraftChange({ size: event.target.value })} /></Field> : null}
              <Field label="Quantity"><Input min="1" type="number" value={String(draft.quantity)} onChange={(event) => onDraftChange({ quantity: Number(event.target.value || 0) })} /></Field>
              <Field label="Price"><Input min="0" step="0.01" type="number" value={String(draft.rate)} onChange={(event) => onDraftChange({ rate: Number(event.target.value || 0) })} /></Field>
              <div className="flex items-end gap-2 pb-0.5">
                <Button className="h-11 rounded-md px-4" type="button" variant="outline" onClick={onAdd}>
                  <Plus className="size-4" />
                  {editing ? "Update" : "Add"}
                </Button>
                {editing ? <Button className="h-11 rounded-md px-4" type="button" variant="outline" onClick={onReset}><X className="size-4" />Cancel</Button> : null}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto rounded-md border border-border/70">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
            <thead className="bg-muted/30">
              <tr>
                {["#", ...(showPo ? ["PO"] : []), ...(showDc ? ["DC"] : []), "Particulars", "HSN Code", ...(showColour ? ["Colour"] : []), ...(showSize ? ["Size"] : []), "Qty", "Rate", "Unit", "Taxable", "GST %", "CGST", "SGST", "Total", "Action"].map((heading) => (
                  <th key={heading} className="border-b border-r border-border/70 px-3 py-2 text-left text-sm font-medium text-muted-foreground last:border-r-0">{heading}</th>
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
                    <td className="border-r border-border/70 px-3 py-2">{item.productName}</td>
                    <td className="border-r border-border/70 px-3 py-2">{item.hsnCode || "-"}</td>
                    {showColour ? <td className="border-r border-border/70 px-3 py-2">{item.colour || "-"}</td> : null}
                    {showSize ? <td className="border-r border-border/70 px-3 py-2">{item.size || "-"}</td> : null}
                    <td className="border-r border-border/70 px-3 py-2">{item.quantity}</td>
                    <td className="border-r border-border/70 px-3 py-2 text-right">{formatMoney(item.rate)}</td>
                    <td className="border-r border-border/70 px-3 py-2">{item.unit || "Nos"}</td>
                    <td className="border-r border-border/70 px-3 py-2 text-right">{formatMoney(line.taxableAmount)}</td>
                    <td className="border-r border-border/70 px-3 py-2">{item.taxRate}%</td>
                    <td className="border-r border-border/70 px-3 py-2 text-right">{formatMoney(line.cgstAmount)}</td>
                    <td className="border-r border-border/70 px-3 py-2 text-right">{formatMoney(line.sgstAmount + line.igstAmount)}</td>
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
                  <td className="px-3 py-6 text-center text-sm text-muted-foreground" colSpan={11 + (showPo ? 1 : 0) + (showDc ? 1 : 0) + (showColour ? 1 : 0) + (showSize ? 1 : 0)}>
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
            <TotalRow label="Round off" value={formatMoney(0)} />
            <TotalRow label="Grand total" strong value={formatMoney(totals.amount)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ children, label, required }: { children: ReactNode; label: string; required?: boolean }) {
  return <label className="block space-y-2 text-sm font-medium text-muted-foreground">{label}{required ? <span className="text-destructive"> *</span> : null}{children}</label>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}

function StatusPill({ status }: { status: Quotation["status"] }) {
  const tone = status === "confirmed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "cancelled" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700";
  return <span className={cn("inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold capitalize", tone)}>{status}</span>;
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

function TotalRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className={cn("grid grid-cols-[1fr_auto_auto] items-center gap-4", strong && "font-semibold")}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">:</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

