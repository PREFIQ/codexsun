import { monthsDefinition } from "./months.types";
import { useMemo, useState } from "react";
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
import {
  createMonths,
  forceDeleteMonths,
  listMonths,
  setMonthsActive,
  updateMonths
} from "./months.services";
import type { MonthsDefinition, MonthsRecord, MonthsValue } from "./months.types";

export function MonthsShell({ definition }: { definition: MonthsDefinition }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [editing, setEditing] = useState<MonthsRecord | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<MonthsRecord | null>(null);
  const query = useQuery({
    queryFn: () => listMonths(definition.path),
    queryKey: ["core", "common", definition.key]
  });
  const save = useMutation({
    mutationFn: (payload: Record<string, MonthsValue>) =>
      editing
        ? updateMonths(definition.path, editing.id, payload)
        : createMonths(definition.path, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["core", "common", definition.key] });
      toast.success(`${singular(definition.label)} saved`);
      setEditing(undefined);
    }
  });
  const toggle = useMutation({
    mutationFn: (record: MonthsRecord) =>
      setMonthsActive(definition.path, record.id, !record.isActive),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["core", "common", definition.key] })
  });
  const forceDelete = useMutation({
    mutationFn: (record: MonthsRecord) => forceDeleteMonths(definition.path, record.id),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: ["core", "common", definition.key] });
      toast.success(`${singular(definition.label)} force deleted`, {
        description: `${String(record.name ?? "Record")} was permanently removed.`
      });
      setDeleting(null);
    },
    onError: (error) =>
      toast.error(`Unable to delete ${singular(definition.label).toLowerCase()}`, {
        description: error instanceof Error ? error.message : "Please try again."
      })
  });
  const rows = useMemo(
    () =>
      (query.data ?? []).filter((record) => {
        const matchesStatus =
          status === "all" || (status === "active" ? record.isActive : !record.isActive);
        const term = search.trim().toLowerCase();
        return (
          matchesStatus &&
          (!term ||
            definition.fields.some((field) =>
              String(record[field.key] ?? "")
                .toLowerCase()
                .includes(term)
            ))
        );
      }),
    [definition.fields, query.data, search, status]
  );
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const finalized = isFinalizedContactMaster(definition);

  return (
    <WorkspacePage
      title={definition.label}
      description={`Manage ${definition.label.toLowerCase()} for this workspace.`}
      technicalName={`page.common.${definition.group}.${definition.key}.list`}
      actions={
        <div className="flex gap-2">
          <Button className="h-9 rounded-md" variant="outline" onClick={() => void query.refetch()}>
            <RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button className="h-9 rounded-md" onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            New {singular(definition.label).toLowerCase()}
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        filterOptions={[
          { id: "all", label: "All records" },
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
        searchPlaceholder={`Search ${definition.label.toLowerCase()}`}
        searchValue={search}
      />
      <MonthsList
        definition={definition}
        loading={query.isFetching && !query.data}
        records={pageRows}
        startIndex={(currentPage - 1) * rowsPerPage}
        onEdit={setEditing}
        onToggle={(record) => toggle.mutate(record)}
        {...(finalized ? { onForceDelete: setDeleting } : {})}
      />
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, rows.length)}
        singularLabel={definition.label.toLowerCase()}
        totalCount={rows.length}
        totalPages={totalPages}
        onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))}
        onPageChange={setPage}
        onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(1);
        }}
      />
      <MonthsForm
        key={`${definition.key}:${editing?.id ?? "new"}:${editing !== undefined}`}
        definition={definition}
        error={save.error instanceof Error ? save.error.message : ""}
        loading={save.isPending}
        open={editing !== undefined}
        record={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSubmit={(payload) => save.mutate(payload)}
      />
      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Force delete {singular(definition.label).toLowerCase()}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {String(deleting?.name ?? "This record")} will be permanently removed. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={forceDelete.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!deleting || forceDelete.isPending}
              onClick={() => deleting && forceDelete.mutate(deleting)}
            >
              Force delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspacePage>
  );
}

export function MonthsList({
  definition,
  loading,
  onEdit,
  onForceDelete,
  onToggle,
  records,
  startIndex = 0
}: {
  definition: MonthsDefinition;
  loading: boolean;
  onEdit: (record: MonthsRecord) => void;
  onForceDelete?: (record: MonthsRecord) => void;
  onToggle: (record: MonthsRecord) => void;
  records: MonthsRecord[];
  startIndex?: number;
}) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <WorkspaceTableHeaderCell>#</WorkspaceTableHeaderCell>
              {definition.fields.map((field) => (
                <WorkspaceTableHeaderCell key={field.key}>{field.label}</WorkspaceTableHeaderCell>
              ))}
              <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              const placeholder = isPlaceholder(record, definition);
              const editable = !placeholder;
              return (
                <tr className="border-b border-border/70 last:border-0" key={record.id}>
                  <td className="px-4 py-2.5 text-muted-foreground">{startIndex + index + 1}</td>
                  {definition.fields.map((field, fieldIndex) => (
                    <td className="px-4 py-2.5" key={field.key}>
                      {placeholder && fieldIndex === 0 ? (
                        "-"
                      ) : fieldIndex === 0 && editable ? (
                        <button
                          className="cursor-pointer text-left font-medium hover:underline"
                          onClick={() => onEdit(record)}
                          type="button"
                        >
                          {formatValue(record[field.key] ?? null, field.type)}
                        </button>
                      ) : (
                        formatValue(record[field.key] ?? null, field.type)
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2.5">
                    <WorkspaceStatusBadge
                      label={record.isActive ? "active" : "inactive"}
                      tone={record.isActive ? "success" : "neutral"}
                    />
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    {placeholder ? (
                      <WorkspaceProtectedIndicator />
                    ) : !editable ? (
                      <span className="text-xs text-muted-foreground">Shared</span>
                    ) : (
                      <WorkspaceRowActions
                        title={String(record[definition.fields[0]?.key ?? "id"])}
                        isSuspended={!record.isActive}
                        onEdit={() => onEdit(record)}
                        onDelete={() => onToggle(record)}
                        onRestore={() => onToggle(record)}
                        deleteLabel="Suspend"
                        restoreLabel="Activate"
                        {...(onForceDelete
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
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {loading ? <WorkspaceTableSkeletonRows columns={definition.fields.length + 3} /> : null}
      {!loading && records.length === 0 ? (
        <WorkspaceTableEmptyState>No records found.</WorkspaceTableEmptyState>
      ) : null}
    </WorkspaceTablePanel>
  );
}

export function MonthsForm({
  definition,
  error,
  loading,
  onClose,
  onSubmit,
  open,
  record
}: {
  definition: MonthsDefinition;
  error: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, MonthsValue>) => void;
  open: boolean;
  record: MonthsRecord | null;
}) {
  const initial = Object.fromEntries(
    definition.fields.map((field) => [field.key, record?.[field.key] ?? defaultValue(field.type)])
  );
  const [value, setValue] = useState<Record<string, MonthsValue>>({
    ...initial,
    isActive: record?.isActive ?? true,
    sortOrder: 1000
  });
  return (
    <WorkspaceUpsertDialog
      className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
      description={`Enter the ${singular(definition.label).toLowerCase()} details.`}
      open={open}
      onClose={onClose}
      title={`${record ? "Edit" : "New"} ${singular(definition.label).toLowerCase()}`}
    >
      <form
        key={`${definition.key}:${record?.id ?? "new"}:${open}`}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(value);
        }}
      >
        {error ? <WorkspaceFormBanner title="Unable to save">{error}</WorkspaceFormBanner> : null}
        <WorkspaceFormGrid columns={1}>
          {definition.fields.map((field) => (
            <WorkspaceFormField
              key={field.key}
              label={field.label}
              {...(field.required ? { required: true } : {})}
            >
              {field.type === "boolean" ? (
                <Switch
                  checked={Boolean(value[field.key])}
                  onCheckedChange={(checked) =>
                    setValue((current) => ({ ...current, [field.key]: checked }))
                  }
                />
              ) : (
                <Input
                  required={field.required}
                  type={
                    field.type === "number"
                      ? "number"
                      : field.type === "date"
                        ? "date"
                        : field.type === "color"
                          ? "color"
                          : "text"
                  }
                  value={String(value[field.key] ?? "")}
                  onChange={(event) =>
                    setValue((current) => ({
                      ...current,
                      [field.key]:
                        field.type === "number" ? Number(event.target.value) : event.target.value
                    }))
                  }
                />
              )}
            </WorkspaceFormField>
          ))}
          {!isFinalizedContactMaster(definition) ? (
            <WorkspaceFormField label="Sort order">
              <Input
                min={0}
                type="number"
                value={String(value.sortOrder ?? 1000)}
                onChange={(event) =>
                  setValue((current) => ({ ...current, sortOrder: Number(event.target.value) }))
                }
              />
            </WorkspaceFormField>
          ) : null}
          {isFinalizedContactMaster(definition) ? (
            <div
              className={cn(
                "flex h-11 items-center gap-2 rounded-md border px-3",
                value.isActive
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-border/80 bg-muted/30 text-muted-foreground"
              )}
            >
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="text-sm font-medium">Active</span>
              <Switch
                aria-label="Active"
                checked={Boolean(value.isActive)}
                className="ml-auto"
                onCheckedChange={(checked) =>
                  setValue((current) => ({ ...current, isActive: checked }))
                }
              />
            </div>
          ) : (
            <WorkspaceFormField label="Active">
              <div className="flex h-11 items-center gap-3 rounded-md border px-3">
                <Switch
                  checked={Boolean(value.isActive)}
                  onCheckedChange={(checked) =>
                    setValue((current) => ({ ...current, isActive: checked }))
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {value.isActive ? "Available" : "Inactive"}
                </span>
              </div>
            </WorkspaceFormField>
          )}
        </WorkspaceFormGrid>
        <WorkspaceFormFooter
          className="mt-6 border-t pt-4"
          onCancel={onClose}
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
    </WorkspaceUpsertDialog>
  );
}

function formatValue(value: MonthsValue, type: string) {
  if (type === "boolean") return value ? "Yes" : "No";
  if (type === "color")
    return (
      <span className="inline-flex items-center gap-2">
        <span className="size-4 rounded-sm border" style={{ backgroundColor: String(value) }} />
        {String(value ?? "-")}
      </span>
    );
  return String(value ?? "-");
}
function defaultValue(type: string): MonthsValue {
  return type === "boolean" ? false : type === "number" ? 0 : "";
}
function singular(label: string) {
  return label.endsWith("ies")
    ? `${label.slice(0, -3)}y`
    : label.endsWith("s")
      ? label.slice(0, -1)
      : label;
}
function isFinalizedContactMaster(definition: MonthsDefinition) {
  return FINALIZED_COMMON_MASTER_KEYS.has(definition.key);
}
function isPlaceholder(record: MonthsRecord, definition: MonthsDefinition) {
  return definition.fields.some((field) => String(record[field.key] ?? "").trim() === "-");
}

const FINALIZED_COMMON_MASTER_KEYS = new Set([
  "contactGroups",
  "contactTypes",
  "addressTypes",
  "bankNames",
  "productGroups",
  "productCategories",
  "productTypes",
  "units",
  "hsnCodes",
  "taxes",
  "brands",
  "colours",
  "sizes",
  "styles",
  "workOrderTypes",
  "transports",
  "warehouses",
  "destinations",
  "stockRejectionTypes",
  "currencies",
  "priorities",
  "paymentTerms",
  "salesTypes",
  "months"
]);

export function MonthsWorkspace() {
  return <MonthsShell definition={monthsDefinition} />;
}
