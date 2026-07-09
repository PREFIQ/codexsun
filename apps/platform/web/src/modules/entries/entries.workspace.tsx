import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import {
  WorkspaceAnimatedTabs,
  type WorkspaceAnimatedTab,
  WorkspaceDetailTable,
  WorkspaceFilters,
  WorkspaceFormField,
  WorkspaceFormFooter,
  WorkspaceFormGrid,
  WorkspaceFormPanel,
  WorkspaceLineTable,
  WorkspaceLineTableHeader,
  WorkspaceLookup,
  type WorkspaceLookupOption,
  WorkspacePage,
  WorkspacePagination,
  WorkspacePrintPreview,
  WorkspacePrintSheet,
  WorkspaceRowActions,
  WorkspaceSelect,
  WorkspaceShowCard,
  WorkspaceShowLayout,
  WorkspaceStatusBadge,
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel,
  WorkspaceUpsertPage,
  buildShowingLabel,
} from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { cn } from "@codexsun/ui/lib/utils";
import { coloursDefinition } from "../common/products/colours/colours.definition";
import { hsnCodesDefinition } from "../common/products/hsn-codes/hsn-codes.definition";
import { productTypesDefinition } from "../common/products/product-types/product-types.definition";
import { sizesDefinition } from "../common/products/sizes/sizes.definition";
import { taxesDefinition } from "../common/products/taxes/taxes.definition";
import { unitsDefinition } from "../common/products/units/units.definition";
import { paymentTermsDefinition } from "../common/others/payment-terms/payment-terms.definition";
import { salesTypesDefinition } from "../common/others/sales-types/sales-types.definition";
import { transportsDefinition } from "../common/workorder/transports/transports.definition";
import {
  addEntryComment,
  convertQuotationsToSales,
  createCommonMasterOption,
  createEntryContact,
  createEntryProduct,
  createEntryRecord,
  getEntryRecord,
  listCommonMasterOptions,
  listEntryContacts,
  listEntryProducts,
  listEntryRecords,
  setEntryRecordActive,
  updateEntryContact,
  updateEntryProduct,
  updateEntryRecord,
} from "./entries.services";
import type {
  CommonMasterRecord,
  EntryContactRecord,
  EntryFormState,
  EntryKind,
  EntryLineRecord,
  EntryProductRecord,
  EntryRecord,
  EntryStatus,
} from "./entries.types";

const paymentStatusOptions = [
  { label: "Unpaid", value: "unpaid" },
  { label: "Partial", value: "partial" },
  { label: "Paid", value: "paid" },
] as const;

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Posted", value: "posted" },
  { label: "Cancelled", value: "cancelled" },
] as const;

const supplyOptions = [
  { label: "CGST + SGST", value: "cgst-sgst" },
  { label: "IGST", value: "igst" },
] as const;

type ViewState =
  | { mode: "list" }
  | { mode: "show"; entry: EntryRecord }
  | { mode: "upsert"; entry: EntryRecord | null };

type ContactDraft = {
  addressLine1: string;
  addressLine2: string;
  cityId: string;
  cityName: string;
  code: string;
  countryId: string;
  countryName: string;
  districtId: string;
  districtName: string;
  email: string;
  gstin: string;
  id?: string;
  legalName: string;
  name: string;
  phone: string;
  pincodeId: string;
  pincodeName: string;
  stateId: string;
  stateName: string;
};

type ProductDraft = {
  code: string;
  hsnCode: string;
  hsnCodeId: string;
  id?: string;
  name: string;
  price: string;
  productTypeId: string;
  productTypeName: string;
  taxDescription: string;
  taxId: string;
  taxRate: string;
  unitId: string;
  unitName: string;
};

export function BillingEntriesWorkspace({ kind }: { kind: EntryKind }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedQuotationIds, setSelectedQuotationIds] = useState<string[]>([]);
  const [view, setView] = useState<ViewState>({ mode: "list" });

  const title = kind === "quotation" ? "Quotation" : "Sales";
  const plural = kind === "quotation" ? "Quotations" : "Sales";

  const entriesQuery = useQuery({
    queryFn: () => listEntryRecords(kind, search),
    queryKey: ["entries", kind, search]
  });
  const contactsQuery = useQuery({
    queryFn: listEntryContacts,
    queryKey: ["entries", "contacts"]
  });
  const productsQuery = useQuery({
    queryFn: listEntryProducts,
    queryKey: ["entries", "products"]
  });

  const commonQueries = useCommonEntryLookups();
  const entries = entriesQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? entries.filter(
          (entry) =>
            entry.documentNo.toLowerCase().includes(term) ||
            entry.customerName.toLowerCase().includes(term) ||
            (entry.referenceNo ?? "").toLowerCase().includes(term),
        )
      : entries;
  }, [entries, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageRecords = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["entries", kind] }),
      queryClient.invalidateQueries({ queryKey: ["entries", "contacts"] }),
      queryClient.invalidateQueries({ queryKey: ["entries", "products"] }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async ({ entry, payload }: { entry: EntryRecord | null; payload: Record<string, unknown> }) =>
      entry ? updateEntryRecord(kind, entry.id, payload) : createEntryRecord(kind, payload),
    onSuccess: async (record) => {
      await refreshAll();
      setView({ mode: "show", entry: record });
    }
  });

  const commentMutation = useMutation({
    mutationFn: ({ entryId, body }: { body: string; entryId: string }) => addEntryComment(kind, entryId, body),
    onSuccess: (record) => setView({ mode: "show", entry: record })
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { active: boolean; id: string }) => setEntryRecordActive(kind, id, active),
    onSuccess: async (record) => {
      await refreshAll();
      if (record) setView({ mode: "show", entry: record });
    }
  });

  const convertMutation = useMutation({
    mutationFn: () => convertQuotationsToSales(selectedQuotationIds),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
      setSelectedQuotationIds([]);
      setView({ mode: "show", entry: record });
    }
  });

  if (view.mode === "show") {
    return (
      <EntryShowPage
        entry={view.entry}
        kind={kind}
        onAddComment={(body) => commentMutation.mutate({ body, entryId: view.entry.id })}
        onBack={() => setView({ mode: "list" })}
        onEdit={() => setView({ mode: "upsert", entry: view.entry })}
        onRefresh={async () => {
          const refreshed = await getEntryRecord(kind, view.entry.id);
          setView({ mode: "show", entry: refreshed });
        }}
        onToggleActive={(active) => activeMutation.mutate({ active, id: view.entry.id })}
      />
    );
  }

  if (view.mode === "upsert") {
    return (
      <EntryUpsertPageView
        commonQueries={commonQueries}
        contacts={contactsQuery.data ?? []}
        entry={view.entry}
        kind={kind}
        loading={saveMutation.isPending}
        products={productsQuery.data ?? []}
        {...(saveMutation.error instanceof Error ? { saveError: saveMutation.error.message } : {})}
        onBack={() => setView(view.entry ? { mode: "show", entry: view.entry } : { mode: "list" })}
        onSaved={(payload) => saveMutation.mutate({ entry: view.entry, payload })}
        onRefreshSupport={refreshAll}
      />
    );
  }

  return (
    <WorkspacePage
      title={plural}
      description={kind === "quotation" ? "Create, review, and convert customer quotations." : "Create, review, and print customer invoices."}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {kind === "quotation" ? (
            <Button
              disabled={!selectedQuotationIds.length || convertMutation.isPending}
              type="button"
              variant="outline"
              onClick={() => convertMutation.mutate()}
            >
              <Send className="size-4" />
              Convert selected
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => void refreshAll()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button type="button" onClick={() => setView({ mode: "upsert", entry: null })}>
            <Plus className="size-4" />
            New {title}
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        searchPlaceholder={`Search ${title.toLowerCase()} number, customer, or reference`}
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <WorkspaceTablePanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-muted/45">
              <tr>
                {kind === "quotation" ? <WorkspaceTableHeaderCell className="w-12">Pick</WorkspaceTableHeaderCell> : null}
                <WorkspaceTableHeaderCell>#</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>{title}</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Date</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Customer</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Reference</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell className="text-right">Grand Total</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Active</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {pageRecords.map((entry, index) => {
                const selected = selectedQuotationIds.includes(entry.id);
                return (
                  <tr key={entry.id} className="border-b border-border/70 last:border-0">
                    {kind === "quotation" ? (
                      <td className="px-4 py-2.5">
                        <input
                          checked={selected}
                          className="size-4 accent-primary"
                          disabled={Boolean(entry.generatedSalesEntryId)}
                          type="checkbox"
                          onChange={() =>
                            setSelectedQuotationIds((current) =>
                              selected ? current.filter((value) => value !== entry.id) : [...current, entry.id],
                            )
                          }
                        />
                      </td>
                    ) : null}
                    <td className="px-4 py-2.5 text-muted-foreground">{(page - 1) * rowsPerPage + index + 1}</td>
                    <td className="px-4 py-2.5">
                      <button className="font-semibold text-left text-primary hover:underline" type="button" onClick={() => setView({ mode: "show", entry })}>
                        {entry.documentNo}
                      </button>
                      {kind === "quotation" && entry.generatedSalesDocumentNo ? (
                        <div className="mt-1 text-xs text-muted-foreground">Invoice: {entry.generatedSalesDocumentNo}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5">{formatDate(entry.documentDate)}</td>
                    <td className="px-4 py-2.5">{entry.customerName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{entry.referenceNo || "-"}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{money(entry.grandTotal)}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={entry.status} /></td>
                    <td className="px-4 py-2.5">
                      <WorkspaceStatusBadge label={entry.isActive ? "Active" : "Suspended"} tone={entry.isActive ? "success" : "warning"} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <WorkspaceRowActions
                        deleteLabel="Suspend"
                        isSuspended={!entry.isActive}
                        onDelete={() => activeMutation.mutate({ active: false, id: entry.id })}
                        onEdit={() => setView({ mode: "upsert", entry })}
                        onRestore={() => activeMutation.mutate({ active: true, id: entry.id })}
                        onView={() => setView({ mode: "show", entry })}
                        title={entry.documentNo}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!pageRecords.length && !entriesQuery.isLoading ? <WorkspaceTableEmptyState>No {plural.toLowerCase()} found.</WorkspaceTableEmptyState> : null}
      </WorkspaceTablePanel>
      <WorkspacePagination
        page={page}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(page, rowsPerPage, filtered.length)}
        singularLabel={plural.toLowerCase()}
        totalCount={filtered.length}
        totalPages={totalPages}
        onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))}
        onPageChange={setPage}
        onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(1);
        }}
      />
    </WorkspacePage>
  );
}

function EntryShowPage({
  entry,
  kind,
  onAddComment,
  onBack,
  onEdit,
  onRefresh,
  onToggleActive,
}: {
  entry: EntryRecord;
  kind: EntryKind;
  onAddComment: (body: string) => void;
  onBack: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  onToggleActive: (active: boolean) => void;
}) {
  const [comment, setComment] = useState("");
  const details: Array<[string, ReactNode]> = [
    [kind === "quotation" ? "Quotation no" : "Invoice no", entry.documentNo],
    ["Date", formatDate(entry.documentDate)],
    ["Customer", entry.customerName],
    ["GSTIN", entry.customerGstin || "-"],
    ["Place of supply", entry.placeOfSupply === "igst" ? "IGST" : "CGST + SGST"],
    ["Status", <StatusBadge status={entry.status} />],
    ["Payment", entry.paymentStatus],
  ];

  const toolRows: Array<[string, ReactNode]> = [
    ["E-invoice", entry.irn ? "Available" : "Draft"],
    ["E-way", entry.ewayBillNo ? "Available" : "Draft"],
    ["Transport", entry.transportName || "-"],
    ["Vehicle", entry.vehicleNo || "-"],
  ];

  return (
    <WorkspacePage
      title={`${kind === "quotation" ? "Quotation" : "Sales"} ${entry.documentNo}`}
      description={`${entry.customerName} • ${formatDate(entry.documentDate)}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="button" variant="outline" onClick={onRefresh}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button type="button" variant="outline" onClick={onEdit}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button type="button" variant="outline" onClick={() => onToggleActive(!entry.isActive)}>
            <ShieldCheck className="size-4" />
            {entry.isActive ? "Suspend" : "Restore"}
          </Button>
          <Button type="button" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      }
    >
      <WorkspaceShowLayout>
        <div className="space-y-4">
          <WorkspaceShowCard title="Entry details">
            <WorkspaceDetailTable rows={details} />
          </WorkspaceShowCard>
          <WorkspaceShowCard title="Line items">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="bg-muted/45">
                  <tr>
                    <WorkspaceTableHeaderCell>#</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Product</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>HSN</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Unit</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell className="text-right">Qty</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell className="text-right">Rate</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell className="text-right">Tax</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell className="text-right">Line Total</WorkspaceTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {entry.lines.map((line, index) => (
                    <tr key={line.id} className="border-b border-border/70 last:border-0">
                      <td className="px-4 py-2.5 text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium">{line.productName}</div>
                        <div className="text-xs text-muted-foreground">{line.description || "-"}</div>
                      </td>
                      <td className="px-4 py-2.5">{line.hsnCode || "-"}</td>
                      <td className="px-4 py-2.5">{line.unitName || "-"}</td>
                      <td className="px-4 py-2.5 text-right">{line.quantity}</td>
                      <td className="px-4 py-2.5 text-right">{money(line.rate)}</td>
                      <td className="px-4 py-2.5 text-right">{line.taxRate}%</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{money(line.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WorkspaceShowCard>
          <WorkspaceShowCard title="Comments">
            <div className="space-y-3">
              <div className="grid gap-3">
                <Textarea placeholder="Add a comment" value={comment} onChange={(event) => setComment(event.target.value)} />
                <div className="flex justify-end">
                  <Button
                    disabled={!comment.trim()}
                    type="button"
                    onClick={() => {
                      onAddComment(comment.trim());
                      setComment("");
                    }}
                  >
                    <Save className="size-4" />
                    Add comment
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {entry.comments.map((item) => (
                  <div key={item.id} className="rounded-md border border-border/70 px-3 py-2">
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>{item.authorEmail}</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{item.body}</p>
                  </div>
                ))}
                {!entry.comments.length ? <div className="text-sm text-muted-foreground">No comments yet.</div> : null}
              </div>
            </div>
          </WorkspaceShowCard>
        </div>
        <div className="space-y-4">
          <WorkspaceShowCard title="Entry tools">
            <WorkspaceDetailTable
              rows={[
                ...toolRows,
                ["E-invoice payload", <pre className="max-h-36 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(buildEinvoicePayload(entry), null, 2)}</pre>],
                ["E-way payload", <pre className="max-h-36 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(buildEwayPayload(entry), null, 2)}</pre>],
              ]}
            />
          </WorkspaceShowCard>
          <WorkspaceShowCard title="Activities">
            <div className="space-y-2">
              {entry.activities.map((activity) => (
                <div key={activity.id} className="rounded-md border border-border/70 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{activity.message}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{activity.actorEmail} • {activity.activityType}</div>
                </div>
              ))}
              {!entry.activities.length ? <div className="text-sm text-muted-foreground">No activity yet.</div> : null}
            </div>
          </WorkspaceShowCard>
          <WorkspacePrintPreview label="Print preview">
            <EntryPrintPreview entry={entry} />
          </WorkspacePrintPreview>
        </div>
      </WorkspaceShowLayout>
    </WorkspacePage>
  );
}

function EntryUpsertPageView({
  commonQueries,
  contacts,
  entry,
  kind,
  loading,
  products,
  saveError,
  onBack,
  onRefreshSupport,
  onSaved,
}: {
  commonQueries: ReturnType<typeof useCommonEntryLookups>;
  contacts: EntryContactRecord[];
  entry: EntryRecord | null;
  kind: EntryKind;
  loading: boolean;
  products: EntryProductRecord[];
  saveError?: string;
  onBack: () => void;
  onRefreshSupport: () => Promise<void>;
  onSaved: (payload: Record<string, unknown>) => void;
}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [editingContact, setEditingContact] = useState<ContactDraft | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductDraft | null>(null);
  const [form, setForm] = useState<EntryFormState>(() => formFromEntry(entry, kind));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setForm(formFromEntry(entry, kind));
  }, [entry, kind]);

  const contactMutation = useMutation({
    mutationFn: async (draft: ContactDraft) => draft.id ? updateEntryContact(draft.id, draft) : createEntryContact(draft),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: ["entries", "contacts"] });
      await onRefreshSupport();
      applyContact(record, setForm);
      setEditingContact(null);
    }
  });

  const productMutation = useMutation({
    mutationFn: async (draft: ProductDraft) =>
      draft.id
        ? updateEntryProduct(draft.id, productPayload(draft))
        : createEntryProduct(productPayload(draft)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["entries", "products"] });
      await onRefreshSupport();
      setEditingProduct(null);
    }
  });

  function submit() {
    const errors = validateForm(form);
    if (errors.length) {
      setFormError(errors[0] ?? "Fill the required fields.");
      return;
    }
    setFormError(null);
    onSaved(payloadFromForm(form));
  }

  const tabs: WorkspaceAnimatedTab[] = [
    {
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={kind === "quotation" ? "Quotation number" : "Invoice number"} required>
            <Input value={form.documentNo} onChange={(event) => setForm((current) => ({ ...current, documentNo: event.target.value }))} />
          </Field>
          <Field label="Date" required>
            <Input type="date" value={form.documentDate} onChange={(event) => setForm((current) => ({ ...current, documentDate: event.target.value }))} />
          </Field>
          <Field label="Customer" required className="md:col-span-2">
            <WorkspaceLookup
              createDescription="Create a sales contact without leaving the entry."
              createLabel="New contact"
              createMode="popup"
              createTitle="Contact"
              options={contacts.map(contactOption)}
              trailingAction={
                <LookupTrailingAction
                  canEdit={Boolean(form.customerId)}
                  onEdit={() => {
                    const selected = contacts.find((item) => item.id === form.customerId);
                    if (!selected) return;
                    contactMutation.reset();
                    setEditingContact(contactDraft(selected));
                  }}
                />
              }
              value={form.customerId || form.customerName}
              onCreate={async (name) => {
                const created = await contactMutation.mutateAsync({
                  ...blankContactDraft(),
                  code: slugCode(name),
                  legalName: name,
                  name,
                });
                return contactOption(created);
              }}
              onValueChange={(value, option) => {
                const contact = contacts.find((item) => item.id === value || item.name === option?.label);
                if (contact) applyContact(contact, setForm);
              }}
              renderCreateForm={({ initialName, onCancel, onCreated }) => (
                <ContactCreateForm
                  cities={commonQueries.cityOptions}
                  countries={commonQueries.countryOptions}
                  draft={{ ...blankContactDraft(), code: slugCode(initialName), legalName: initialName, name: initialName }}
                  {...(contactMutation.error instanceof Error ? { error: contactMutation.error.message } : {})}
                  loading={contactMutation.isPending}
                  onCancel={onCancel}
                  onSave={async (draft) => {
                    const created = await contactMutation.mutateAsync(draft);
                    onCreated(contactOption(created));
                  }}
                  pincodes={commonQueries.pincodeOptions}
                  states={commonQueries.stateOptions}
                />
              )}
            />
          </Field>
          <Field label="Reference number">
            <Input value={form.referenceNo} onChange={(event) => setForm((current) => ({ ...current, referenceNo: event.target.value }))} />
          </Field>
          <Field label="Due date">
            <Input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
          </Field>
          <Field label="Place of supply">
            <WorkspaceSelect options={supplyOptions.map(optionToSelect)} value={form.placeOfSupply} onValueChange={(value) => setForm((current) => ({ ...current, placeOfSupply: value as EntryFormState["placeOfSupply"] }))} />
          </Field>
          <Field label="Status">
            <WorkspaceSelect options={statusOptions.map(optionToSelect)} value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as EntryStatus }))} />
          </Field>
          <Field label="Payment status">
            <WorkspaceSelect options={paymentStatusOptions.map(optionToSelect)} value={form.paymentStatus} onValueChange={(value) => setForm((current) => ({ ...current, paymentStatus: value as EntryFormState["paymentStatus"] }))} />
          </Field>
          <Field label="Payment term">
            <WorkspaceLookup
              createLabel="Create"
              createMode="inline"
              options={commonQueries.paymentTermOptions}
              value={form.paymentTermId || form.paymentTermName}
              onCreate={async (name) => {
                const created = await createCommonMasterOption(paymentTermsDefinition.path, { name });
                await onRefreshSupport();
                return commonOption(created, "name");
              }}
              onValueChange={(value, option) => setForm((current) => ({ ...current, paymentTermId: value, paymentTermName: option?.label ?? "" }))}
            />
          </Field>
          <Field label="Sales type">
            <WorkspaceLookup
              createLabel="Create"
              createMode="inline"
              options={commonQueries.salesTypeOptions}
              value={form.salesTypeId || form.salesTypeName}
              onCreate={async (name) => {
                const created = await createCommonMasterOption(salesTypesDefinition.path, { name });
                await onRefreshSupport();
                return commonOption(created, "name");
              }}
              onValueChange={(value, option) => setForm((current) => ({ ...current, salesTypeId: value, salesTypeName: option?.label ?? "" }))}
            />
          </Field>
          <Field label="Work order number">
            <Input value={form.workOrderNo} onChange={(event) => setForm((current) => ({ ...current, workOrderNo: event.target.value }))} />
          </Field>
        </div>
      ),
      label: "General",
      value: "general",
    },
    {
      content: (
        <div className="space-y-4">
          <WorkspaceLineTableHeader label="Item lines">
            <Button type="button" variant="outline" onClick={() => setForm((current) => ({ ...current, lines: [...current.lines, emptyLine()] }))}>
              <Plus className="size-4" />
              Add item
            </Button>
          </WorkspaceLineTableHeader>
          <WorkspaceLineTable
            columns={[
              {
                header: "Product",
                width: "280px",
                render: (line, index) => (
                  <WorkspaceLookup
                    createDescription="Create a product without leaving the entry."
                    createLabel="New product"
                    createMode="popup"
                    createTitle="Product"
                    options={products.map(productOption)}
                    trailingAction={
                      <LookupTrailingAction
                        canEdit={Boolean(line.productId)}
                        onEdit={() => {
                          const selected = products.find((item) => item.id === line.productId);
                          if (!selected) return;
                          productMutation.reset();
                          setEditingProduct(productDraft(selected));
                        }}
                      />
                    }
                    value={line.productId || line.productName}
                    onCreate={async (name) => {
                      const created = await productMutation.mutateAsync({
                        ...blankProductDraft(),
                        code: slugCode(name),
                        name,
                      });
                      return productOption(created);
                    }}
                    onValueChange={(value, option) => {
                      const product = products.find((item) => item.id === value || item.name === option?.label);
                      if (!product) {
                        updateLine(index, { productName: option?.label ?? value });
                        return;
                      }
                      updateLine(index, {
                        hsnCode: product.hsnCode,
                        hsnCodeId: product.hsnCodeId,
                        productId: product.id,
                        productName: product.name,
                        rate: product.price,
                        taxDescription: product.taxDescription,
                        taxId: product.taxId,
                        taxRate: product.taxRate,
                        unitId: product.unitId,
                        unitName: product.unitName,
                      });
                    }}
                    renderCreateForm={({ initialName, onCancel, onCreated }) => (
                      <ProductCreateForm
                        draft={{ ...blankProductDraft(), code: slugCode(initialName), name: initialName }}
                        {...(productMutation.error instanceof Error ? { error: productMutation.error.message } : {})}
                        hsnOptions={commonQueries.hsnOptions}
                        loading={productMutation.isPending}
                        productTypeOptions={commonQueries.productTypeOptions}
                        taxOptions={commonQueries.taxOptions}
                        unitOptions={commonQueries.unitOptions}
                        onCancel={onCancel}
                        onSave={async (draft) => {
                          const created = await productMutation.mutateAsync(draft);
                          onCreated(productOption(created));
                        }}
                      />
                    )}
                  />
                ),
              },
              {
                header: "Description",
                render: (line, index) => (
                  <Input value={line.description || ""} onChange={(event) => updateLine(index, { description: event.target.value })} />
                ),
              },
              {
                header: "HSN",
                width: "180px",
                render: (line, index) => (
                  <WorkspaceLookup
                    createLabel="Create"
                    createMode="popup"
                    options={commonQueries.hsnOptions}
                    value={line.hsnCodeId || line.hsnCode || ""}
                    onCreate={async () => undefined}
                    onValueChange={(value, option) => updateLine(index, { hsnCode: option?.label ?? value, hsnCodeId: value })}
                    renderCreateForm={({ initialName, onCancel, onCreated }) => (
                      <CommonTwoFieldCreateForm
                        descriptionLabel="Description"
                        firstLabel="Code"
                        firstValue={initialName}
                        loading={false}
                        onCancel={onCancel}
                        onSave={async (code, description) => {
                          const created = await createCommonMasterOption(hsnCodesDefinition.path, { code, description });
                          await onRefreshSupport();
                          onCreated(commonOption(created, "code", "description"));
                        }}
                        title="HSN code"
                      />
                    )}
                  />
                ),
              },
              {
                header: "Unit",
                width: "140px",
                render: (line, index) => (
                  <WorkspaceLookup
                    createLabel="Create"
                    createMode="inline"
                    options={commonQueries.unitOptions}
                    value={line.unitId || line.unitName || ""}
                    onCreate={async (name) => {
                      const created = await createCommonMasterOption(unitsDefinition.path, { name });
                      await onRefreshSupport();
                      return commonOption(created, "name");
                    }}
                    onValueChange={(value, option) => updateLine(index, { unitId: value, unitName: option?.label ?? value })}
                  />
                ),
              },
              {
                header: "Tax",
                width: "180px",
                render: (line, index) => (
                  <WorkspaceLookup
                    createLabel="Create"
                    createMode="popup"
                    options={commonQueries.taxOptions}
                    value={line.taxId || line.taxDescription || ""}
                    onValueChange={(value, option) => {
                      const tax = commonQueries.taxes.find((item) => item.id === value);
                      updateLine(index, {
                        taxDescription: option?.label ?? value,
                        taxId: value,
                        taxRate: Number(tax?.ratePercent ?? 0),
                      });
                    }}
                    renderCreateForm={({ initialName, onCancel, onCreated }) => (
                      <TaxCreateForm
                        description={initialName}
                        onCancel={onCancel}
                        onCreated={onCreated}
                        onRefreshSupport={onRefreshSupport}
                      />
                    )}
                  />
                ),
              },
              {
                header: "Qty",
                width: "100px",
                render: (line, index) => (
                  <Input type="number" value={String(line.quantity)} onChange={(event) => updateLine(index, { quantity: Number(event.target.value || 0) })} />
                ),
              },
              {
                header: "Rate",
                width: "120px",
                render: (line, index) => (
                  <Input type="number" value={String(line.rate)} onChange={(event) => updateLine(index, { rate: Number(event.target.value || 0) })} />
                ),
              },
              {
                header: "Disc",
                width: "110px",
                render: (line, index) => (
                  <Input type="number" value={String(line.discountAmount)} onChange={(event) => updateLine(index, { discountAmount: Number(event.target.value || 0) })} />
                ),
              },
              {
                header: "Tax %",
                width: "100px",
                render: (line, index) => (
                  <Input type="number" value={String(line.taxRate)} onChange={(event) => updateLine(index, { taxRate: Number(event.target.value || 0) })} />
                ),
              },
              {
                header: "Total",
                width: "120px",
                render: (line) => <div className="text-right font-semibold">{money(lineTotal(line))}</div>,
              },
            ]}
            data={form.lines}
            minWidth="1700px"
            rowKey={(row) => row.id}
            onAdd={() => setForm((current) => ({ ...current, lines: [...current.lines, emptyLine()] }))}
            onDelete={(_, index) => setForm((current) => ({ ...current, lines: current.lines.filter((__, itemIndex) => itemIndex !== index) }))}
          />
        </div>
      ),
      label: "Items",
      value: "items",
    },
    {
      content: (
        <div className="grid gap-4">
          <Field label="Billing address">
            <Textarea rows={4} value={form.billingAddress} onChange={(event) => setForm((current) => ({ ...current, billingAddress: event.target.value }))} />
          </Field>
          <Field label="Shipping address">
            <Textarea rows={4} value={form.shippingAddress} onChange={(event) => setForm((current) => ({ ...current, shippingAddress: event.target.value }))} />
          </Field>
        </div>
      ),
      label: "Address",
      value: "address",
    },
    {
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Transport">
            <WorkspaceLookup
              createDescription="Create a transport record."
              createLabel="Create"
              createMode="popup"
              options={commonQueries.transportOptions}
              value={form.transportId || form.transportName}
              onValueChange={(value, option) => {
                const record = commonQueries.transports.find((item) => item.id === value);
                setForm((current) => ({
                  ...current,
                  transportAddress: String(record?.address ?? current.transportAddress),
                  transportContactNo: String(record?.contactNo ?? current.transportContactNo),
                  transportContactPerson: String(record?.contactPerson ?? current.transportContactPerson),
                  transportGst: String(record?.gst ?? current.transportGst),
                  transportId: value,
                  transportName: option?.label ?? current.transportName,
                  vehicleNo: String(record?.vehicleNo ?? current.vehicleNo),
                }));
              }}
              renderCreateForm={({ initialName, onCancel, onCreated }) => (
                <TransportCreateForm
                  initialName={initialName}
                  onCancel={onCancel}
                  onCreated={onCreated}
                  onRefreshSupport={onRefreshSupport}
                />
              )}
            />
          </Field>
          <Field label="Vehicle number">
            <Input value={form.vehicleNo} onChange={(event) => setForm((current) => ({ ...current, vehicleNo: event.target.value }))} />
          </Field>
          <Field label="E-way bill number">
            <Input value={form.ewayBillNo} onChange={(event) => setForm((current) => ({ ...current, ewayBillNo: event.target.value }))} />
          </Field>
          <Field label="E-way bill date">
            <Input type="date" value={form.ewayBillDate} onChange={(event) => setForm((current) => ({ ...current, ewayBillDate: event.target.value }))} />
          </Field>
          <Field label="E-way part">
            <Input value={form.ewayPart} onChange={(event) => setForm((current) => ({ ...current, ewayPart: event.target.value }))} />
          </Field>
          <Field label="Transport GST">
            <Input value={form.transportGst} onChange={(event) => setForm((current) => ({ ...current, transportGst: event.target.value }))} />
          </Field>
        </div>
      ),
      label: "E-way",
      value: "eway",
    },
    {
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="IRN">
            <Input value={form.irn} onChange={(event) => setForm((current) => ({ ...current, irn: event.target.value }))} />
          </Field>
          <Field label="Ack number">
            <Input value={form.ackNo} onChange={(event) => setForm((current) => ({ ...current, ackNo: event.target.value }))} />
          </Field>
          <Field label="Ack date">
            <Input type="date" value={form.ackDate} onChange={(event) => setForm((current) => ({ ...current, ackDate: event.target.value }))} />
          </Field>
          <Field label="Signed QR">
            <Textarea rows={3} value={form.signedQr} onChange={(event) => setForm((current) => ({ ...current, signedQr: event.target.value }))} />
          </Field>
          <div className="md:col-span-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="size-4" />
              Preview payload
            </div>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(buildEinvoicePayload(entryFromForm(kind, form)), null, 2)}</pre>
          </div>
        </div>
      ),
      label: "E-invoice",
      value: "einvoice",
    },
    {
      content: (
        <div className="grid gap-4">
          <Field label="Notes">
            <Textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </Field>
          <Field label="Terms">
            <Textarea rows={6} value={form.terms} onChange={(event) => setForm((current) => ({ ...current, terms: event.target.value }))} />
          </Field>
        </div>
      ),
      label: "Terms",
      value: "terms",
    },
  ];

  function updateLine(index: number, patch: Partial<EntryLineRecord>) {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) => {
        if (lineIndex !== index) return line;
        return { ...line, ...patch };
      }),
    }));
  }

  return (
    <WorkspaceUpsertPage
      description={`Enter the ${kind === "quotation" ? "quotation" : "invoice"} details and save without leaving the list.`}
      onBack={onBack}
      title={`${entry ? "Edit" : "New"} ${kind === "quotation" ? "quotation" : "sales"}`}
    >
      <div className="space-y-4">
        {saveError || formError ? <WorkspaceFormBanner title="Unable to save">{saveError ?? formError}</WorkspaceFormBanner> : null}
        <WorkspaceFormPanel
          footer={
            <WorkspaceFormFooter
              onCancel={onBack}
              primaryLabel="Save"
              primaryLoading={loading}
              primaryProps={{ children: <><Save className="size-4" />Save</> }}
            />
          }
          title="Entry"
        >
          <WorkspaceAnimatedTabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
          <div className="mt-6 rounded-md border border-border/70 bg-muted/25 px-4 py-3 text-sm">
            <div className="grid gap-2 md:grid-cols-5">
              <SummaryValue label="Subtotal" value={money(totals(form.lines, form.roundOff).subtotal)} />
              <SummaryValue label="Discount" value={money(totals(form.lines, form.roundOff).discount)} />
              <SummaryValue label="Taxable" value={money(totals(form.lines, form.roundOff).taxable)} />
              <SummaryValue label="Tax" value={money(totals(form.lines, form.roundOff).tax)} />
              <SummaryValue label="Grand total" strong value={money(totals(form.lines, form.roundOff).grand)} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={submit}>
              <Save className="size-4" />
              Save {kind === "quotation" ? "quotation" : "sales"}
            </Button>
          </div>
        </WorkspaceFormPanel>
      </div>
      <Dialog open={Boolean(editingContact)} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent className="rounded-md sm:max-w-4xl" onInteractOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit contact</DialogTitle>
          </DialogHeader>
          {editingContact ? (
            <ContactCreateForm
              cities={commonQueries.cityOptions}
              countries={commonQueries.countryOptions}
              draft={editingContact}
              {...(contactMutation.error instanceof Error ? { error: contactMutation.error.message } : {})}
              loading={contactMutation.isPending}
              onCancel={() => setEditingContact(null)}
              onSave={(draft) => contactMutation.mutate(draft)}
              pincodes={commonQueries.pincodeOptions}
              states={commonQueries.stateOptions}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(editingProduct)} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="rounded-md sm:max-w-3xl" onInteractOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
          </DialogHeader>
          {editingProduct ? (
            <ProductCreateForm
              draft={editingProduct}
              {...(productMutation.error instanceof Error ? { error: productMutation.error.message } : {})}
              hsnOptions={commonQueries.hsnOptions}
              loading={productMutation.isPending}
              productTypeOptions={commonQueries.productTypeOptions}
              taxOptions={commonQueries.taxOptions}
              unitOptions={commonQueries.unitOptions}
              onCancel={() => setEditingProduct(null)}
              onSave={(draft) => productMutation.mutate(draft)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </WorkspaceUpsertPage>
  );
}

function useCommonEntryLookups() {
  const countries = useQuery({ queryFn: () => listCommonMasterOptions("/core/common/location/countries"), queryKey: ["entries", "lookup", "countries"] });
  const states = useQuery({ queryFn: () => listCommonMasterOptions("/core/common/location/states"), queryKey: ["entries", "lookup", "states"] });
  const cities = useQuery({ queryFn: () => listCommonMasterOptions("/core/common/location/cities"), queryKey: ["entries", "lookup", "cities"] });
  const pincodes = useQuery({ queryFn: () => listCommonMasterOptions("/core/common/location/pincodes"), queryKey: ["entries", "lookup", "pincodes"] });
  const productTypes = useQuery({ queryFn: () => listCommonMasterOptions(productTypesDefinition.path), queryKey: ["entries", "lookup", "productTypes"] });
  const hsnCodes = useQuery({ queryFn: () => listCommonMasterOptions(hsnCodesDefinition.path), queryKey: ["entries", "lookup", "hsnCodes"] });
  const units = useQuery({ queryFn: () => listCommonMasterOptions(unitsDefinition.path), queryKey: ["entries", "lookup", "units"] });
  const taxes = useQuery({ queryFn: () => listCommonMasterOptions(taxesDefinition.path), queryKey: ["entries", "lookup", "taxes"] });
  const colours = useQuery({ queryFn: () => listCommonMasterOptions(coloursDefinition.path), queryKey: ["entries", "lookup", "colours"] });
  const sizes = useQuery({ queryFn: () => listCommonMasterOptions(sizesDefinition.path), queryKey: ["entries", "lookup", "sizes"] });
  const transports = useQuery({ queryFn: () => listCommonMasterOptions(transportsDefinition.path), queryKey: ["entries", "lookup", "transports"] });
  const paymentTerms = useQuery({ queryFn: () => listCommonMasterOptions(paymentTermsDefinition.path), queryKey: ["entries", "lookup", "paymentTerms"] });
  const salesTypes = useQuery({ queryFn: () => listCommonMasterOptions(salesTypesDefinition.path), queryKey: ["entries", "lookup", "salesTypes"] });
  return {
    cities: cities.data ?? [],
    cityOptions: (cities.data ?? []).map((item) => commonOption(item, "name")),
    countries: countries.data ?? [],
    countryOptions: (countries.data ?? []).map((item) => commonOption(item, "name")),
    hsnCodes: hsnCodes.data ?? [],
    hsnOptions: (hsnCodes.data ?? []).map((item) => commonOption(item, "code", "description")),
    paymentTermOptions: (paymentTerms.data ?? []).map((item) => commonOption(item, "name")),
    pincodeOptions: (pincodes.data ?? []).map((item) => commonOption(item, "pincode", "areaName")),
    productTypeOptions: (productTypes.data ?? []).map((item) => commonOption(item, "name")),
    salesTypeOptions: (salesTypes.data ?? []).map((item) => commonOption(item, "name")),
    sizes: sizes.data ?? [],
    sizeOptions: (sizes.data ?? []).map((item) => commonOption(item, "name")),
    stateOptions: (states.data ?? []).map((item) => commonOption(item, "name")),
    states: states.data ?? [],
    taxes: taxes.data ?? [],
    taxOptions: (taxes.data ?? []).map((item) => ({
      description: `GST ${Number(item.ratePercent ?? 0)}%`,
      label: String(item.description ?? item.name ?? item.id),
      value: item.id,
    })),
    transportOptions: (transports.data ?? []).map((item) => commonOption(item, "name", "contactPerson")),
    transports: transports.data ?? [],
    unitOptions: (units.data ?? []).map((item) => commonOption(item, "name")),
    colourOptions: (colours.data ?? []).map((item) => commonOption(item, "name")),
  };
}

function EntryPrintPreview({ entry }: { entry: EntryRecord }) {
  return (
    <WorkspacePrintSheet>
      <div className="border-b border-black px-4 py-4 text-center">
        <div className="text-lg font-semibold tracking-wide">{entry.kind === "quotation" ? "QUOTATION" : "TAX INVOICE"}</div>
        <div className="mt-1 text-xs">{entry.documentNo} • {formatDate(entry.documentDate)}</div>
      </div>
      <div className="grid grid-cols-2 gap-6 px-4 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase">Bill To</div>
          <div className="mt-2 text-xs font-semibold">{entry.customerName}</div>
          <div className="mt-1 whitespace-pre-wrap text-xs">{entry.billingAddress || "-"}</div>
          <div className="mt-1 text-xs">GSTIN: {entry.customerGstin || "-"}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase">Supply</div>
          <div className="mt-2 text-xs">{entry.placeOfSupply === "igst" ? "IGST" : "CGST + SGST"}</div>
          <div className="mt-1 text-xs">Reference: {entry.referenceNo || "-"}</div>
          <div className="mt-1 text-xs">Due: {formatDate(entry.dueDate)}</div>
        </div>
      </div>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-y border-black bg-muted/30">
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Product</th>
            <th className="px-3 py-2 text-left">HSN</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Rate</th>
            <th className="px-3 py-2 text-right">Tax</th>
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {entry.lines.map((line, index) => (
            <tr key={line.id} className="border-b border-black/30">
              <td className="px-3 py-2">{index + 1}</td>
              <td className="px-3 py-2">{line.productName}</td>
              <td className="px-3 py-2">{line.hsnCode || "-"}</td>
              <td className="px-3 py-2 text-right">{line.quantity}</td>
              <td className="px-3 py-2 text-right">{money(line.rate)}</td>
              <td className="px-3 py-2 text-right">{line.taxRate}%</td>
              <td className="px-3 py-2 text-right">{money(line.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-[1fr_18rem] gap-6 px-4 py-4">
        <div className="space-y-2 text-xs">
          <div className="font-semibold uppercase">Terms</div>
          <div className="whitespace-pre-wrap">{entry.terms || "Goods once sold will not be taken back unless agreed in writing."}</div>
        </div>
        <div className="rounded-md border border-black/40">
          <PrintTotalRow label="Subtotal" value={money(entry.subtotal)} />
          <PrintTotalRow label="Discount" value={money(entry.discountTotal)} />
          <PrintTotalRow label="Taxable" value={money(entry.taxableTotal)} />
          <PrintTotalRow label="Tax" value={money(entry.taxTotal)} />
          <PrintTotalRow label="Round off" value={money(entry.roundOff)} />
          <PrintTotalRow label="Grand total" strong value={money(entry.grandTotal)} />
        </div>
      </div>
    </WorkspacePrintSheet>
  );
}

function ContactCreateForm({
  cities,
  countries,
  draft,
  error,
  loading,
  onCancel,
  onSave,
  pincodes,
  states,
}: {
  cities: WorkspaceLookupOption[];
  countries: WorkspaceLookupOption[];
  draft: ContactDraft;
  error?: string;
  loading: boolean;
  onCancel: () => void;
  onSave: (draft: ContactDraft) => void;
  pincodes: WorkspaceLookupOption[];
  states: WorkspaceLookupOption[];
}) {
  const [value, setValue] = useState(draft);
  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">Contact</div>
        <div className="text-sm text-muted-foreground">Create or update the contact record for this entry.</div>
      </div>
      {error ? <WorkspaceFormBanner title="Unable to save">{error}</WorkspaceFormBanner> : null}
      <WorkspaceFormGrid>
        <Field label="Code" required><Input value={value.code} onChange={(event) => setValue((current) => ({ ...current, code: event.target.value }))} /></Field>
        <Field label="Contact name" required><Input value={value.name} onChange={(event) => setValue((current) => ({ ...current, name: event.target.value }))} /></Field>
        <Field label="Legal name"><Input value={value.legalName} onChange={(event) => setValue((current) => ({ ...current, legalName: event.target.value }))} /></Field>
        <Field label="GSTIN"><Input value={value.gstin} onChange={(event) => setValue((current) => ({ ...current, gstin: event.target.value }))} /></Field>
        <Field label="Phone"><Input value={value.phone} onChange={(event) => setValue((current) => ({ ...current, phone: event.target.value }))} /></Field>
        <Field label="Email"><Input value={value.email} onChange={(event) => setValue((current) => ({ ...current, email: event.target.value }))} /></Field>
        <Field className="md:col-span-2" label="Address line 1"><Input value={value.addressLine1} onChange={(event) => setValue((current) => ({ ...current, addressLine1: event.target.value }))} /></Field>
        <Field className="md:col-span-2" label="Address line 2"><Input value={value.addressLine2} onChange={(event) => setValue((current) => ({ ...current, addressLine2: event.target.value }))} /></Field>
        <Field label="Country"><WorkspaceLookup options={countries} value={value.countryId || value.countryName} onValueChange={(next, option) => setValue((current) => ({ ...current, countryId: next, countryName: option?.label ?? "" }))} /></Field>
        <Field label="State"><WorkspaceLookup options={states} value={value.stateId || value.stateName} onValueChange={(next, option) => setValue((current) => ({ ...current, stateId: next, stateName: option?.label ?? "" }))} /></Field>
        <Field label="City"><WorkspaceLookup options={cities} value={value.cityId || value.cityName} onValueChange={(next, option) => setValue((current) => ({ ...current, cityId: next, cityName: option?.label ?? "" }))} /></Field>
        <Field label="Pincode"><WorkspaceLookup options={pincodes} value={value.pincodeId || value.pincodeName} onValueChange={(next, option) => setValue((current) => ({ ...current, pincodeId: next, pincodeName: option?.label ?? "" }))} /></Field>
      </WorkspaceFormGrid>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={loading} type="button" onClick={() => onSave(value)}><Save className="size-4" />Save</Button>
      </div>
    </div>
  );
}

function ProductCreateForm({
  draft,
  error,
  hsnOptions,
  loading,
  productTypeOptions,
  taxOptions,
  unitOptions,
  onCancel,
  onSave,
}: {
  draft: ProductDraft;
  error?: string;
  hsnOptions: WorkspaceLookupOption[];
  loading: boolean;
  productTypeOptions: WorkspaceLookupOption[];
  taxOptions: WorkspaceLookupOption[];
  unitOptions: WorkspaceLookupOption[];
  onCancel: () => void;
  onSave: (draft: ProductDraft) => void;
}) {
  const [value, setValue] = useState(draft);
  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">Product</div>
        <div className="text-sm text-muted-foreground">Create or update the product record used in this entry.</div>
      </div>
      {error ? <WorkspaceFormBanner title="Unable to save">{error}</WorkspaceFormBanner> : null}
      <WorkspaceFormGrid>
        <Field label="Code" required><Input value={value.code} onChange={(event) => setValue((current) => ({ ...current, code: event.target.value }))} /></Field>
        <Field label="Product name" required><Input value={value.name} onChange={(event) => setValue((current) => ({ ...current, name: event.target.value }))} /></Field>
        <Field label="Product type"><WorkspaceLookup options={productTypeOptions} value={value.productTypeId || value.productTypeName} onValueChange={(next, option) => setValue((current) => ({ ...current, productTypeId: next, productTypeName: option?.label ?? "" }))} /></Field>
        <Field label="HSN code"><WorkspaceLookup options={hsnOptions} value={value.hsnCodeId || value.hsnCode} onValueChange={(next, option) => setValue((current) => ({ ...current, hsnCodeId: next, hsnCode: option?.label ?? "" }))} /></Field>
        <Field label="Unit"><WorkspaceLookup options={unitOptions} value={value.unitId || value.unitName} onValueChange={(next, option) => setValue((current) => ({ ...current, unitId: next, unitName: option?.label ?? "" }))} /></Field>
        <Field label="Tax"><WorkspaceLookup options={taxOptions} value={value.taxId || value.taxDescription} onValueChange={(next, option) => setValue((current) => ({ ...current, taxId: next, taxDescription: option?.label ?? "", taxRate: String(option?.description?.replace(/[^\d.]/g, "") || "0") }))} /></Field>
        <Field label="Tax rate"><Input type="number" value={value.taxRate} onChange={(event) => setValue((current) => ({ ...current, taxRate: event.target.value }))} /></Field>
        <Field label="Price"><Input type="number" value={value.price} onChange={(event) => setValue((current) => ({ ...current, price: event.target.value }))} /></Field>
      </WorkspaceFormGrid>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={loading} type="button" onClick={() => onSave(value)}><Save className="size-4" />Save</Button>
      </div>
    </div>
  );
}

function CommonTwoFieldCreateForm({
  descriptionLabel,
  error,
  firstLabel,
  firstValue,
  loading,
  onCancel,
  onSave,
  title,
}: {
  descriptionLabel: string;
  error?: string;
  firstLabel: string;
  firstValue: string;
  loading: boolean;
  onCancel: () => void;
  onSave: (first: string, second: string) => void;
  title: string;
}) {
  const [first, setFirst] = useState(firstValue);
  const [second, setSecond] = useState("");
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">{title}</div>
      {error ? <WorkspaceFormBanner title="Unable to save">{error}</WorkspaceFormBanner> : null}
      <WorkspaceFormGrid>
        <Field label={firstLabel} required><Input value={first} onChange={(event) => setFirst(event.target.value)} /></Field>
        <Field label={descriptionLabel} required><Input value={second} onChange={(event) => setSecond(event.target.value)} /></Field>
      </WorkspaceFormGrid>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={loading} type="button" onClick={() => onSave(first, second)}><Save className="size-4" />Save</Button>
      </div>
    </div>
  );
}

function TaxCreateForm({
  description,
  onCancel,
  onCreated,
  onRefreshSupport,
}: {
  description: string;
  onCancel: () => void;
  onCreated: (option: WorkspaceLookupOption) => void;
  onRefreshSupport: () => Promise<void>;
}) {
  const [label, setLabel] = useState(description);
  const [rate, setRate] = useState("18");
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Tax</div>
      <WorkspaceFormGrid>
        <Field label="Description" required><Input value={label} onChange={(event) => setLabel(event.target.value)} /></Field>
        <Field label="Rate percent" required><Input type="number" value={rate} onChange={(event) => setRate(event.target.value)} /></Field>
      </WorkspaceFormGrid>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          type="button"
          onClick={async () => {
            const created = await createCommonMasterOption(taxesDefinition.path, { description: label, ratePercent: Number(rate || 0) });
            await onRefreshSupport();
            onCreated({
              description: `GST ${Number(created.ratePercent ?? 0)}%`,
              label: String(created.description ?? label),
              value: created.id,
            });
          }}
        >
          <Save className="size-4" />
          Save
        </Button>
      </div>
    </div>
  );
}

function TransportCreateForm({
  initialName,
  onCancel,
  onCreated,
  onRefreshSupport,
}: {
  initialName: string;
  onCancel: () => void;
  onCreated: (option: WorkspaceLookupOption) => void;
  onRefreshSupport: () => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [gst, setGst] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [address, setAddress] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Transport</div>
      <WorkspaceFormGrid>
        <Field label="Name" required><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="GST"><Input value={gst} onChange={(event) => setGst(event.target.value)} /></Field>
        <Field label="Vehicle number"><Input value={vehicleNo} onChange={(event) => setVehicleNo(event.target.value)} /></Field>
        <Field label="Contact number"><Input value={contactNo} onChange={(event) => setContactNo(event.target.value)} /></Field>
        <Field label="Contact person"><Input value={contactPerson} onChange={(event) => setContactPerson(event.target.value)} /></Field>
        <Field className="md:col-span-2" label="Address"><Input value={address} onChange={(event) => setAddress(event.target.value)} /></Field>
      </WorkspaceFormGrid>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          type="button"
          onClick={async () => {
            const created = await createCommonMasterOption(transportsDefinition.path, { address, contactNo, contactPerson, gst, name, vehicleNo });
            await onRefreshSupport();
            onCreated(commonOption(created, "name", "contactPerson"));
          }}
        >
          <Save className="size-4" />
          Save
        </Button>
      </div>
    </div>
  );
}

function LookupTrailingAction({ canEdit, onEdit }: { canEdit: boolean; onEdit: () => void }) {
  return (
    <div className="pointer-events-auto absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
      {canEdit ? (
        <button className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" type="button" onMouseDown={(event) => event.preventDefault()} onClick={onEdit}>
          <Pencil className="size-3.5" />
        </button>
      ) : null}
      <ChevronDown className="size-4 text-muted-foreground" />
    </div>
  );
}

function Field({
  children,
  className,
  label,
  required,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  required?: boolean;
}) {
  return <div className={className}><WorkspaceFormField label={label} {...(required ? { required: true } : {})}>{children}</WorkspaceFormField></div>;
}

function SummaryValue({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className={cn("rounded-md bg-background px-3 py-2", strong && "border border-primary/20 bg-primary/5")}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-sm font-medium", strong && "text-primary")}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "posted") return <WorkspaceStatusBadge label="posted" tone="success" />;
  if (status === "cancelled") return <WorkspaceStatusBadge label="cancelled" tone="danger" />;
  return <WorkspaceStatusBadge label="draft" tone="warning" />;
}

function PrintTotalRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className={cn("flex items-center justify-between px-3 py-2 text-xs", strong && "border-t border-black/40 font-semibold")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function formFromEntry(entry: EntryRecord | null, _kind: EntryKind): EntryFormState {
  return {
    ackDate: entry?.ackDate ?? "",
    ackNo: entry?.ackNo ?? "",
    billingAddress: entry?.billingAddress ?? "",
    customerGstin: entry?.customerGstin ?? "",
    customerId: entry?.customerId ?? "",
    customerName: entry?.customerName ?? "",
    customerStateCode: entry?.customerStateCode ?? "",
    customerStateName: entry?.customerStateName ?? "",
    discountTotal: String(entry?.discountTotal ?? 0),
    documentDate: entry?.documentDate ?? today(),
    documentNo: entry?.documentNo ?? "",
    dueDate: entry?.dueDate ?? "",
    ewayBillDate: entry?.ewayBillDate ?? "",
    ewayBillNo: entry?.ewayBillNo ?? "",
    ewayPart: entry?.ewayPart ?? "part-b",
    irn: entry?.irn ?? "",
    isActive: entry?.isActive ?? true,
    lines: entry?.lines?.length ? entry.lines : [emptyLine()],
    notes: entry?.notes ?? "",
    paidAmount: String(entry?.paidAmount ?? 0),
    paymentStatus: entry?.paymentStatus ?? "unpaid",
    paymentTermId: entry?.paymentTermId ?? "",
    paymentTermName: entry?.paymentTermName ?? "",
    placeOfSupply: entry?.placeOfSupply ?? "cgst-sgst",
    referenceNo: entry?.referenceNo ?? "",
    roundOff: String(entry?.roundOff ?? 0),
    salesTypeId: entry?.salesTypeId ?? "",
    salesTypeName: entry?.salesTypeName ?? "",
    shippingAddress: entry?.shippingAddress ?? "",
    signedQr: entry?.signedQr ?? "",
    source: entry?.source ?? null,
    status: entry?.status ?? "draft",
    terms: entry?.terms ?? "Goods once sold will not be taken back unless agreed in writing.",
    transportAddress: entry?.transportAddress ?? "",
    transportContactNo: entry?.transportContactNo ?? "",
    transportContactPerson: entry?.transportContactPerson ?? "",
    transportGst: entry?.transportGst ?? "",
    transportId: entry?.transportId ?? "",
    transportName: entry?.transportName ?? "",
    vehicleNo: entry?.vehicleNo ?? "",
    workOrderNo: entry?.workOrderNo ?? "",
  };
}

function payloadFromForm(form: EntryFormState) {
  return {
    ackDate: form.ackDate || null,
    ackNo: form.ackNo || null,
    billingAddress: form.billingAddress || null,
    customerGstin: form.customerGstin || null,
    customerId: form.customerId || null,
    customerName: form.customerName,
    customerStateCode: form.customerStateCode || null,
    customerStateName: form.customerStateName || null,
    documentDate: form.documentDate,
    documentNo: form.documentNo || null,
    dueDate: form.dueDate || null,
    ewayBillDate: form.ewayBillDate || null,
    ewayBillNo: form.ewayBillNo || null,
    ewayPart: form.ewayPart || null,
    irn: form.irn || null,
    isActive: form.isActive,
    lines: form.lines.map((line) => ({
      colourId: line.colourId,
      colourName: line.colourName,
      dcNo: line.dcNo,
      description: line.description,
      discountAmount: Number(line.discountAmount || 0),
      hsnCode: line.hsnCode,
      hsnCodeId: line.hsnCodeId,
      productId: line.productId,
      productName: line.productName,
      poNo: line.poNo,
      quantity: Number(line.quantity || 0),
      rate: Number(line.rate || 0),
      sizeId: line.sizeId,
      sizeName: line.sizeName,
      taxDescription: line.taxDescription,
      taxId: line.taxId,
      taxRate: Number(line.taxRate || 0),
      unitId: line.unitId,
      unitName: line.unitName,
    })),
    notes: form.notes || null,
    paidAmount: Number(form.paidAmount || 0),
    paymentStatus: form.paymentStatus,
    paymentTermId: form.paymentTermId || null,
    paymentTermName: form.paymentTermName || null,
    placeOfSupply: form.placeOfSupply,
    referenceNo: form.referenceNo || null,
    roundOff: Number(form.roundOff || 0),
    salesTypeId: form.salesTypeId || null,
    salesTypeName: form.salesTypeName || null,
    shippingAddress: form.shippingAddress || null,
    signedQr: form.signedQr || null,
    source: form.source,
    status: form.status,
    terms: form.terms || null,
    transportAddress: form.transportAddress || null,
    transportContactNo: form.transportContactNo || null,
    transportContactPerson: form.transportContactPerson || null,
    transportGst: form.transportGst || null,
    transportId: form.transportId || null,
    transportName: form.transportName || null,
    vehicleNo: form.vehicleNo || null,
    workOrderNo: form.workOrderNo || null,
  };
}

function entryFromForm(kind: EntryKind, form: EntryFormState): EntryRecord {
  const total = totals(form.lines, form.roundOff);
  return {
    ackDate: form.ackDate || null,
    ackNo: form.ackNo || null,
    activities: [],
    balanceAmount: total.grand - Number(form.paidAmount || 0),
    billingAddress: form.billingAddress || null,
    comments: [],
    createdAt: new Date().toISOString(),
    customerGstin: form.customerGstin || null,
    customerId: form.customerId || null,
    customerName: form.customerName,
    customerStateCode: form.customerStateCode || null,
    customerStateName: form.customerStateName || null,
    discountTotal: total.discount,
    documentDate: form.documentDate,
    documentNo: form.documentNo || "Preview",
    dueDate: form.dueDate || null,
    ewayBillDate: form.ewayBillDate || null,
    ewayBillNo: form.ewayBillNo || null,
    ewayPart: form.ewayPart || null,
    generatedSalesAt: null,
    generatedSalesDocumentNo: null,
    generatedSalesEntryId: null,
    grandTotal: total.grand,
    id: "preview",
    irn: form.irn || null,
    isActive: form.isActive,
    kind,
    lines: form.lines,
    notes: form.notes || null,
    paidAmount: Number(form.paidAmount || 0),
    paymentStatus: form.paymentStatus,
    paymentTermId: form.paymentTermId || null,
    paymentTermName: form.paymentTermName || null,
    placeOfSupply: form.placeOfSupply,
    referenceNo: form.referenceNo || null,
    roundOff: Number(form.roundOff || 0),
    salesTypeId: form.salesTypeId || null,
    salesTypeName: form.salesTypeName || null,
    shippingAddress: form.shippingAddress || null,
    signedQr: form.signedQr || null,
    source: form.source,
    status: form.status,
    subtotal: total.subtotal,
    taxTotal: total.tax,
    taxableTotal: total.taxable,
    tenantId: "preview",
    terms: form.terms || null,
    transportAddress: form.transportAddress || null,
    transportContactNo: form.transportContactNo || null,
    transportContactPerson: form.transportContactPerson || null,
    transportGst: form.transportGst || null,
    transportId: form.transportId || null,
    transportName: form.transportName || null,
    updatedAt: new Date().toISOString(),
    uuid: "preview",
    vehicleNo: form.vehicleNo || null,
    workOrderNo: form.workOrderNo || null,
  };
}

function validateForm(form: EntryFormState) {
  const errors: string[] = [];
  if (!form.documentDate) errors.push("Date is required.");
  if (!form.customerName.trim()) errors.push("Customer is required.");
  if (!form.lines.some((line) => line.productName.trim())) errors.push("Add at least one item line.");
  return errors;
}

function applyContact(contact: EntryContactRecord, setForm: React.Dispatch<React.SetStateAction<EntryFormState>>) {
  setForm((current) => ({
    ...current,
    billingAddress: [contact.addressLine1, contact.addressLine2, contact.cityName, contact.stateName, contact.pincodeName].filter(Boolean).join(", "),
    customerGstin: contact.gstin || "",
    customerId: contact.id,
    customerName: contact.name,
    customerStateName: contact.stateName || "",
    shippingAddress: current.shippingAddress || [contact.addressLine1, contact.addressLine2, contact.cityName, contact.stateName, contact.pincodeName].filter(Boolean).join(", "),
  }));
}

function commonOption(record: CommonMasterRecord, labelKey: string, metaKey?: string): WorkspaceLookupOption {
  return {
    ...(metaKey && String(record[metaKey] ?? "").trim() ? { description: String(record[metaKey] ?? "") } : {}),
    label: String(record[labelKey] ?? record.name ?? record.code ?? record.id),
    value: record.id,
  };
}

function contactOption(record: EntryContactRecord): WorkspaceLookupOption {
  return {
    ...((record.gstin || record.phone) ? { description: record.gstin || record.phone || "" } : {}),
    label: record.name,
    meta: record.code,
    value: record.id,
  };
}

function productOption(record: EntryProductRecord): WorkspaceLookupOption {
  return {
    ...((record.hsnCode || record.unitName) ? { description: record.hsnCode || record.unitName || "" } : {}),
    label: record.name,
    meta: record.code,
    value: record.id,
  };
}

function productPayload(draft: ProductDraft) {
  return {
    code: draft.code,
    hsnCode: draft.hsnCode || null,
    hsnCodeId: draft.hsnCodeId || null,
    name: draft.name,
    price: Number(draft.price || 0),
    productTypeId: draft.productTypeId || null,
    productTypeName: draft.productTypeName || null,
    taxDescription: draft.taxDescription || null,
    taxId: draft.taxId || null,
    taxRate: Number(draft.taxRate || 0),
    unitId: draft.unitId || null,
    unitName: draft.unitName || null,
  };
}

function blankContactDraft(): ContactDraft {
  return {
    addressLine1: "",
    addressLine2: "",
    cityId: "",
    cityName: "",
    code: "",
    countryId: "",
    countryName: "",
    districtId: "",
    districtName: "",
    email: "",
    gstin: "",
    legalName: "",
    name: "",
    phone: "",
    pincodeId: "",
    pincodeName: "",
    stateId: "",
    stateName: "",
  };
}

function blankProductDraft(): ProductDraft {
  return {
    code: "",
    hsnCode: "",
    hsnCodeId: "",
    name: "",
    price: "0",
    productTypeId: "",
    productTypeName: "",
    taxDescription: "",
    taxId: "",
    taxRate: "0",
    unitId: "",
    unitName: "",
  };
}

function contactDraft(contact: EntryContactRecord): ContactDraft {
  return {
    addressLine1: contact.addressLine1 || "",
    addressLine2: contact.addressLine2 || "",
    cityId: contact.cityId || "",
    cityName: contact.cityName || "",
    code: contact.code,
    countryId: contact.countryId || "",
    countryName: contact.countryName || "",
    districtId: contact.districtId || "",
    districtName: contact.districtName || "",
    email: contact.email || "",
    gstin: contact.gstin || "",
    id: contact.id,
    legalName: contact.legalName || "",
    name: contact.name,
    phone: contact.phone || "",
    pincodeId: contact.pincodeId || "",
    pincodeName: contact.pincodeName || "",
    stateId: contact.stateId || "",
    stateName: contact.stateName || "",
  };
}

function productDraft(product: EntryProductRecord): ProductDraft {
  return {
    code: product.code,
    hsnCode: product.hsnCode || "",
    hsnCodeId: product.hsnCodeId || "",
    id: product.id,
    name: product.name,
    price: String(product.price),
    productTypeId: product.productTypeId || "",
    productTypeName: product.productTypeName || "",
    taxDescription: product.taxDescription || "",
    taxId: product.taxId || "",
    taxRate: String(product.taxRate),
    unitId: product.unitId || "",
    unitName: product.unitName || "",
  };
}

function emptyLine(): EntryLineRecord {
  return {
    colourId: null,
    colourName: null,
    dcNo: null,
    description: null,
    discountAmount: 0,
    hsnCode: null,
    hsnCodeId: null,
    id: crypto.randomUUID(),
    lineTotal: 0,
    productId: null,
    productName: "",
    poNo: null,
    quantity: 1,
    rate: 0,
    sizeId: null,
    sizeName: null,
    sortOrder: 1,
    taxAmount: 0,
    taxDescription: null,
    taxId: null,
    taxRate: 0,
    unitId: null,
    unitName: null,
    uuid: crypto.randomUUID().replaceAll("-", "").slice(0, 8),
  };
}

function lineTotal(line: EntryLineRecord) {
  const taxable = Math.max(0, Number(line.quantity || 0) * Number(line.rate || 0) - Number(line.discountAmount || 0));
  return taxable + taxable * Number(line.taxRate || 0) / 100;
}

function totals(lines: EntryLineRecord[], roundOffText: string) {
  const subtotal = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.rate || 0), 0);
  const discount = lines.reduce((sum, line) => sum + Number(line.discountAmount || 0), 0);
  const taxable = lines.reduce((sum, line) => sum + Math.max(0, Number(line.quantity || 0) * Number(line.rate || 0) - Number(line.discountAmount || 0)), 0);
  const tax = lines.reduce((sum, line) => sum + (Math.max(0, Number(line.quantity || 0) * Number(line.rate || 0) - Number(line.discountAmount || 0)) * Number(line.taxRate || 0)) / 100, 0);
  const roundOff = Number(roundOffText || 0);
  return {
    discount,
    grand: taxable + tax + roundOff,
    subtotal,
    tax,
    taxable,
  };
}

function buildEinvoicePayload(entry: EntryRecord) {
  return {
    BuyerDtls: {
      Addr1: firstAddressLine(entry.billingAddress),
      Gstin: entry.customerGstin || "URP",
      LglNm: entry.customerName,
    },
    DocDtls: {
      Dt: formatGstDate(entry.documentDate),
      No: entry.documentNo,
      Typ: "INV",
    },
    ItemList: entry.lines.map((line, index) => ({
      AssAmt: roundMoney(Math.max(0, line.quantity * line.rate - line.discountAmount)),
      Discount: line.discountAmount,
      GstRt: line.taxRate,
      HsnCd: line.hsnCode || "",
      PrdDesc: line.productName,
      Qty: line.quantity,
      SlNo: String(index + 1),
      TotItemVal: roundMoney(lineTotal(line)),
      Unit: line.unitName || "NOS",
      UnitPrice: line.rate,
    })),
    ValDtls: {
      AssVal: roundMoney(entry.taxableTotal),
      TotInvVal: roundMoney(entry.grandTotal),
    },
  };
}

function buildEwayPayload(entry: EntryRecord) {
  return {
    Distance: 100,
    Irn: entry.irn,
    TransDocDt: formatGstDate(entry.documentDate),
    TransDocNo: entry.documentNo,
    TransMode: "1",
    TransName: entry.transportName,
    VehNo: entry.vehicleNo,
    VehType: "R",
  };
}

function optionToSelect(option: { label: string; value: string }) {
  return option;
}

function slugCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "NEW";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Number(value || 0));
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function firstAddressLine(value: string | null) {
  return (value ?? "").split(",").find((part) => part.trim())?.trim() || "-";
}

function formatGstDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
