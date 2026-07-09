import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { Eye, Plus, Printer, RefreshCw, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceAnimatedTabs, type WorkspaceAnimatedTab } from "@codexsun/ui/workspace/animated-tabs";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceTableEmptyState, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { cn } from "@codexsun/ui/lib/utils";
import { PageTitle } from "../../shared/document/PageTitle";
import { BillingLayout } from "../../shared/layout/BillingLayout";
import { useSalesSettings } from "../settings";
import { defaultBillingSettings, formatDocumentNumber, type BillingDocumentLayoutSettings, type BillingDocumentNumberSettings } from "../settings/settings.types";
import { createEmptyQuotation, createEmptyQuotationItem, type Quotation, type QuotationLineItemInput, type QuotationSavePayload, type QuotationTaxType, type QuotationView } from "./quotation.types";
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

function QuotationWorkspace() {
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
        settings={quotationLayout}
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
  const [draftItem, setDraftItem] = useState<QuotationLineItemInput>(() => createEmptyQuotationItem());
  const totals = buildClientTotals(form);

  function patch(next: Partial<QuotationSavePayload>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function patchItem(next: Partial<QuotationLineItemInput>) {
    setDraftItem((current) => ({ ...current, ...next }));
  }

  function addItem() {
    if (!draftItem.productName.trim()) {
      toast.error("Product name is required");
      return;
    }
    setForm((current) => ({ ...current, items: [...current.items, draftItem] }));
    setDraftItem(createEmptyQuotationItem());
  }

  function removeItem(index: number) {
    setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
  }

  const tabs: WorkspaceAnimatedTab[] = [
    {
      value: "details",
      label: "Details",
      content: (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Customer name" required><Input required value={form.customerName} onChange={(event) => patch({ customerName: event.target.value })} /></Field>
            <Field label="Quotation no"><Input disabled={!quotation && numbering.automatic} value={form.quotationNumber} onChange={(event) => patch({ quotationNumber: event.target.value })} /></Field>
            <Field label="Work Order no"><Input value={form.workOrderNo} onChange={(event) => patch({ workOrderNo: event.target.value })} /></Field>
            <Field label="Date"><Input type="date" value={form.date} onChange={(event) => patch({ date: event.target.value })} /></Field>
            <Field label="Sales Ledger"><Input value={form.salesLedger} onChange={(event) => patch({ salesLedger: event.target.value })} /></Field>
            <Field label="Quotation tax type">
              <WorkspaceSelect
                value={form.taxType}
                options={[{ label: "CGST + SGST", value: "cgst-sgst" }, { label: "IGST", value: "igst" }]}
                onValueChange={(taxType) => patch({ taxType: taxType as QuotationTaxType })}
              />
            </Field>
          </div>
          <QuotationItemsEditor
            draftItem={draftItem}
            form={form}
            onAddItem={addItem}
            onPatchItem={patchItem}
            onRoundOffChange={(roundOff) => patch({ roundOff })}
            onRemoveItem={removeItem}
            settings={settings}
            totals={totals}
          />
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
    if (form.items.length === 0) {
      toast.error("Add at least one quotation item");
      return;
    }
    onSubmit({ ...form, roundOff: totals.roundOff }, printAfter);
  }

  return (
    <WorkspacePage
      title={quotation ? "Edit Quotation" : "New Quotation"}
      description="Create or update a tenant-isolated quotation voucher."
      actions={<Button className="h-9 rounded-md" onClick={onBack} type="button" variant="outline"><X className="size-4" />Cancel</Button>}
    >
      <div className="rounded-md border border-border/70 bg-card/95 shadow-sm">
        <div className="border-b border-border/70 px-6 pt-1">
          <WorkspaceAnimatedTabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} listClassName="rounded-none border-0 bg-transparent shadow-none" contentClassName="px-0 pb-6" />
        </div>
        {errorMessage ? <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}
        <div className="border-t border-border/70 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={loading} onClick={() => submit()} type="button"><Save className="size-4" />Save</Button>
            <Button disabled={loading} onClick={() => submit(true)} type="button" variant="outline"><Printer className="size-4" />Save & Print</Button>
            <Button onClick={onBack} type="button" variant="outline"><X className="size-4" />Cancel</Button>
          </div>
        </div>
      </div>
    </WorkspacePage>
  );
}

function QuotationItemsEditor({ draftItem, form, onAddItem, onPatchItem, onRemoveItem, onRoundOffChange, readOnly = false, settings, totals }: { draftItem: QuotationLineItemInput; form: QuotationSavePayload; onAddItem: () => void; onPatchItem: (next: Partial<QuotationLineItemInput>) => void; onRemoveItem: (index: number) => void; onRoundOffChange: (roundOff: number) => void; readOnly?: boolean; settings: BillingDocumentLayoutSettings; totals: ReturnType<typeof buildClientTotals> }) {
  const showSplitTax = form.taxType !== "igst";
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold underline underline-offset-2">Quotation Items</h2>
      {readOnly ? null : (
        <div className="grid gap-2" style={{ gridTemplateColumns: `minmax(220px, 2fr) minmax(180px, 1.2fr) ${settings.usePo ? "minmax(120px, .8fr) " : ""}${settings.useDc ? "minmax(120px, .8fr) " : ""}${settings.useColour ? "minmax(130px, .8fr) " : ""}${settings.useSize ? "minmax(120px, .7fr) " : ""}minmax(90px, .6fr) minmax(110px, .7fr) 74px` }}>
          <LineField label="Product name"><Input value={draftItem.productName} onChange={(event) => onPatchItem({ productName: event.target.value })} /></LineField>
          <LineField label="Description"><Input value={draftItem.description} onChange={(event) => onPatchItem({ description: event.target.value })} /></LineField>
          {settings.usePo ? <LineField label="PO"><Input value={draftItem.poNo} onChange={(event) => onPatchItem({ poNo: event.target.value })} /></LineField> : null}
          {settings.useDc ? <LineField label="DC"><Input value={draftItem.dcNo} onChange={(event) => onPatchItem({ dcNo: event.target.value })} /></LineField> : null}
          {settings.useColour ? <LineField label="Colour"><Input value={draftItem.colour} onChange={(event) => onPatchItem({ colour: event.target.value })} /></LineField> : null}
          {settings.useSize ? <LineField label="Size"><Input value={draftItem.size} onChange={(event) => onPatchItem({ size: event.target.value })} /></LineField> : null}
          <LineField label="Quantity"><Input min={0} type="number" value={draftItem.quantity} onChange={(event) => onPatchItem({ quantity: Number(event.target.value) })} /></LineField>
          <LineField label="Price"><Input min={0} step="0.01" type="number" value={draftItem.rate} onChange={(event) => onPatchItem({ rate: Number(event.target.value) })} /></LineField>
          <div className="flex items-end"><Button className="h-11 w-full rounded-md" onClick={onAddItem} type="button"><Plus className="size-4" />Add</Button></div>
        </div>
      )}
      <div className="overflow-x-auto rounded-md border border-border/70">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-muted/40">
            <tr>
              {["#", "Particulars", "HSN Code", settings.usePo ? "PO" : "", settings.useDc ? "DC" : "", settings.useColour ? "Colour" : "", settings.useSize ? "Size" : "", "Qty", "Rate", "Unit", "Taxable", "GST %", showSplitTax ? "CGST" : "IGST", showSplitTax ? "SGST" : "", "Total", readOnly ? "" : "Action"].filter(Boolean).map((heading) => (
                <th key={heading} className="border-b border-border/70 px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {totals.items.map((item, index) => (
              <tr key={`${item.productName}-${index}`} className="border-b border-border/70 last:border-0">
                <td className="px-3 py-2.5">{index + 1}</td>
                <td className="px-3 py-2.5 font-medium">{item.productName}</td>
                <td className="px-3 py-2.5">{item.hsnCode || "-"}</td>
                {settings.usePo ? <td className="px-3 py-2.5">{item.poNo || "-"}</td> : null}
                {settings.useDc ? <td className="px-3 py-2.5">{item.dcNo || "-"}</td> : null}
                {settings.useColour ? <td className="px-3 py-2.5">{item.colour || "-"}</td> : null}
                {settings.useSize ? <td className="px-3 py-2.5">{item.size || "-"}</td> : null}
                <td className="px-3 py-2.5 text-right">{item.quantity}</td>
                <td className="px-3 py-2.5 text-right">{formatMoney(item.rate)}</td>
                <td className="px-3 py-2.5">{item.unit}</td>
                <td className="px-3 py-2.5 text-right">{formatMoney(item.taxableAmount)}</td>
                <td className="px-3 py-2.5 text-right">{item.taxRate}%</td>
                <td className="px-3 py-2.5 text-right">{formatMoney(showSplitTax ? item.cgstAmount : item.igstAmount)}</td>
                {showSplitTax ? <td className="px-3 py-2.5 text-right">{formatMoney(item.sgstAmount)}</td> : null}
                <td className="px-3 py-2.5 text-right font-semibold">{formatMoney(item.lineTotal)}</td>
                {readOnly ? null : <td className="px-3 py-2.5"><Button className="size-8 rounded-md" onClick={() => onRemoveItem(index)} size="icon" type="button" variant="ghost"><Trash2 className="size-4 text-destructive" /></Button></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {totals.items.length === 0 ? <WorkspaceTableEmptyState>No quotation items added.</WorkspaceTableEmptyState> : null}
      </div>
      <div className="ml-auto grid max-w-md gap-3 text-sm">
        <TotalLine label="Taxable amount" value={formatMoney(totals.subtotal)} />
        <TotalLine label="GST total" value={formatMoney(totals.taxAmount)} />
        <div className="grid grid-cols-[1fr_auto_140px] items-center gap-3">
          <span className="text-muted-foreground">Round off</span><span>:</span>
          <Input className="h-9 text-right" disabled={readOnly} step="0.01" type="number" value={form.roundOff ?? 0} onChange={(event) => onRoundOffChange(Number(event.target.value))} />
        </div>
        <TotalLine strong label="Grand total" value={formatMoney(totals.amount)} />
      </div>
    </div>
  );
}

function QuotationShowPage({ onBack, onEdit, onNew, onPrint, quotation, settings }: { onBack: () => void; onEdit: () => void; onNew: () => void; onPrint: () => void; quotation: Quotation; settings: BillingDocumentLayoutSettings }) {
  const totals = buildClientTotals(quotationToPayload(quotation));
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
          <div className="mt-6"><QuotationItemsReadOnly form={quotationToPayload(quotation)} settings={settings} totals={totals} /></div>
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

function QuotationItemsReadOnly({ form, settings, totals }: { form: QuotationSavePayload; settings: BillingDocumentLayoutSettings; totals: ReturnType<typeof buildClientTotals> }) {
  return (
    <QuotationItemsEditor
      draftItem={createEmptyQuotationItem()}
      form={form}
      onAddItem={() => undefined}
      onPatchItem={() => undefined}
      onRoundOffChange={() => undefined}
      onRemoveItem={() => undefined}
      readOnly
      settings={settings}
      totals={totals}
    />
  );
}

function buildClientTotals(form: QuotationSavePayload) {
  const isSplitTax = form.taxType !== "igst";
  const items = form.items.map((item, index) => {
    const taxableAmount = roundMoney(Number(item.quantity || 0) * Number(item.rate || 0));
    const taxAmount = roundMoney((taxableAmount * Number(item.taxRate || 0)) / 100);
    const splitTaxAmount = roundMoney(taxAmount / 2);
    return {
      ...item,
      cgstAmount: isSplitTax ? splitTaxAmount : 0,
      id: `item-${index + 1}`,
      igstAmount: isSplitTax ? 0 : taxAmount,
      lineTotal: roundMoney(taxableAmount + taxAmount),
      sgstAmount: isSplitTax ? splitTaxAmount : 0,
      taxableAmount,
      taxAmount,
    };
  });
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.taxableAmount, 0));
  const taxAmount = roundMoney(items.reduce((sum, item) => sum + item.taxAmount, 0));
  const roundOff = Number(form.roundOff ?? 0);
  return { amount: roundMoney(subtotal + taxAmount + roundOff), items, roundOff, subtotal, taxAmount };
}

function Field({ children, label, required }: { children: ReactNode; label: string; required?: boolean }) {
  return <label className="block space-y-2 text-sm font-medium text-muted-foreground">{label}{required ? <span className="text-destructive"> *</span> : null}{children}</label>;
}

function LineField({ children, label }: { children: ReactNode; label: string }) {
  return <label className="block space-y-1.5 text-sm font-medium text-muted-foreground">{label}{children}</label>;
}

function TotalLine({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return <div className="grid grid-cols-[1fr_auto_140px] items-center gap-3"><span className={cn("text-muted-foreground", strong && "font-semibold text-foreground")}>{label}</span><span>:</span><span className={cn("text-right", strong && "font-semibold")}>{value}</span></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}

function StatusPill({ status }: { status: Quotation["status"] }) {
  const tone = status === "confirmed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "cancelled" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700";
  return <span className={cn("inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold capitalize", tone)}>{status}</span>;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
