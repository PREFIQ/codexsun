import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@codexsun/ui/components/alert-dialog";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspaceLookup, type WorkspaceLookupOption } from "@codexsun/ui/workspace/lookup";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceProtectedIndicator } from "@codexsun/ui/workspace/protected-indicator";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel,
  WorkspaceTableSkeletonRows
} from "@codexsun/ui/workspace/table";
import {
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormFooter,
  WorkspaceFormGrid,
  WorkspaceUpsertDialog
} from "@codexsun/ui/workspace/upsert";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { cn } from "@codexsun/ui/lib/utils";
import { cityDefinitions } from "./city.types";
import {
  createCityRecord,
  forceDeleteCityRecord,
  listCityRecords,
  suspendCityRecord,
  updateCityRecord
} from "./city.services";
import type { CityDefinition, CityKind, CityRecord, CitySavePayload } from "./city.types";

export function CityModuleShell({ kind }: { kind: CityKind }) {
  const definition = cityDefinitions[kind];
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [editing, setEditing] = useState<CityRecord | null | undefined>(undefined);
  const [viewing, setViewing] = useState<CityRecord | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    record: CityRecord;
    type: "delete" | "suspend";
  } | null>(null);
  const recordsQuery = useQuery({
    queryKey: ["core", "location", kind],
    queryFn: () => listCityRecords(definition.path)
  });
  const parentQueries = useCityParents(kind);
  const mutation = useMutation({
    mutationFn: (payload: CitySavePayload) =>
      editing
        ? updateCityRecord(definition.path, editing.id, payload)
        : createCityRecord(definition.path, payload),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: ["core", "location"] });
      toast.success(`${definition.label} ${editing ? "updated" : "created"}`, {
        description: `${record.name} is ready in the list.`
      });
      setEditing(undefined);
    },
    onError: (error) =>
      toast.error(`Unable to save ${definition.label.toLowerCase()}`, {
        description: error instanceof Error ? error.message : "Please try again."
      })
  });
  const rowActionMutation = useMutation({
    mutationFn: async ({ record, type }: { record: CityRecord; type: "delete" | "suspend" }) =>
      type === "delete"
        ? forceDeleteCityRecord(definition.path, record.id)
        : suspendCityRecord(definition.path, record.id),
    onSuccess: async (record, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["core", "location", kind] });
      toast.success(
        variables.type === "delete"
          ? `${definition.label} force deleted`
          : `${definition.label} suspended`,
        {
          description: `${record.name} ${variables.type === "delete" ? "was permanently removed." : "is now inactive."}`
        }
      );
      setPendingAction(null);
    },
    onError: (error) =>
      toast.error(`Unable to update ${definition.label.toLowerCase()}`, {
        description: error instanceof Error ? error.message : "Please try again."
      })
  });

  const records = recordsQuery.data ?? [];
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesStatus = status === "all" || record.status === status;
      const matchesSearch =
        !term ||
        Object.values(record).some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(term)
        );
      return matchesStatus && matchesSearch;
    });
  }, [records, search, status]);
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <WorkspacePage
      title={definition.plural}
      description={`Manage tenant location data and shared ${definition.plural.toLowerCase()} available to this workspace.`}
      technicalName={`page.common.location.${kind}.list`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            className="h-9 rounded-md"
            disabled={recordsQuery.isFetching}
            onClick={() => void recordsQuery.refetch()}
            type="button"
            variant="outline"
          >
            <RefreshCw className={cn("size-4", recordsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button className="h-9 rounded-md" onClick={() => setEditing(null)} type="button">
            <Plus className="size-4" />
            New {definition.label.toLowerCase()}
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        filterOptions={[
          { id: "all", label: `All ${definition.plural.toLowerCase()}` },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" }
        ]}
        filterValue={status}
        onFilterValueChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onSearchValueChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={`Search ${definition.plural.toLowerCase()}`}
        searchValue={search}
      />
      <CityTable
        definition={definition}
        loading={recordsQuery.isFetching && records.length === 0}
        records={pageRecords}
        startIndex={(currentPage - 1) * rowsPerPage}
        onEdit={(record) => setEditing(record)}
        onForceDelete={(record) => setPendingAction({ record, type: "delete" })}
        onSuspend={(record) => setPendingAction({ record, type: "suspend" })}
        {...(kind === "state" ? { onView: setViewing } : {})}
      />
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filteredRecords.length)}
        singularLabel={definition.plural.toLowerCase()}
        totalCount={filteredRecords.length}
        totalPages={totalPages}
        onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))}
        onPageChange={setPage}
        onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(1);
        }}
      />
      <CityUpsertDialog
        definition={definition}
        error={mutation.error instanceof Error ? mutation.error.message : ""}
        loading={mutation.isPending}
        open={editing !== undefined}
        parents={parentQueries}
        record={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSubmit={(payload) => mutation.mutate(payload)}
      />
      <CityViewDialog definition={definition} onClose={() => setViewing(null)} record={viewing} />
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "delete"
                ? `Force delete ${definition.label.toLowerCase()}?`
                : `Suspend ${definition.label.toLowerCase()}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "delete"
                ? `${pendingAction.record.name} will be permanently removed. This action cannot be undone.`
                : `${pendingAction?.record.name ?? `This ${definition.label.toLowerCase()}`} will become unavailable for new selections.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rowActionMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                pendingAction?.type === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
              disabled={rowActionMutation.isPending || !pendingAction}
              onClick={() => pendingAction && rowActionMutation.mutate(pendingAction)}
            >
              {pendingAction?.type === "delete" ? "Force delete" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspacePage>
  );
}

export function CityTable({
  definition,
  loading,
  onEdit,
  onForceDelete,
  onSuspend,
  onView,
  records,
  startIndex
}: {
  definition: CityDefinition;
  loading: boolean;
  onEdit: (record: CityRecord) => void;
  onForceDelete?: (record: CityRecord) => void;
  onSuspend?: (record: CityRecord) => void;
  onView?: (record: CityRecord) => void;
  records: CityRecord[];
  startIndex?: number;
}) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <WorkspaceTableHeaderCell>#</WorkspaceTableHeaderCell>
              {definition.columns.map((column) => (
                <WorkspaceTableHeaderCell key={column.key}>{column.label}</WorkspaceTableHeaderCell>
              ))}
              <WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              const canMutate = canMutateCityRow(definition.kind, record);
              const protectedRow = isProtectedCityRow(definition.kind, record);
              return (
                <tr className="border-b border-border/70 last:border-b-0" key={record.id}>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {(startIndex ?? 0) + index + 1}
                  </td>
                  {definition.columns.map((column) => (
                    <td
                      className={cn("px-4 py-2.5", column.key === "name" && "font-medium")}
                      key={column.key}
                    >
                      {column.key === "status" ? (
                        <WorkspaceStatusBadge
                          label={record.status}
                          tone={record.status === "active" ? "success" : "neutral"}
                        />
                      ) : isPrimaryCityColumn(definition.kind, column.key) && canMutate ? (
                        <button
                          className="cursor-pointer text-left font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => onEdit(record)}
                          type="button"
                        >
                          {String(record[column.key] ?? "-")}
                        </button>
                      ) : (
                        String(record[column.key] ?? "-")
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-1.5 text-right">
                    {protectedRow ? (
                      <WorkspaceProtectedIndicator />
                    ) : !canMutate && !onView ? (
                      <span className="text-xs text-muted-foreground">Shared</span>
                    ) : (
                      <WorkspaceRowActions
                        deleteLabel="Suspend"
                        {...(canMutate ? { onEdit: () => onEdit(record) } : {})}
                        title={record.name}
                        {...(onForceDelete && canMutate
                          ? {
                              actions: [
                                {
                                  id: "force-delete",
                                  icon: <Trash2 className="size-4" />,
                                  label: "Force delete",
                                  onSelect: () => onForceDelete(record),
                                  tone: "destructive" as const
                                }
                              ]
                            }
                          : {})}
                        {...(onSuspend && canMutate ? { onDelete: () => onSuspend(record) } : {})}
                        {...(onView ? { onView: () => onView(record) } : {})}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {loading ? <WorkspaceTableSkeletonRows columns={definition.columns.length + 2} /> : null}
      {!loading && records.length === 0 ? (
        <WorkspaceTableEmptyState>
          No {definition.plural.toLowerCase()} found.
        </WorkspaceTableEmptyState>
      ) : null}
    </WorkspaceTablePanel>
  );
}

function canMutateCityRow(kind: CityKind, record: CityRecord) {
  if (isProtectedCityRow(kind, record)) return false;
  return true;
}

function isProtectedCityRow(kind: CityKind, record: CityRecord) {
  const name = String(record.name ?? "").trim();
  const code = String(record.code ?? "").trim();
  return (
    name === "-" ||
    code === "-" ||
    (kind === "country" && (code.toUpperCase() === "IN" || name.toLowerCase() === "india"))
  );
}

function isPrimaryCityColumn(kind: CityKind, key: keyof CityRecord) {
  return key === "name" || (kind === "pincode" && key === "pincode");
}

type CityParents = {
  cities: CityRecord[];
  countries: CityRecord[];
  districts: CityRecord[];
  states: CityRecord[];
};

function useCityParents(kind: CityKind): CityParents {
  const countries = useQuery({
    enabled: kind === "state" || kind === "district" || kind === "city" || kind === "pincode",
    queryKey: ["core", "location", "country"],
    queryFn: () => listCityRecords(cityDefinitions.country.path)
  });
  const states = useQuery({
    enabled: kind === "district" || kind === "city" || kind === "pincode",
    queryKey: ["core", "location", "state"],
    queryFn: () => listCityRecords(cityDefinitions.state.path)
  });
  const districts = useQuery({
    enabled: kind === "city" || kind === "pincode",
    queryKey: ["core", "location", "district"],
    queryFn: () => listCityRecords(cityDefinitions.district.path)
  });
  const cities = useQuery({
    enabled: kind === "pincode",
    queryKey: ["core", "location", "city"],
    queryFn: () => listCityRecords(cityDefinitions.city.path)
  });
  return {
    cities: cities.data ?? [],
    countries: countries.data ?? [],
    districts: districts.data ?? [],
    states: states.data ?? []
  };
}

export function CityUpsertDialog({
  definition,
  error,
  loading,
  onClose,
  onSubmit,
  open,
  parents,
  record
}: {
  definition: CityDefinition;
  error: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: CitySavePayload) => void;
  open: boolean;
  parents: CityParents;
  record: CityRecord | null;
}) {
  const formKey = `${definition.kind}:${record?.id ?? "new"}:${open}`;

  return (
    <WorkspaceUpsertDialog
      className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      description={`Enter the ${definition.label.toLowerCase()} details and save without leaving the list.`}
      onClose={onClose}
      open={open}
      title={`${record ? "Edit" : "New"} ${definition.label.toLowerCase()}`}
    >
      <CityForm
        key={formKey}
        definition={definition}
        error={error}
        loading={loading}
        parents={parents}
        initialValue={toFormValue(definition.kind, record)}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </WorkspaceUpsertDialog>
  );
}

function CityForm({
  definition,
  error,
  initialValue,
  loading,
  onCancel,
  onSubmit,
  parents
}: {
  definition: CityDefinition;
  error: string;
  initialValue: CitySavePayload;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (payload: CitySavePayload) => void;
  parents: CityParents;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(initialValue);
  const update = (patch: Partial<CitySavePayload>) => {
    const next = { ...value, ...patch };
    setValue(next);
  };
  const choose = (
    field: "city" | "country" | "district" | "state",
    id: string,
    records: CityRecord[],
    selectedLabel?: string
  ) => {
    const selected = records.find((item) => String(item.id) === id);
    const relation = {
      [`${field}Id`]: id,
      [`${field}Name`]: selected?.name ?? selectedLabel ?? null
    };
    if (field === "country")
      update({
        ...relation,
        stateId: null,
        stateName: null,
        districtId: null,
        districtName: null,
        cityId: null,
        cityName: null
      });
    else if (field === "state")
      update({ ...relation, districtId: null, districtName: null, cityId: null, cityName: null });
    else if (field === "district") update({ ...relation, cityId: null, cityName: null });
    else update(relation);
  };
  const createParent = async (
    kind: "country" | "district" | "state",
    name: string
  ): Promise<WorkspaceLookupOption | undefined> => {
    if (kind === "state" && !value.countryId) {
      toast.error("Select a country before creating a state.");
      return undefined;
    }
    if (kind === "district" && (!value.countryId || !value.stateId)) {
      toast.error("Select a country and state before creating a district.");
      return undefined;
    }
    const payload = inlineCreateCityPayload();
    payload.code = codeFromName(name);
    payload.name = name;
    if (kind === "state" || kind === "district") {
      payload.countryId = value.countryId ?? null;
      payload.countryName = value.countryName ?? null;
    }
    if (kind === "district") {
      payload.stateId = value.stateId ?? null;
      payload.stateName = value.stateName ?? null;
    }
    try {
      const created = await createCityRecord(cityDefinitions[kind].path, payload);
      await queryClient.invalidateQueries({ queryKey: ["core", "location", kind] });
      toast.success(`${cityDefinitions[kind].label} created`, {
        description: `${created.name} was selected.`
      });
      return { label: created.name, value: String(created.id) };
    } catch (error) {
      toast.error(`Unable to create ${cityDefinitions[kind].label.toLowerCase()}`, {
        description: error instanceof Error ? error.message : "Please try again."
      });
      return undefined;
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(
          definition.kind === "city" || definition.kind === "district"
            ? { ...value, code: value.code || codeFromName(value.name) }
            : definition.kind === "state"
              ? { ...value, code: value.gstStateCode?.trim() || value.code }
              : value
        );
      }}
    >
      {error ? <WorkspaceFormBanner title="Unable to save">{error}</WorkspaceFormBanner> : null}
      <WorkspaceFormGrid columns={1}>
        {definition.kind === "pincode" ? (
          <>
            <Field label="Pincode" required>
              <Input
                required
                value={value.pincode ?? ""}
                onChange={(event) =>
                  update({
                    code: event.target.value,
                    name: event.target.value,
                    pincode: event.target.value
                  })
                }
              />
            </Field>
            <Field label="Area name" required>
              <Input
                required
                value={value.areaName ?? ""}
                onChange={(event) => update({ areaName: event.target.value })}
              />
            </Field>
            <SelectField
              label="Country"
              required
              value={String(value.countryId ?? "")}
              records={parents.countries}
              onChange={(id) => choose("country", id, parents.countries)}
            />
            <SelectField
              label="State"
              required
              value={String(value.stateId ?? "")}
              records={parents.states.filter((item) => item.countryId === value.countryId)}
              onChange={(id) => choose("state", id, parents.states)}
            />
            <SelectField
              label="District"
              required
              value={String(value.districtId ?? "")}
              records={parents.districts.filter((item) => item.stateId === value.stateId)}
              onChange={(id) => choose("district", id, parents.districts)}
            />
            <SelectField
              label="City"
              required
              value={String(value.cityId ?? "")}
              records={parents.cities.filter((item) => item.districtId === value.districtId)}
              onChange={(id) => choose("city", id, parents.cities)}
            />
          </>
        ) : (
          <>
            <Field label={`${definition.label} name`} required>
              <Input
                required
                value={value.name}
                onChange={(event) => update({ name: event.target.value })}
              />
            </Field>
            {definition.kind === "country" ? (
              <>
                <Field label="Country code" required>
                  <Input
                    className="font-mono uppercase"
                    required
                    value={value.code}
                    onChange={(event) => update({ code: event.target.value.toUpperCase() })}
                  />
                </Field>
                <Field label="Sort order">
                  <Input
                    min={0}
                    type="number"
                    value={value.sortOrder}
                    onChange={(event) => update({ sortOrder: Number(event.target.value) })}
                  />
                </Field>
              </>
            ) : null}
          </>
        )}
        {definition.kind === "state" ? (
          <>
            <Field label="GST State code" required>
              <Input
                className="font-mono"
                required
                value={value.gstStateCode ?? ""}
                onChange={(event) =>
                  update({ code: event.target.value, gstStateCode: event.target.value })
                }
              />
            </Field>
            <SelectField
              label="Country"
              required
              value={String(value.countryId ?? "")}
              records={parents.countries}
              onChange={(id) => choose("country", id, parents.countries)}
            />
          </>
        ) : null}
        {definition.kind === "district" ? (
          <>
            <SelectField
              label="Country"
              required
              value={String(value.countryId ?? "")}
              records={parents.countries}
              onChange={(id) => choose("country", id, parents.countries)}
            />
            <SelectField
              label="State"
              required
              value={String(value.stateId ?? "")}
              records={parents.states.filter(
                (item) => !value.countryId || item.countryId === value.countryId
              )}
              onChange={(id) => choose("state", id, parents.states)}
            />
          </>
        ) : null}
        {definition.kind === "city" ? (
          <>
            <LookupField
              createLabel="Create country"
              label="Country"
              required
              value={String(value.countryId ?? "")}
              records={parents.countries}
              onChange={(id, label) => choose("country", id, parents.countries, label)}
              onCreate={(name) => createParent("country", name)}
            />
            <LookupField
              createLabel="Create state"
              disabled={!value.countryId}
              label="State"
              required
              value={String(value.stateId ?? "")}
              records={parents.states.filter((item) => item.countryId === value.countryId)}
              onChange={(id, label) => choose("state", id, parents.states, label)}
              onCreate={(name) => createParent("state", name)}
            />
            <LookupField
              createLabel="Create district"
              disabled={!value.stateId}
              label="District"
              required
              value={String(value.districtId ?? "")}
              records={parents.districts.filter((item) => item.stateId === value.stateId)}
              onChange={(id, label) => choose("district", id, parents.districts, label)}
              onCreate={(name) => createParent("district", name)}
            />
          </>
        ) : null}
        <div
          className={cn(
            "flex h-11 items-center gap-2 rounded-md border px-3",
            value.status === "active"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-border/80 bg-muted/30 text-muted-foreground"
          )}
        >
          <CheckCircle2 className="size-4 shrink-0" />
          <span className="text-sm font-medium">Active</span>
          <Switch
            aria-label="Active"
            checked={value.status === "active"}
            className="ml-auto"
            onCheckedChange={(checked) => update({ status: checked ? "active" : "inactive" })}
          />
        </div>
      </WorkspaceFormGrid>
      <WorkspaceFormFooter
        className="mt-6 border-t pt-4"
        onCancel={onCancel}
        primaryLabel="Save"
        primaryLoading={loading}
        primaryProps={{
          children: (
            <>
              <Save className="size-4" />
              Save
            </>
          )
        }}
      />
    </form>
  );
}

function CityViewDialog({
  definition,
  onClose,
  record
}: {
  definition: CityDefinition;
  onClose: () => void;
  record: CityRecord | null;
}) {
  return (
    <WorkspaceUpsertDialog
      className="sm:max-w-lg"
      description={`Review the ${definition.label.toLowerCase()} details without leaving the list.`}
      onClose={onClose}
      open={record !== null}
      title={`View ${definition.label.toLowerCase()}`}
    >
      {record ? (
        <div className="space-y-5">
          <WorkspaceFormGrid columns={1}>
            {definition.kind === "pincode" ? (
              <>
                <Field label="Pincode">
                  <Input className="font-mono" readOnly value={record.pincode ?? record.code} />
                </Field>
                <Field label="Area name">
                  <Input readOnly value={record.areaName ?? "-"} />
                </Field>
                <Field label="Country">
                  <Input readOnly value={record.countryName ?? "-"} />
                </Field>
                <Field label="State">
                  <Input readOnly value={record.stateName ?? "-"} />
                </Field>
                <Field label="District">
                  <Input readOnly value={record.districtName ?? "-"} />
                </Field>
                <Field label="City">
                  <Input readOnly value={record.cityName ?? "-"} />
                </Field>
              </>
            ) : (
              <>
                <Field label={`${definition.label} name`}>
                  <Input readOnly value={record.name} />
                </Field>
                {definition.kind === "country" ? (
                  <Field label="Country code">
                    <Input className="font-mono" readOnly value={record.code} />
                  </Field>
                ) : null}
                {definition.kind === "state" ? (
                  <Field label="GST State code">
                    <Input
                      className="font-mono"
                      readOnly
                      value={record.gstStateCode ?? record.code}
                    />
                  </Field>
                ) : null}
                {definition.kind !== "country" ? (
                  <Field label="Country">
                    <Input readOnly value={record.countryName ?? "-"} />
                  </Field>
                ) : null}
                {definition.kind === "district" || definition.kind === "city" ? (
                  <Field label="State">
                    <Input readOnly value={record.stateName ?? "-"} />
                  </Field>
                ) : null}
                {definition.kind === "city" ? (
                  <Field label="District">
                    <Input readOnly value={record.districtName ?? "-"} />
                  </Field>
                ) : null}
              </>
            )}
            <div
              className={cn(
                "flex h-11 items-center gap-2 rounded-md border px-3",
                record.status === "active"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-border/80 bg-muted/30 text-muted-foreground"
              )}
            >
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="text-sm font-medium">
                {record.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>
          </WorkspaceFormGrid>
          <div className="border-t pt-4">
            <Button onClick={onClose} type="button" variant="outline">
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </WorkspaceUpsertDialog>
  );
}

function Field({
  children,
  label,
  required
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <WorkspaceFormField label={label} {...(required ? { required: true } : {})}>
      {children}
    </WorkspaceFormField>
  );
}

function SelectField({
  label,
  onChange,
  records,
  required,
  value
}: {
  label: string;
  onChange: (value: string, label?: string) => void;
  records: CityRecord[];
  required?: boolean;
  value: string;
}) {
  return (
    <WorkspaceFormField label={label} {...(required ? { required: true } : {})}>
      <WorkspaceLookup
        allowTextValue={false}
        onValueChange={(next, option) => onChange(next, option?.label)}
        options={records.map((record) => ({ label: record.name, value: String(record.id) }))}
        placeholder={`Select ${label.toLowerCase()}`}
        value={value}
      />
    </WorkspaceFormField>
  );
}

function LookupField({
  createLabel,
  disabled,
  label,
  onChange,
  onCreate,
  records,
  required,
  value
}: {
  createLabel: string;
  disabled?: boolean;
  label: string;
  onChange: (value: string, label?: string) => void;
  onCreate: (name: string) => Promise<WorkspaceLookupOption | undefined>;
  records: CityRecord[];
  required?: boolean;
  value: string;
}) {
  return (
    <WorkspaceFormField label={label} {...(required ? { required: true } : {})}>
      <WorkspaceLookup
        allowTextValue={false}
        createLabel={createLabel}
        createMode="inline"
        {...(disabled !== undefined ? { disabled } : {})}
        emptyLabel={`No ${label.toLowerCase()} found.`}
        onCreate={onCreate}
        onValueChange={(next, option) => onChange(next, option?.label)}
        options={records.map((record) => ({ label: record.name, value: String(record.id) }))}
        placeholder={
          disabled
            ? `Select ${label === "State" ? "country" : "state"} first`
            : `Search or select ${label.toLowerCase()}`
        }
        {...(required !== undefined ? { required } : {})}
        value={value}
      />
    </WorkspaceFormField>
  );
}

function toFormValue(kind: CityKind, record: CityRecord | null): CitySavePayload {
  if (record) {
    const { id: _id, ...value } = record;
    return value;
  }
  return emptyCityPayload(kind);
}

function emptyCityPayload(kind?: CityKind): CitySavePayload {
  return {
    areaName: null,
    capital: null,
    cityId: null,
    cityName: null,
    code: "",
    countryId: null,
    countryName: null,
    currencyCode: null,
    dialCode: null,
    districtId: null,
    districtName: null,
    gstStateCode: null,
    iso2: null,
    iso3: null,
    name: "",
    numericCode: null,
    pincode: kind === "pincode" ? "" : null,
    shortCode: null,
    sortOrder: 1000,
    stateId: null,
    stateName: null,
    status: "active"
  };
}

function codeFromName(name: string) {
  const code = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return code || `LOCATION-${Date.now()}`;
}

function inlineCreateCityPayload(): CitySavePayload {
  return {
    ...emptyCityPayload(),
    capital: "-",
    currencyCode: "-",
    dialCode: "-",
    gstStateCode: "-",
    iso2: "-",
    iso3: "-",
    numericCode: "-",
    shortCode: "-"
  };
}

export function CityWorkspace() {
  return <CityModuleShell kind="city" />;
}
