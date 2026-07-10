import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, Eye, Pencil, Plus, Printer, RefreshCw, Save, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@codexsun/ui/components/dialog";
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
import { WorkspaceTableEmptyState, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import { WorkspaceFormActions, WorkspaceFormSurface, WorkspaceFormTabbedBody } from "@codexsun/ui/workspace/upsert";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { cn } from "@codexsun/ui/lib/utils";
import { PageTitle } from "../../shared/document/PageTitle";
import { BillingLayout } from "../../shared/layout/BillingLayout";
import { useSalesSettings } from "../settings";
import { defaultBillingSettings, formatDocumentNumber, type BillingDocumentLayoutSettings, type BillingDocumentNumberSettings } from "../settings/settings.types";
import { createEmptyQuotation, type Quotation, type QuotationSavePayload, type QuotationTaxType, type QuotationView } from "./quotation.types";
import {
  createQuotation,
  createQuotationAddressType,
  createQuotationContact,
  createQuotationLocation,
  convertQuotationToSale,
  formatDate,
  formatMoney,
  listQuotationColours,
  listQuotationContacts,
  listQuotationAddressTypes,
  listQuotationLocations,
  listQuotationProducts,
  listQuotationSizes,
  listQuotationWorkOrders,
  quotationToPayload,
  setQuotationStatus,
  totalQuotationQuantity,
  updateQuotationContact,
  updateQuotation,
  type QuotationContactSavePayload,
  type QuotationLocationKind,
  type QuotationLocationRecord,
  type QuotationLookupOption,
  type QuotationLookupRecord,
} from "./quotation.services";
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
        onConvert={() => convertMutation.mutate(freshQuotation.id)}
        converting={convertMutation.isPending}
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
                  <button className="font-semibold text-foreground underline-offset-4 hover:underline" onClick={() => quotation.status === "draft" ? onEdit(quotation) : onView(quotation)} type="button">{quotation.quotationNumber}</button>
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
                    actions={quotation.status === "draft" ? [
                      { id: "confirm", label: "Confirm", icon: <Eye className="size-4" />, onSelect: () => onSetStatus(quotation, "confirmed") },
                    ] : []}
                    {...(quotation.status !== "cancelled" && !quotation.generatedSalesInvoiceNo ? { deleteLabel: "Cancel", onDelete: () => onSetStatus(quotation, "cancelled") } : {})}
                    {...(quotation.status === "draft" ? { onEdit: () => onEdit(quotation) } : {})}
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
  const [itemResetSignal, setItemResetSignal] = useState(0);
  const [editingContact, setEditingContact] = useState<QuotationLookupOption["record"] | null>(null);
  const contactsQuery = useQuery({ queryFn: listQuotationContacts, queryKey: ["billing", "quotation", "lookups", "contacts"] });
  const workOrdersQuery = useQuery({ queryFn: listQuotationWorkOrders, queryKey: ["billing", "quotation", "lookups", "work-orders"] });
  const productsQuery = useQuery({ queryFn: listQuotationProducts, queryKey: ["billing", "quotation", "lookups", "products"] });
  const coloursQuery = useQuery({ queryFn: listQuotationColours, queryKey: ["billing", "quotation", "lookups", "colours"] });
  const sizesQuery = useQuery({ queryFn: listQuotationSizes, queryKey: ["billing", "quotation", "lookups", "sizes"] });
  const contactSaveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: QuotationContactSavePayload }) => id ? updateQuotationContact(id, payload) : createQuotationContact(payload),
  });
  const selectedContact = (contactsQuery.data ?? []).find((option) => option.value === form.customerName || option.label === form.customerName);

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
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label="Customer name" required>
              <WorkspaceLookup
                createDescription="Add contact details and address without leaving this quotation."
                createLabel="New contact"
                createMode="popup"
                createTitle="New contact"
                emptyLabel="No contacts found. Create a new contact."
                loading={contactsQuery.isLoading}
                options={contactsQuery.data ?? []}
                placeholder="Search or select contact"
                required
                value={form.customerName}
                onTextChange={(value) => patch({ customerName: value })}
                onValueChange={(value, option) => patch({ customerName: option?.label ?? value })}
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
                loading={workOrdersQuery.isLoading}
                options={workOrdersQuery.data ?? []}
                placeholder="Search or select work order"
                value={form.workOrderNo}
                onTextChange={(value) => patch({ workOrderNo: value })}
                onValueChange={(value, option) => patch({ workOrderNo: option?.value ?? value })}
              />
            </Field>
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
          colourOptions={coloursQuery.data ?? []}
          coloursLoading={coloursQuery.isLoading}
          productOptions={productsQuery.data ?? []}
          productsLoading={productsQuery.isLoading}
          resetSignal={itemResetSignal}
          settings={settings}
          sizeOptions={sizesQuery.data ?? []}
          sizesLoading={sizesQuery.isLoading}
          taxType={form.taxType}
          onAdd={addOrUpdateItem}
          onDraftChange={patchDraft}
          onEdit={editItem}
          onProductSelect={applyProductSelection}
          onRemove={removeItem}
          onReset={resetDraft}
        />
        <WorkspaceFormActions>
          <Button disabled={loading} onClick={() => submit()} type="button"><Save className="size-4" />Save</Button>
          <Button disabled={loading} onClick={() => submit(true)} type="button" variant="outline"><Printer className="size-4" />Save & Print</Button>
          <Button onClick={onBack} type="button" variant="outline"><X className="size-4" />Cancel</Button>
        </WorkspaceFormActions>
        <Dialog open={Boolean(editingContact)} onOpenChange={(open) => !open && setEditingContact(null)}>
          <DialogContent className="rounded-md sm:max-w-4xl" onInteractOutside={(event) => event.preventDefault()}>
            {editingContact ? (
              <QuotationContactQuickForm
                initialValue={contactDraftFromRecord(editingContact)}
                loading={contactSaveMutation.isPending}
                onCancel={() => setEditingContact(null)}
                onSave={async (payload) => {
                  const saved = await contactSaveMutation.mutateAsync({ id: editingContact.id, payload });
                  await contactsQuery.refetch();
                  patch({ customerName: quotationContactOption(saved).label });
                  setEditingContact(null);
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
    return quotationLocationOption(created);
  }

  const tabs: WorkspaceAnimatedTab[] = [
    {
      content: (
        <div className="grid gap-4">
          <ContactQuickField label="Contact name" required value={form.name} onChange={(name) => setForm((current) => ({ ...current, name, ...(!legalNameManual ? { legalName: name.toUpperCase() } : {}) }))} />
          <ContactQuickField label="Legal name" value={form.legalName} onChange={(legalName) => { setLegalNameManual(true); setForm((current) => ({ ...current, legalName: legalName.toUpperCase() })); }} />
          <ContactQuickField label="GSTIN" value={form.gstin} onChange={(gstin) => setForm((current) => ({ ...current, gstin: gstin.toUpperCase() }))} />
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
              placeholder="Search or select address type"
              value={form.addressTypeName}
              onCreate={async (name) => {
                const created = await createQuotationAddressType(name);
                await addressTypesQuery.refetch();
                return quotationContactOption(created);
              }}
              onValueChange={(value, option) => setForm((current) => ({ ...current, addressTypeName: option?.label ?? value }))}
            />
          </label>
          <ContactQuickField label="Address line 1" value={form.addressLine1} onChange={(addressLine1) => setForm((current) => ({ ...current, addressLine1 }))} />
          <ContactQuickField label="Address line 2" value={form.addressLine2} onChange={(addressLine2) => setForm((current) => ({ ...current, addressLine2 }))} />
          <div className="grid gap-4">
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
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(form);
      }}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <WorkspaceAnimatedTabs contentClassName="px-0" listClassName="rounded-none border-x-0 border-t-0 px-0 shadow-none" tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
      <DialogFooter>
        <Button disabled={loading} type="button" variant="outline" onClick={onCancel}><X className="size-4" />Cancel</Button>
        <Button disabled={loading || !form.name.trim()} type="submit"><Save className="size-4" />Save contact</Button>
      </DialogFooter>
    </form>
  );
}

function ContactQuickField({ className, label, onChange, required, type = "text", value }: { className?: string; label: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
  return (
    <label className={cn("grid gap-2", className)}>
      <Label>{label}{required ? <span className="text-destructive"> *</span> : null}</Label>
      <Input autoFocus={label === "Contact name"} className="h-11 rounded-md" required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
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
  const label = record.pincode && record.areaName && record.areaName !== record.pincode
    ? `${record.pincode} - ${record.areaName}`
    : record.pincode || record.name || record.code;
  return {
    description: [record.cityName, record.districtName, record.stateName].filter(Boolean).join(", "),
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

function QuotationShowPage({ converting, onBack, onConvert, onEdit, onNew, onPrint, quotation }: { converting: boolean; onBack: () => void; onConvert: () => void; onEdit: () => void; onNew: () => void; onPrint: () => void; quotation: Quotation }) {
  return (
    <WorkspacePage
      title={quotation.quotationNumber}
      description={`${quotation.customerName} • ${formatDate(quotation.date)}`}
      actions={<><Button onClick={onNew} type="button"><Plus className="size-4" />New</Button>{quotation.status === "draft" ? <Button onClick={onEdit} type="button" variant="outline">Edit</Button> : null}{!quotation.generatedSalesInvoiceNo && quotation.status !== "cancelled" ? <Button disabled={converting} onClick={onConvert} type="button" variant="outline"><Send className="size-4" />Convert to sale</Button> : null}<Button onClick={onPrint} type="button" variant="outline"><Printer className="size-4" />Print</Button><Button onClick={onBack} type="button" variant="outline">Back</Button></>}
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
          <Detail label="Sales invoice" value={quotation.generatedSalesInvoiceNo || "Not converted"} />
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
  onAdd,
  onDraftChange,
  onEdit,
  onProductSelect,
  onRemove,
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
  onAdd: () => void;
  onDraftChange: (next: Partial<QuotationSavePayload["items"][number]>) => void;
  onEdit: (index: number) => void;
  onProductSelect: (value: string, option?: QuotationLookupOption | null) => void;
  onRemove: (index: number) => void;
  onReset: () => void;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!resetSignal) return;
    window.requestAnimationFrame(() => {
      rowRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
    });
  }, [resetSignal]);

  return (
    <div className="px-6 pb-5">
      <div className="pt-5">
        <h3 className="text-[1.65rem] font-semibold tracking-normal text-foreground">Quotation Items</h3>
        <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1 pt-1.5">
          <div className="min-w-[980px]">
            <div ref={rowRef} className="grid gap-1" style={{ gridTemplateColumns: templateColumns }}>
              {showPo ? <Field label="PO"><Input value={draft.poNo} onChange={(event) => onDraftChange({ poNo: event.target.value })} /></Field> : null}
              {showDc ? <Field label="DC"><Input value={draft.dcNo} onChange={(event) => onDraftChange({ dcNo: event.target.value })} /></Field> : null}
              <Field label="Product name">
                <WorkspaceLookup
                  loading={productsLoading}
                  options={productOptions}
                  placeholder="Search or select product"
                  value={draft.productName}
                  onTextChange={(value) => onDraftChange({ productName: value })}
                  onValueChange={(value, option) => onProductSelect(value, option as QuotationLookupOption | null | undefined)}
                />
              </Field>
              <Field label="Description"><Input value={draft.description} onChange={(event) => onDraftChange({ description: event.target.value })} /></Field>
              {showColour ? (
                <Field label="Colour">
                  <WorkspaceLookup
                    loading={coloursLoading}
                    options={colourOptions}
                    placeholder="Search colour"
                    value={draft.colour}
                    onTextChange={(value) => onDraftChange({ colour: value })}
                    onValueChange={(value, option) => onDraftChange({ colour: option?.label ?? value })}
                  />
                </Field>
              ) : null}
              {showSize ? (
                <Field label="Size">
                  <WorkspaceLookup
                    loading={sizesLoading}
                    options={sizeOptions}
                    placeholder="Search size"
                    value={draft.size}
                    onTextChange={(value) => onDraftChange({ size: value })}
                    onValueChange={(value, option) => onDraftChange({ size: option?.label ?? value })}
                  />
                </Field>
              ) : null}
              <Field label="Quantity"><Input min="1" type="number" value={String(draft.quantity)} onChange={(event) => onDraftChange({ quantity: Number(event.target.value || 0) })} /></Field>
              <Field label="Price"><Input min="0" step="0.01" type="number" value={String(draft.rate)} onChange={(event) => onDraftChange({ rate: Number(event.target.value || 0) })} /></Field>
              <div className="flex items-end gap-2 pb-0.5">
                <Button className="h-11 rounded-md bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700" type="button" onClick={onAdd}>
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
            <thead className="bg-muted/60">
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
                    <td className="border-r border-border/70 px-3 py-2">{[item.productName, item.description].filter(Boolean).join(" - ")}</td>
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

