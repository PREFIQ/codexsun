import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Plus, RefreshCw, Save, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspaceFormActions, WorkspaceFormField, WorkspaceFormGrid, WorkspaceFormSurface, WorkspaceFormTabbedBody } from "@codexsun/ui/workspace/upsert";
import { WorkspaceAnimatedTabs, type WorkspaceAnimatedTab } from "@codexsun/ui/workspace/animated-tabs";
import { WorkspaceLookup, type WorkspaceLookupOption } from "@codexsun/ui/workspace/lookup";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceProtectedIndicator } from "@codexsun/ui/workspace/protected-indicator";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel, WorkspaceTableSkeletonRows } from "@codexsun/ui/workspace/table";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { cn } from "@codexsun/ui/lib/utils";
import { commonMasterDefinitions } from "../common/registry";
import { createLocationRecord } from "../location/location.services";
import { CompanyLogosTab } from "../organisation/company/company-logos.tab";
import { getTenantId } from "../../shared/api/tenant-context";
import { createCommonMaster } from "../common-master/common-master.services";
import { locationDefinitions } from "../location/location.definitions";
import type { LocationKind, LocationSavePayload } from "../location/location.types";
import { createMasterRecord, forceDeleteMasterRecord, listMasterLookup, setMasterRecordActive, updateMasterRecord, type MasterLookupRecord } from "./master.services";
import { useMasterRecords } from "./master.hooks";
import type { MasterChild, MasterDefinition, MasterRecord, MasterSavePayload } from "./master.types";

export type MasterTab = "details" | "tax" | "communication" | "addresses" | "finance" | "more" | "logos" | "stock" | "settings";
const masterTabs: Array<{ id: MasterTab; label: string }> = [
  { id: "details", label: "Details" },
  { id: "tax", label: "Tax Details" },
  { id: "communication", label: "Communication" },
  { id: "addresses", label: "Addresses" },
  { id: "finance", label: "Finance" },
  { id: "more", label: "More" },
  { id: "logos", label: "Logos" },
  { id: "stock", label: "Stock" },
  { id: "settings", label: "Settings" }
];
export const defaultTabsByMasterKind: Record<MasterDefinition["kind"], readonly MasterTab[]> = {
  company: ["details", "tax", "communication", "addresses", "finance", "more", "logos", "settings"],
  contact: ["details", "tax", "communication", "addresses", "finance", "more", "settings"],
  product: ["details", "stock", "settings"],
  "work-order": ["details", "settings"]
};
const commonMasterPathByKey = Object.fromEntries(commonMasterDefinitions.map((definition) => [definition.key, definition.path]));
const msmeCategoryOptions: WorkspaceLookupOption[] = ["Micro", "Small", "Medium"].map((label) => ({ label, value: label }));
const masterFilterOptions = [
  { id: "all", label: "All records" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" }
];
const emailTypeOptions = ["Primary", "Work", "Personal", "Billing", "Support", "Other"].map((value) => ({ label: value, value }));
const phoneTypeOptions = ["Mobile", "Office", "Home", "WhatsApp", "Billing", "Support", "Other"].map((value) => ({ label: value, value }));
const socialPlatformOptions = ["Website", "LinkedIn", "Facebook", "Instagram", "X", "YouTube", "WhatsApp", "Telegram", "Other"].map((value) => ({ label: value, value }));

export function MasterRecordShell({ createCode, definition, tabs }: { createCode?: (records: MasterRecord[]) => string; definition: MasterDefinition; tabs?: MasterTab[] }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<MasterRecord | null | undefined>(undefined);
  const query = useMasterRecords(definition, search);
  const save = useMutation({
    mutationFn: (payload: MasterSavePayload) => editing ? updateMasterRecord(definition, editing.id, payload) : createMasterRecord(definition, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["core", "master", definition.kind] });
      toast.success(`${definition.singular} saved`);
      setEditing(undefined);
    },
    onError: (error) => toast.error(`Unable to save ${definition.singular}`, {
      description: error instanceof Error ? error.message : "Please try again."
    })
  });
  const rowAction = useMutation({
    mutationFn: ({ record, type }: { record: MasterRecord; type: "delete" | "toggle" }) => type === "delete"
      ? forceDeleteMasterRecord(definition, record.id)
      : setMasterRecordActive(definition, record.id, !record.isActive),
    onSuccess: async (record, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["core", "master", definition.kind] });
      toast.success(variables.type === "delete" ? `${definition.singular} force deleted` : `${definition.singular} status updated`, { description: record.name });
    },
    onError: (error) => toast.error(`Unable to update ${definition.singular}`, { description: error instanceof Error ? error.message : "Please try again." })
  });
  const rows = query.data ?? [];
  const columnOptions = useMemo(() => masterColumnDefinitions(definition).map((column) => ({
    checked: visibleColumns[column.id] ?? true,
    id: column.id,
    label: column.label,
    onCheckedChange: (checked: boolean) => setVisibleColumns((current) => ({ ...current, [column.id]: checked }))
  })), [definition, visibleColumns]);
  const filteredRows = useMemo(() => rows.filter((record) => {
    if (statusFilter === "active") return record.isActive;
    if (statusFilter === "inactive") return !record.isActive;
    return true;
  }), [rows, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
    setVisibleColumns({});
    setEditing(undefined);
  }, [definition.kind]);

  if (editing !== undefined) {
    return (
      <MasterUpsert
        definition={definition}
        error={save.error instanceof Error ? save.error.message : ""}
        existingRecords={rows}
        loading={save.isPending}
        record={editing}
        {...(createCode ? { createCode } : {})}
        {...(tabs ? { tabs } : {})}
        onBack={() => setEditing(undefined)}
        onSubmit={(payload) => save.mutate(preparePayload(payload))}
      />
    );
  }

  return (
    <WorkspacePage
      title={definition.label}
      description={definition.description}
      actions={<div className="flex gap-2">
        <Button className="h-9 rounded-md" variant="outline" onClick={() => void query.refetch()}><RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} />Refresh</Button>
        <Button className="h-9 rounded-md" onClick={() => setEditing(null)}><Plus className="size-4" />New</Button>
      </div>}
    >
      <WorkspaceFilters
        columnOptions={columnOptions}
        filterOptions={masterFilterOptions}
        filterValue={statusFilter}
        searchPlaceholder={definition.search}
        searchValue={search}
        onFilterValueChange={(value) => { setStatusFilter(value); setPage(1); }}
        onSearchValueChange={(value) => { setSearch(value); setPage(1); }}
        onShowAllColumns={() => setVisibleColumns(Object.fromEntries(masterColumnDefinitions(definition).map((column) => [column.id, true])))}
      />
      <MasterList definition={definition} loading={query.isFetching && !query.data} records={pageRows} visibleColumns={visibleColumns} onEdit={(record) => { if (!isReservedMaster(record)) setEditing(record); }} onForceDelete={(record) => { if (window.confirm(`Force delete ${record.name}? This cannot be undone.`)) rowAction.mutate({ record, type: "delete" }); }} onToggle={(record) => rowAction.mutate({ record, type: "toggle" })} />
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filteredRows.length)}
        singularLabel={definition.singular}
        totalCount={filteredRows.length}
        totalPages={totalPages}
        onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))}
        onPageChange={setPage}
        onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
        onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(1); }}
      />
    </WorkspacePage>
  );
}

export function MasterList({ definition, loading, onEdit, onForceDelete, onToggle, records, visibleColumns }: { definition: MasterDefinition; loading: boolean; onEdit: (record: MasterRecord) => void; onForceDelete?: (record: MasterRecord) => void; onToggle?: (record: MasterRecord) => void; records: MasterRecord[]; visibleColumns?: Record<string, boolean> }) {
  const columns = masterColumnDefinitions(definition).filter((column) => visibleColumns?.[column.id] ?? true);
  const skeletonColumns = columns.length + 1;
  return (
    <WorkspaceTablePanel>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr>{columns.map((column) => <WorkspaceTableHeaderCell key={column.id}>{column.label}</WorkspaceTableHeaderCell>)}<WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell></tr></thead>
          <tbody>
            {!loading ? records.map((record) => (
              <tr key={record.id} className="border-b last:border-0">
                {columns.map((column) => <MasterListCell columnId={column.id} key={column.id} record={record} onEdit={onEdit} />)}
                <td className="px-4 py-3 text-right"><MasterRowActions record={record} onEdit={onEdit} {...(onForceDelete ? { onForceDelete } : {})} {...(onToggle ? { onToggle } : {})} /></td>
              </tr>
            )) : null}
          </tbody>
        </table>
      </div>
      {!loading && records.length ? (
        <div className="divide-y divide-border/70 md:hidden">
          {records.map((record) => <MasterMobileCard key={record.id} definition={definition} record={record} onEdit={() => onEdit(record)} {...(onForceDelete ? { onForceDelete: () => onForceDelete(record) } : {})} {...(onToggle ? { onToggle: () => onToggle(record) } : {})} />)}
        </div>
      ) : null}
      {loading ? <WorkspaceTableSkeletonRows columns={skeletonColumns} rows={4} /> : null}
      {!loading && !records.length ? <WorkspaceTableEmptyState>No {definition.label.toLowerCase()} found.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}

function masterColumnDefinitions(definition: MasterDefinition) {
  if (definition.kind === "product") {
    return [
      { id: "name", label: "Product" },
      { id: "code", label: "Code" },
      { id: "type", label: "Type" },
      { id: "hsn", label: "HSN" },
      { id: "unit", label: "Unit" },
      { id: "status", label: "Status" }
    ];
  }
  return [
    { id: "name", label: definition.kind === "company" ? "Company" : "Contact" },
    { id: "code", label: "Code" },
    { id: "type", label: "Type" },
    { id: "phone", label: "Phone" },
    { id: "email", label: "Email" },
    { id: "gstin", label: "GSTIN" },
    { id: "status", label: "Status" }
  ];
}

function MasterListCell({ columnId, onEdit, record }: { columnId: string; onEdit: (record: MasterRecord) => void; record: MasterRecord }) {
  if (columnId === "name") {
    return <td className="px-4 py-3"><MasterEditLink editable={!isReservedMaster(record)} value={record.name} onEdit={() => onEdit(record)} /></td>;
  }
  if (columnId === "code") {
    return <td className="px-4 py-3 uppercase text-muted-foreground"><MasterEditLink editable={!isReservedMaster(record)} value={record.code} onEdit={() => onEdit(record)} /></td>;
  }
  if (columnId === "type") return <td className="px-4 py-3">{record.typeName || "-"}</td>;
  if (columnId === "hsn") return <td className="px-4 py-3">{record.hsnCode || "-"}</td>;
  if (columnId === "unit") return <td className="px-4 py-3">{record.unitName || "-"}</td>;
  if (columnId === "phone") return <td className="px-4 py-3">{record.primaryPhone || "-"}</td>;
  if (columnId === "email") return <td className="px-4 py-3">{record.primaryEmail || "-"}</td>;
  if (columnId === "gstin") return <td className="px-4 py-3">{record.gstin || "-"}</td>;
  return <td className="px-4 py-3"><WorkspaceStatusBadge label={record.isActive ? "active" : "inactive"} tone={record.isActive ? "success" : "warning"} /></td>;
}

function MasterMobileCard({ definition, onEdit, onForceDelete, onToggle, record }: { definition: MasterDefinition; onEdit: () => void; onForceDelete?: () => void; onToggle?: () => void; record: MasterRecord }) {
  const secondaryLabel = "Type";
  const secondaryValue = record.typeName;
  const detailLabel = definition.kind === "product" ? "HSN" : "Phone";
  const detailValue = definition.kind === "product" ? record.hsnCode : record.primaryPhone;
  const extraLabel = definition.kind === "product" ? "Unit" : "Email";
  const extraValue = definition.kind === "product" ? record.unitName : record.primaryEmail;

  return (
    <article className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground"><MasterEditLink editable={!isReservedMaster(record)} value={record.name} onEdit={onEdit} /></h3>
          <p className="mt-1 text-xs font-medium uppercase text-muted-foreground"><MasterEditLink editable={!isReservedMaster(record)} value={record.code} onEdit={onEdit} /></p>
        </div>
        <MasterRowActions record={record} onEdit={() => onEdit()} {...(onForceDelete ? { onForceDelete: () => onForceDelete() } : {})} {...(onToggle ? { onToggle: () => onToggle() } : {})} />
      </div>
      <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
        <MobileMeta label={secondaryLabel} value={secondaryValue} />
        <MobileMeta label={detailLabel} value={detailValue} />
        <MobileMeta label={extraLabel} value={extraValue} />
        {definition.kind !== "product" ? <MobileMeta label="GSTIN" value={record.gstin} /> : null}
      </div>
      <div className="mt-3">
        <WorkspaceStatusBadge label={record.isActive ? "active" : "inactive"} tone={record.isActive ? "success" : "warning"} />
      </div>
    </article>
  );
}

function MasterEditLink({ editable, onEdit, value }: { editable: boolean; onEdit: () => void; value: unknown }) {
  if (!editable) return <span>{String(value || "-")}</span>;
  return (
    <button
      className="max-w-full cursor-pointer truncate text-left font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onEdit}
      type="button"
    >
      {String(value || "-")}
    </button>
  );
}

function MasterRowActions({ onEdit, onForceDelete, onToggle, record }: { onEdit: (record: MasterRecord) => void; onForceDelete?: (record: MasterRecord) => void; onToggle?: (record: MasterRecord) => void; record: MasterRecord }) {
  if (isReservedMaster(record)) return <WorkspaceProtectedIndicator />;
  return <WorkspaceRowActions
    {...(onForceDelete ? { actions: [{ id: "force-delete", icon: <Trash2 className="size-4" />, label: "Force delete", onSelect: () => onForceDelete(record), tone: "destructive" as const }] } : {})}
    deleteLabel="Suspend"
    isSuspended={!record.isActive}
    {...(onToggle ? { onDelete: () => onToggle(record), onRestore: () => onToggle(record) } : {})}
    onEdit={() => onEdit(record)}
    restoreLabel="Activate"
    title={record.name}
  />;
}

function isReservedMaster(record: MasterRecord) {
  return record.tenantId === "global" || record.name.trim() === "-";
}

function MobileMeta({ label, value }: { label: string; value: unknown }) {
  const displayValue = value === null || value === undefined || value === "" ? "-" : String(value);
  return <div className="flex min-w-0 justify-between gap-3"><span>{label}</span><span className="truncate text-right text-foreground">{displayValue}</span></div>;
}

function MasterUpsert({ createCode, definition, error, existingRecords, loading, onBack, onSubmit, record, tabs }: { createCode?: (records: MasterRecord[]) => string; definition: MasterDefinition; error: string; existingRecords: MasterRecord[]; loading: boolean; onBack: () => void; onSubmit: (payload: MasterSavePayload) => void; record: MasterRecord | null; tabs?: MasterTab[] }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<MasterTab>("details");
  const [form, setForm] = useState<MasterSavePayload>(() => record ? { ...record } : blank(definition, existingRecords, createCode));
  const lookups = useMasterLookups();
  const tenantId = getTenantId();
  const title = record ? `Edit ${definition.singular}` : `New ${definition.singular}`;
  const lookupCreators: LookupCreateHandlers = definition.kind === "contact" ? {
    contactGroups: (name) => createLookupRecord("contactGroups", name, queryClient),
    contactTypes: (name) => createLookupRecord("contactTypes", name, queryClient)
  } : definition.kind === "product" ? {
    hsnCodes: (name) => createLookupRecord("hsnCodes", name, queryClient),
    productCategories: (name) => createLookupRecord("productCategories", name, queryClient),
    productTypes: (name) => createLookupRecord("productTypes", name, queryClient),
    taxes: (name) => createLookupRecord("taxes", name, queryClient),
    units: (name) => createLookupRecord("units", name, queryClient)
  } : {};
  const visibleTabs = tabs ?? defaultTabsForMaster(definition);
  const tabItems: WorkspaceAnimatedTab[] = masterTabs.filter((item) => visibleTabs.includes(item.id)).map((item) => ({
    label: item.label,
    value: item.id,
    content: (
      <>
        {item.id === "details" ? <DetailsTab definition={definition} form={form} lookupCreators={lookupCreators} lookups={lookups} setForm={setForm} tenantId={tenantId} /> : null}
        {item.id === "tax" ? <TaxTab form={form} setForm={setForm} /> : null}
        {item.id === "communication" ? <CommunicationTab form={form} setForm={setForm} /> : null}
        {item.id === "addresses" ? <AddressesTab form={form} lookups={lookups} setForm={setForm} /> : null}
        {item.id === "finance" ? <FinanceTab definition={definition} form={form} lookups={lookups} setForm={setForm} /> : null}
        {item.id === "more" ? <MoreTab form={form} setForm={setForm} /> : null}
        {item.id === "logos" && definition.kind === "company" ? <CompanyLogosTab form={form} setForm={setForm} /> : null}
        {item.id === "stock" ? <StockTab form={form} setForm={setForm} /> : null}
        {item.id === "settings" ? <SettingsTab form={form} setForm={setForm} /> : null}
      </>
    )
  }));
  const codeLabel = String(form.code ?? "").trim();

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="min-w-0 truncate text-xl font-semibold tracking-normal capitalize sm:text-2xl">{title}</h1>
          {codeLabel ? <span className="inline-flex h-7 items-center rounded-md border border-border/90 bg-card px-2.5 text-xs font-semibold uppercase leading-none text-muted-foreground shadow-sm">{codeLabel}</span> : null}
        </div>
        <Button className="shrink-0 rounded-md" variant="outline" onClick={onBack}><ArrowLeft className="size-4" />Back</Button>
      </div>
      <WorkspaceFormSurface>
        <WorkspaceFormTabbedBody>
          <WorkspaceAnimatedTabs
            tabs={tabItems}
            value={tab}
            onValueChange={(value) => setTab(value as MasterTab)}
            contentClassName="px-0"
          />
          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        </WorkspaceFormTabbedBody>
        <WorkspaceFormActions>
          <Button disabled={loading || !String(form.name ?? "").trim()} onClick={() => onSubmit(form)}><Save className="size-4" />Save</Button>
          <Button variant="outline" onClick={onBack}><X className="size-4" />Cancel</Button>
        </WorkspaceFormActions>
      </WorkspaceFormSurface>
    </section>
  );
}

function DetailsTab({ definition, form, lookupCreators, lookups, setForm, tenantId }: TabProps & { definition: MasterDefinition; lookupCreators: LookupCreateHandlers; lookups: LookupState; tenantId: string | null }) {
  return (
    <WorkspaceFormGrid columns={2}>
      <Field label="Name" required><Input value={String(form.name ?? "")} onBlur={() => autofillLegalName(setForm)} onChange={(event) => patch(setForm, { name: event.target.value })} /></Field>
      {definition.kind !== "product" ? <Field action={definition.kind === "contact" ? <Button aria-label="Capitalise legal name from name" className="size-7 rounded-md p-0" onClick={() => refreshLegalName(setForm)} title="Capitalise legal name from name" type="button" variant="outline"><Sparkles className="size-3.5" /></Button> : undefined} label="Legal name"><Input className="uppercase" value={String(form.legalName ?? "")} onChange={(event) => patch(setForm, { legalName: event.target.value.toUpperCase() })} /></Field> : null}
      {definition.kind === "company" ? <Field label="Tenant ID"><Input disabled value={tenantId ?? ""} /></Field> : null}
      {definition.kind === "company" ? <LookupField label="Industry" options={lookups.industries} value={form.industryId ?? form.industryName} onPick={(id, label) => patch(setForm, { industryId: id, industryName: label })} /> : null}
      <LookupField createLabel={definition.kind === "product" ? "Create product type" : "Create contact type"} label={definition.kind === "product" ? "Product Type" : "Contact Type"} options={definition.kind === "product" ? lookups.productTypes : lookups.contactTypes} value={form.typeId ?? form.typeName} onCreate={definition.kind === "product" ? lookupCreators.productTypes : lookupCreators.contactTypes} onPick={(id, label) => patch(setForm, { typeId: id, typeName: label })} />
      {definition.kind !== "product" ? <LookupField createLabel="Create contact group" label="Contact Group" options={lookups.contactGroups} value={form.groupId ?? form.groupName} onCreate={lookupCreators.contactGroups} onPick={(id, label) => patch(setForm, { groupId: id, groupName: label })} /> : null}
      {definition.kind === "product" ? <>
        <LookupField createLabel="Create product category" label="Product Category" options={lookups.productCategories} value={form.productCategoryId ?? form.productCategoryName} onCreate={lookupCreators.productCategories} onPick={(id, label) => patch(setForm, { productCategoryId: id, productCategoryName: label })} />
        <LookupField createLabel="Create unit" label="Unit" options={lookups.units} value={form.unitId ?? form.unitName} onCreate={lookupCreators.units} onPick={(id, label) => patch(setForm, { unitId: id, unitName: label })} />
        <LookupField createLabel="Create HSN code" label="HSN Code" options={lookups.hsnCodes} value={form.hsnCodeId ?? form.hsnCode} onCreate={lookupCreators.hsnCodes} onPick={(id, label) => patch(setForm, { hsnCodeId: id, hsnCode: label })} />
        <LookupField createLabel="Create GST tax rate" label="GST Tax Rate" options={lookups.taxes} value={form.taxId ?? form.taxName} onCreate={lookupCreators.taxes} onPick={(id, label) => patch(setForm, { taxId: id, taxName: label })} />
      </> : null}
      <SwitchRow label="Active" checked={form.isActive !== false} onChange={(isActive) => patch(setForm, { isActive, status: isActive ? "active" : "not_active" })} />
    </WorkspaceFormGrid>
  );
}

function TaxTab({ form, setForm }: TabProps) {
  return <WorkspaceFormGrid columns={2}>
    <Field label="GSTIN"><Input value={String(form.gstin ?? "")} onChange={(event) => patch(setForm, { gstin: event.target.value })} /></Field>
    <Field label="PAN"><Input value={String(form.pan ?? "")} onChange={(event) => patch(setForm, { pan: event.target.value })} /></Field>
    <Field label="MSME No"><Input value={String(form.msmeNo ?? "")} onChange={(event) => patch(setForm, { msmeNo: event.target.value })} /></Field>
    <LookupField label="MSME Category" options={msmeCategoryOptions} value={form.msmeCategory} onPick={(_, label) => patch(setForm, { msmeCategory: label })} />
    <Field label="TAN No"><Input value={String(form.tanNo ?? "")} onChange={(event) => patch(setForm, { tanNo: event.target.value })} /></Field>
    <SwitchRow label="TDS Available" checked={form.tdsAvailable === true} onChange={(tdsAvailable) => patch(setForm, { tdsAvailable })} />
    <div className="hidden md:block" />
    <SwitchRow label="TCS Available" checked={form.tcsAvailable === true} onChange={(tcsAvailable) => patch(setForm, { tcsAvailable })} />
  </WorkspaceFormGrid>;
}

function CommunicationTab({ form, setForm }: TabProps) {
  return <div className="space-y-5"><ChildPanel title="Contact Emails" onAdd={() => patch(setForm, { emails: [...children(form.emails), { ...emptyChild(), email: "", emailType: "Primary", isPrimary: false }] })}>{children(form.emails).map((item, index) => <ContactMethodRow key={item.id} item={item} index={index} field="emails" valueLabel="Email" valueName="email" typeLabel="Email type" typeName="emailType" typeOptions={emailTypeOptions} setForm={setForm} />)}</ChildPanel><ChildPanel title="Contact Phones" onAdd={() => patch(setForm, { phones: [...children(form.phones), { ...emptyChild(), phone: "", phoneType: "Mobile", isPrimary: false }] })}>{children(form.phones).map((item, index) => <ContactMethodRow key={item.id} item={item} index={index} field="phones" valueLabel="Phone" valueName="phone" typeLabel="Phone type" typeName="phoneType" typeOptions={phoneTypeOptions} setForm={setForm} />)}</ChildPanel></div>;
}

export function defaultTabsForMaster(definition: MasterDefinition): readonly MasterTab[] {
  return defaultTabsByMasterKind[definition.kind];
}

function AddressesTab({ form, lookups, setForm }: TabProps & { lookups: LookupState }) {
  return <ChildPanel title="Addresses" onAdd={() => patch(setForm, { addresses: [...children(form.addresses), emptyAddress(false)] })}>{children(form.addresses).map((item, index) => <AddressRow key={item.id} index={index} item={item} lookups={lookups} setForm={setForm} />)}</ChildPanel>;
}

function AddressRow({ index, item, lookups, setForm }: { index: number; item: MasterChild; lookups: LookupState; setForm: TabProps["setForm"] }) {
  const queryClient = useQueryClient();
  return (
    <div className="space-y-4 rounded-md border border-border/80 bg-card/60 p-4 shadow-sm">
      <div className="flex justify-end">
        <DeleteButton onClick={() => removeChild(setForm, "addresses", index)} />
      </div>
      <WorkspaceFormGrid columns={2}>
        <LookupField label="Address Type" options={lookups.addressTypes} value={item.addressTypeId ?? item.addressTypeName} onPick={(id, label) => updateChild(setForm, "addresses", index, { addressTypeId: id, addressTypeName: label })} />
        <SwitchRow label="Default address" checked={item.isDefault === true} compact onChange={(isDefault) => updateChild(setForm, "addresses", index, { isDefault })} />
      </WorkspaceFormGrid>
      <WorkspaceFormGrid columns={1}>
        <Field label="Address line 1"><Input value={String(item.addressLine1 ?? "")} onChange={(event) => updateChild(setForm, "addresses", index, { addressLine1: event.target.value })} /></Field>
        <Field label="Address line 2"><Input value={String(item.addressLine2 ?? "")} onChange={(event) => updateChild(setForm, "addresses", index, { addressLine2: event.target.value })} /></Field>
      </WorkspaceFormGrid>
      <WorkspaceFormGrid columns={2}>
        <LookupField createLabel="Create country" label="Country" options={lookups.countries} value={item.countryId ?? item.countryName} onCreate={(name) => createAddressLocation("country", name, item, queryClient)} onPick={(id, label, option) => updateChild(setForm, "addresses", index, addressPatchForLocation("country", id, label, option, lookups))} />
        <LookupField createLabel="Create state" label="State" options={filterLocationOptions(lookups.states, "countryId", item.countryId)} value={item.stateId ?? item.stateName} onCreate={(name) => createAddressLocation("state", name, item, queryClient)} onPick={(id, label, option) => updateChild(setForm, "addresses", index, addressPatchForLocation("state", id, label, option, lookups))} />
        <LookupField createLabel="Create district" label="District" options={filterLocationOptions(lookups.districts, "stateId", item.stateId)} value={item.districtId ?? item.districtName} onCreate={(name) => createAddressLocation("district", name, item, queryClient)} onPick={(id, label, option) => updateChild(setForm, "addresses", index, addressPatchForLocation("district", id, label, option, lookups))} />
        <LookupField createLabel="Create city" label="City" options={filterLocationOptions(lookups.cities, "districtId", item.districtId)} value={item.cityId ?? item.cityName} onCreate={(name) => createAddressLocation("city", name, item, queryClient)} onPick={(id, label, option) => updateChild(setForm, "addresses", index, addressPatchForLocation("city", id, label, option, lookups))} />
        <LookupField createLabel="Create pincode" label="Pincode" options={filterLocationOptions(lookups.pincodes, "cityId", item.cityId)} value={item.pincodeId ?? item.pincodeName} onCreate={(name) => createAddressLocation("pincode", name, item, queryClient)} onPick={(id, label, option) => updateChild(setForm, "addresses", index, addressPatchForLocation("pincode", id, label, option, lookups))} />
      </WorkspaceFormGrid>
    </div>
  );
}

function FinanceTab({ definition, form, lookups, setForm }: TabProps & { definition: MasterDefinition; lookups: LookupState }) {
  return <div className="space-y-5">
    {definition.kind !== "product" ? (
      <WorkspaceFormGrid columns={2}>
        <Field label="Opening balance"><Input type="number" value={String(form.openingBalance ?? "")} onChange={(event) => patch(setForm, { openingBalance: Number(event.target.value) })} /></Field>
        <Field label="Credit limit"><Input type="number" value={String(form.creditLimit ?? "")} onChange={(event) => patch(setForm, { creditLimit: Number(event.target.value) })} /></Field>
      </WorkspaceFormGrid>
    ) : null}
    <ChildPanel title="Bank Accounts" onAdd={() => patch(setForm, { bankAccounts: [...children(form.bankAccounts), { ...emptyChild(), isPrimary: false }] })}>{children(form.bankAccounts).map((item, index) => <div className="grid gap-4 rounded-md border p-4 md:grid-cols-[1fr_1fr]" key={item.id}><LookupField label="Bank name" options={lookups.bankNames} value={item.bankNameId ?? item.bankName} onPick={(id, label) => updateChild(setForm, "bankAccounts", index, { bankNameId: id, bankName: label })} />{["Account type", "Account number", "Holder name", "IFSC", "Branch"].map((label) => <Field key={label} label={label}><Input value={String(item[keyFor(label)] ?? "")} onChange={(event) => updateChild(setForm, "bankAccounts", index, { [keyFor(label)]: event.target.value })} /></Field>)}<SwitchRow label="Primary bank" checked={item.isPrimary === true} onChange={(isPrimary) => updateChild(setForm, "bankAccounts", index, { isPrimary })} /><DeleteButton onClick={() => removeChild(setForm, "bankAccounts", index)} /></div>)}</ChildPanel>
  </div>;
}

function MoreTab({ form, setForm }: TabProps) {
  return <div className="space-y-5"><WorkspaceFormGrid columns={1}><Field label="Website"><Input value={String(form.website ?? "")} onChange={(event) => patch(setForm, { website: event.target.value })} /></Field><Field label="Description"><textarea className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm shadow-sm" value={String(form.description ?? "")} onChange={(event) => patch(setForm, { description: event.target.value })} /></Field></WorkspaceFormGrid><ChildPanel title="Social Links" onAdd={() => patch(setForm, { socialLinks: [...children(form.socialLinks), { ...emptyChild(), platform: "Website", url: "", isActive: true }] })}>{children(form.socialLinks).map((item, index) => <div className="grid gap-4 rounded-md border p-4 md:grid-cols-[1fr_1fr_1fr_auto]" key={item.id}><Field label="Platform"><WorkspaceSelect options={socialPlatformOptions} value={String(item.platform ?? "Website")} onValueChange={(platform) => updateChild(setForm, "socialLinks", index, { platform })} /></Field><Field label="URL"><Input value={String(item.url ?? "")} onChange={(event) => updateChild(setForm, "socialLinks", index, { url: event.target.value })} /></Field><SwitchRow label="Active" checked={item.isActive !== false} onChange={(isActive) => updateChild(setForm, "socialLinks", index, { isActive })} /><DeleteButton onClick={() => removeChild(setForm, "socialLinks", index)} /></div>)}</ChildPanel></div>;
}

function SettingsTab({ form, setForm }: TabProps) {
  return <WorkspaceFormGrid columns={2}>
    <Field label="Code"><Input value={String(form.code ?? "")} onChange={(event) => patch(setForm, { code: event.target.value.toUpperCase() })} /></Field>
  </WorkspaceFormGrid>;
}

function StockTab({ form, setForm }: TabProps) {
  return <WorkspaceFormGrid columns={2}>
    <Field label="Opening Stock"><Input min="0" type="number" value={String(form.openingStock ?? 0)} onChange={(event) => patch(setForm, { openingStock: Number(event.target.value) })} /></Field>
    <Field label="Opening Rate"><Input min="0" type="number" value={String(form.openingRate ?? 0)} onChange={(event) => patch(setForm, { openingRate: Number(event.target.value) })} /></Field>
  </WorkspaceFormGrid>;
}

function ContactMethodRow({ field, index, item, setForm, typeLabel, typeName, typeOptions, valueLabel, valueName }: { field: "emails" | "phones"; index: number; item: MasterChild; setForm: TabProps["setForm"]; typeLabel: string; typeName: string; typeOptions: Array<{ label: string; value: string }>; valueLabel: string; valueName: string }) {
  const selectedType = String(item[typeName] ?? typeOptions[0]?.value ?? "");
  return <div className="grid min-h-[84px] gap-4 border-b border-border/70 py-4 last:border-b-0 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"><Field label={valueLabel}><Input value={String(item[valueName] ?? "")} onChange={(event) => updateChild(setForm, field, index, { [valueName]: event.target.value })} /></Field><Field label={typeLabel}><WorkspaceSelect options={typeOptions} value={selectedType} onValueChange={(value) => updateChild(setForm, field, index, { [typeName]: value })} /></Field><SwitchRow label="Primary" checked={item.isPrimary === true} compact onChange={(isPrimary) => updateChild(setForm, field, index, { isPrimary })} /><DeleteButton onClick={() => removeChild(setForm, field, index)} /></div>;
}

type TabProps = { form: MasterSavePayload; setForm: React.Dispatch<React.SetStateAction<MasterSavePayload>> };
type MasterLookupOption = WorkspaceLookupOption & { record?: MasterLookupRecord };
type LookupState = Record<LookupKey, MasterLookupOption[]>;
type LookupKey = "addressTypes" | "bankNames" | "cities" | "contactGroups" | "contactTypes" | "countries" | "districts" | "hsnCodes" | "industries" | "pincodes" | "productCategories" | "productTypes" | "states" | "taxes" | "units";
type LookupCreateHandlers = Partial<Record<LookupKey, (name: string) => Promise<WorkspaceLookupOption | undefined>>>;

function useMasterLookups(): LookupState {
  const paths: Record<LookupKey, string> = {
    addressTypes: lookupPath(commonMasterPathByKey, "addressTypes"),
    bankNames: lookupPath(commonMasterPathByKey, "bankNames"),
    cities: locationDefinitions.city.path,
    contactGroups: lookupPath(commonMasterPathByKey, "contactGroups"),
    contactTypes: lookupPath(commonMasterPathByKey, "contactTypes"),
    countries: locationDefinitions.country.path,
    districts: locationDefinitions.district.path,
    hsnCodes: lookupPath(commonMasterPathByKey, "hsnCodes"),
    industries: "/core/organisation/industries",
    pincodes: locationDefinitions.pincode.path,
    productCategories: lookupPath(commonMasterPathByKey, "productCategories"),
    productTypes: lookupPath(commonMasterPathByKey, "productTypes"),
    states: locationDefinitions.state.path,
    taxes: lookupPath(commonMasterPathByKey, "taxes"),
    units: lookupPath(commonMasterPathByKey, "units")
  };
  const entries = Object.entries(paths) as Array<[LookupKey, string]>;
  const queries = useQueries({
    queries: entries.map(([key, path]) => ({
      enabled: Boolean(path),
      queryFn: () => listMasterLookup(path),
      queryKey: ["core", "master", "lookup", key]
    }))
  });
  return Object.fromEntries(entries.map(([key], index) => [key, (queries[index]?.data ?? []).map((record) => toLookupOption(key, record))])) as LookupState;
}

function lookupPath(paths: Record<string, string | undefined>, key: string) {
  return paths[key] ?? "";
}

function LookupField({ createLabel, label, onCreate, onPick, options, value }: { createLabel?: string | undefined; label: string; onCreate?: ((name: string) => Promise<WorkspaceLookupOption | undefined>) | undefined; onPick: (id: string, label: string, option?: MasterLookupOption | null) => void; options: MasterLookupOption[]; value: unknown }) {
  const createProps = onCreate ? {
    createLabel,
    createMode: "inline" as const,
    emptyLabel: `No ${label.toLowerCase()} found. Type a name to create it.`,
    onCreate
  } : { createMode: "none" as const };
  return (
    <Field label={label}>
      <WorkspaceLookup
        {...createProps}
        allowTextValue={!onCreate}
        options={options}
        value={String(value ?? "")}
        onValueChange={(selected, option) => onPick(selected, option?.label ?? selected, option as MasterLookupOption | null | undefined)}
      />
    </Field>
  );
}

function toLookupOption(key: LookupKey, record: MasterLookupRecord): MasterLookupOption {
  const pincodeLabel = record.pincode && record.areaName && record.areaName !== record.pincode
    ? `${record.pincode} - ${record.areaName}`
    : record.pincode ?? record.areaName;
  const label = String(key === "pincodes"
    ? pincodeLabel || record.name || record.code || record.id
    : key === "taxes" && record.ratePercent !== null && record.ratePercent !== undefined
      ? `${record.ratePercent}%`
      : record.name ?? record.code ?? record.description ?? record.pincode ?? record.id);
  const description = key === "pincodes" ? [record.cityName, record.districtName, record.stateName].filter(Boolean).join(", ") : "";
  return {
    ...(description ? { description } : {}),
    label,
    record,
    value: record.id
  };
}

function filterLocationOptions(options: MasterLookupOption[], parentKey: "cityId" | "countryId" | "districtId" | "stateId", parentId: unknown) {
  const id = String(parentId ?? "").trim();
  if (!id) return options;
  return options.filter((option) => option.record?.[parentKey] === id);
}

function addressPatchForLocation(kind: "city" | "country" | "district" | "pincode" | "state", id: string, label: string, option: MasterLookupOption | null | undefined, lookups: LookupState) {
  const record = option?.record;
  const patchValue: Record<string, boolean | number | string | null> = {};
  if (kind === "country") {
    patchValue.countryId = id;
    patchValue.countryName = label;
    patchValue.stateId = null;
    patchValue.stateName = null;
    patchValue.districtId = null;
    patchValue.districtName = null;
    patchValue.cityId = null;
    patchValue.cityName = null;
    patchValue.pincodeId = null;
    patchValue.pincodeName = null;
    return patchValue;
  }

  if (kind === "state") {
    patchValue.stateId = id;
    patchValue.stateName = label;
    patchValue.districtId = null;
    patchValue.districtName = null;
    patchValue.cityId = null;
    patchValue.cityName = null;
    patchValue.pincodeId = null;
    patchValue.pincodeName = null;
  } else if (kind === "district") {
    patchValue.districtId = id;
    patchValue.districtName = label;
    patchValue.cityId = null;
    patchValue.cityName = null;
    patchValue.pincodeId = null;
    patchValue.pincodeName = null;
  } else if (kind === "city") {
    patchValue.cityId = id;
    patchValue.cityName = label;
    patchValue.pincodeId = null;
    patchValue.pincodeName = null;
  } else {
    patchValue.pincodeId = id;
    patchValue.pincodeName = label;
    patchValue.cityId = record?.cityId ?? null;
    patchValue.cityName = record?.cityName ?? null;
    patchValue.districtId = record?.districtId ?? null;
    patchValue.districtName = record?.districtName ?? null;
    patchValue.stateId = record?.stateId ?? null;
    patchValue.stateName = record?.stateName ?? null;
    patchValue.countryId = record?.countryId ?? null;
    patchValue.countryName = record?.countryName ?? null;
    return patchValue;
  }

  const cascade = cascadePatch(record, lookups);
  return { ...patchValue, ...cascade };
}

function cascadePatch(record: MasterLookupRecord | undefined, lookups: LookupState) {
  const patchValue: Record<string, string | null> = {};
  if (record?.countryId) {
    patchValue.countryId = record.countryId;
    patchValue.countryName = record.countryName ?? findLookupLabel(lookups.countries, record.countryId);
  }
  if (record?.stateId) {
    patchValue.stateId = record.stateId;
    patchValue.stateName = record.stateName ?? findLookupLabel(lookups.states, record.stateId);
  }
  if (record?.districtId) {
    patchValue.districtId = record.districtId;
    patchValue.districtName = record.districtName ?? findLookupLabel(lookups.districts, record.districtId);
  }
  return patchValue;
}

function findLookupLabel(options: MasterLookupOption[], id: string) {
  return options.find((option) => option.value === id)?.label ?? null;
}

async function createLookupRecord(key: LookupKey, name: string, queryClient: ReturnType<typeof useQueryClient>) {
  const path = lookupPath(commonMasterPathByKey, key);
  if (!path) return undefined;
  const record = await createCommonMaster(path, quickCreatePayload(key, name));
  const label = String(record.name ?? record.code ?? record.description ?? record.ratePercent ?? name);
  await queryClient.invalidateQueries({ queryKey: ["core", "master", "lookup", key] });
  toast.success("Lookup created", { description: label });
  return { label, value: record.id };
}

function quickCreatePayload(key: LookupKey, value: string) {
  const name = value.trim();
  if (key === "hsnCodes") return { code: name.toUpperCase(), description: name, isActive: true };
  if (key === "taxes") {
    const ratePercent = Number(name.replace(/%$/, "").trim());
    if (!Number.isFinite(ratePercent)) throw new Error("Enter a numeric tax percentage.");
    return { description: `${ratePercent}%`, isActive: true, ratePercent };
  }
  return { isActive: true, name };
}

async function createAddressLocation(kind: LocationKind, name: string, item: MasterChild, queryClient: ReturnType<typeof useQueryClient>) {
  if (kind === "state" && !item.countryId) {
    toast.error("Select a country before creating a state.");
    return undefined;
  }
  if (kind === "district" && !item.stateId) {
    toast.error("Select a state before creating a district.");
    return undefined;
  }
  if (kind === "city" && !item.districtId) {
    toast.error("Select a district before creating a city.");
    return undefined;
  }
  if (kind === "pincode" && !item.cityId) {
    toast.error("Select a city before creating a pincode.");
    return undefined;
  }

  try {
    const payload = locationCreatePayload(kind, name, item);
    const created = await createLocationRecord(locationDefinitions[kind].path, payload);
    await queryClient.invalidateQueries({ queryKey: ["core", "master", "lookup", lookupKeyForLocation(kind)] });
    const option = toLookupOption(lookupKeyForLocation(kind), created);
    toast.success(`${locationDefinitions[kind].label} created`, { description: option.label });
    return option;
  } catch (error) {
    toast.error(`Unable to create ${locationDefinitions[kind].label.toLowerCase()}`, {
      description: error instanceof Error ? error.message : "Please try again."
    });
    return undefined;
  }
}

function locationCreatePayload(kind: LocationKind, name: string, item: MasterChild) {
  const code = codeFromName(name);
  const payload: LocationSavePayload = {
    capital: "-",
    code,
    currencyCode: "-",
    dialCode: "-",
    gstStateCode: "-",
    iso2: "-",
    iso3: "-",
    name,
    numericCode: "-",
    shortCode: "-",
    sortOrder: 1000,
    status: "active"
  };
  if (kind === "state" || kind === "district" || kind === "city" || kind === "pincode") {
    payload.countryId = stringOrNull(item.countryId);
    payload.countryName = stringOrNull(item.countryName);
  }
  if (kind === "district" || kind === "city" || kind === "pincode") {
    payload.stateId = stringOrNull(item.stateId);
    payload.stateName = stringOrNull(item.stateName);
  }
  if (kind === "city" || kind === "pincode") {
    payload.districtId = stringOrNull(item.districtId);
    payload.districtName = stringOrNull(item.districtName);
  }
  if (kind === "pincode") {
    payload.cityId = stringOrNull(item.cityId);
    payload.cityName = stringOrNull(item.cityName);
    payload.pincode = name.trim();
    payload.areaName = name.trim();
  }
  return payload;
}

function lookupKeyForLocation(kind: LocationKind): LookupKey {
  if (kind === "country") return "countries";
  if (kind === "state") return "states";
  if (kind === "district") return "districts";
  if (kind === "city") return "cities";
  return "pincodes";
}

function codeFromName(name: string) {
  const code = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return code || `LOCATION-${Date.now()}`;
}

function stringOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function Field({ action, children, label, required }: { action?: React.ReactNode; children: React.ReactNode; label: string; required?: boolean }) {
  return <WorkspaceFormField label={<span className="flex items-center justify-between gap-2">{label}{action}</span>} {...(required ? { required: true } : {})}>{children}</WorkspaceFormField>;
}

function SwitchRow({ checked, compact = false, label, onChange }: { checked: boolean; compact?: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <div className={cn("flex flex-col justify-end gap-1.5", compact ? "min-h-11" : "min-h-[66px]")}>
    {!compact ? <span className="invisible text-sm font-medium leading-none">Field</span> : null}
    <div className={cn("flex h-11 items-center justify-between rounded-md border px-3 transition-colors", checked ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-border bg-muted/35 text-muted-foreground")}>
      <span className="inline-flex items-center gap-2 text-sm font-semibold">
        {checked ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : null}
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  </div>;
}

function ChildPanel({ children: content, onAdd, title }: { children: React.ReactNode; onAdd: () => void; title: string }) {
  return <section className="border-b border-border/80 pb-5 last:border-b-0 last:pb-0"><div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-base font-semibold">{title}</h2><Button className="w-full rounded-md sm:w-auto" variant="outline" onClick={onAdd}><Plus className="size-4" />Add</Button></div><div>{content}</div></section>;
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return <Button className="size-10 rounded-md p-0" type="button" variant="outline" onClick={onClick}><Trash2 className="size-4" /></Button>;
}

function blank(definition: MasterDefinition, existingRecords: MasterRecord[] = [], createCode?: (records: MasterRecord[]) => string): MasterSavePayload {
  const isContact = definition.kind === "contact";
  return {
    addresses: isContact ? [emptyAddress(true)] : [],
    bankAccounts: [],
    code: createCode ? createCode(existingRecords) : isContact ? nextContactCode(existingRecords) : "",
    emails: isContact ? [{ ...emptyChild(), email: "", emailType: "Primary", isPrimary: true }] : [],
    isActive: true,
    name: "",
    phones: isContact ? [{ ...emptyChild(), phone: "", phoneType: "Mobile", isPrimary: true }] : [],
    socialLinks: isContact ? [{ ...emptyChild(), platform: "Website", url: "", isActive: true }] : [],
    status: "active"
  };
}

function emptyAddress(isDefault = false) {
  return { ...emptyChild(), isDefault };
}

function autofillLegalName(setForm: TabProps["setForm"]) {
  setForm((current) => {
    const name = String(current.name ?? "").trim();
    const legalName = String(current.legalName ?? "").trim();
    if (!name || legalName) return current;
    return { ...current, legalName: name.toUpperCase() };
  });
}

function refreshLegalName(setForm: TabProps["setForm"]) {
  setForm((current) => {
    const name = String(current.name ?? "").trim();
    return name ? { ...current, legalName: name.toUpperCase() } : current;
  });
}

function nextContactCode(records: MasterRecord[]) {
  const next = records.reduce((highest, record) => {
    const match = /^C-(\d+)$/i.exec(String(record.code ?? "").trim());
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0) + 1;
  return `C-${String(next).padStart(4, "0")}`;
}

function emptyChild() {
  return { id: crypto.randomUUID().slice(0, 8) };
}

function patch(setForm: TabProps["setForm"], value: MasterSavePayload) {
  setForm((current) => ({ ...current, ...value }));
}

function preparePayload(payload: MasterSavePayload): MasterSavePayload {
  const emails = children(payload.emails);
  const phones = children(payload.phones);
  const primaryEmail = emails.find((item) => item.isPrimary === true)?.email ?? emails[0]?.email ?? payload.primaryEmail;
  const primaryPhone = phones.find((item) => item.isPrimary === true)?.phone ?? phones[0]?.phone ?? payload.primaryPhone;
  return {
    ...payload,
    primaryEmail: typeof primaryEmail === "string" ? primaryEmail : null,
    primaryPhone: typeof primaryPhone === "string" ? primaryPhone : null
  };
}

function children(value: unknown): MasterChild[] {
  return Array.isArray(value) ? value as MasterChild[] : [];
}

function updateChild(setForm: TabProps["setForm"], key: "emails" | "phones" | "addresses" | "bankAccounts" | "socialLinks", index: number, value: Record<string, boolean | number | string | null>) {
  setForm((current) => ({ ...current, [key]: children(current[key]).map((item, itemIndex) => itemIndex === index ? { ...item, ...value } : item) }));
}

function removeChild(setForm: TabProps["setForm"], key: "emails" | "phones" | "addresses" | "bankAccounts" | "socialLinks", index: number) {
  setForm((current) => ({ ...current, [key]: children(current[key]).filter((_, itemIndex) => itemIndex !== index) }));
}

function keyFor(label: string) {
  return label.toLowerCase().replace(/\s+([a-z])/g, (_, char: string) => char.toUpperCase()).replace(/\s/g, "");
}
