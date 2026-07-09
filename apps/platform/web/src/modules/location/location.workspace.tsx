import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, RefreshCw, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@codexsun/ui/components/button"
import { Input } from "@codexsun/ui/components/input"
import { Switch } from "@codexsun/ui/components/switch"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspaceLookup, type WorkspaceLookupOption } from "@codexsun/ui/workspace/lookup"
import { WorkspacePage } from "@codexsun/ui/workspace/page"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel, WorkspaceTableSkeletonRows } from "@codexsun/ui/workspace/table"
import { WorkspaceFormBanner, WorkspaceFormField, WorkspaceFormFooter, WorkspaceFormGrid, WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert"
import { cn } from "@codexsun/ui/lib/utils"
import { locationDefinitions } from "./location.definitions"
import { createLocationRecord, listLocationRecords, updateLocationRecord } from "./location.services"
import type { LocationDefinition, LocationKind, LocationRecord, LocationSavePayload } from "./location.types"

export function LocationWorkspace({ kind }: { kind: LocationKind }) {
  const definition = locationDefinitions[kind]
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [editing, setEditing] = useState<LocationRecord | null | undefined>(undefined)
  const recordsQuery = useQuery({
    queryKey: ["core", "location", kind],
    queryFn: () => listLocationRecords(definition.path)
  })
  const parentQueries = useLocationParents(kind)
  const mutation = useMutation({
    mutationFn: (payload: LocationSavePayload) =>
      editing ? updateLocationRecord(definition.path, editing.id, payload) : createLocationRecord(definition.path, payload),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: ["core", "location"] })
      toast.success(`${definition.label} ${editing ? "updated" : "created"}`, { description: `${record.name} is ready in the list.` })
      setEditing(undefined)
    },
    onError: (error) => toast.error(`Unable to save ${definition.label.toLowerCase()}`, {
      description: error instanceof Error ? error.message : "Please try again."
    })
  })

  const records = recordsQuery.data ?? []
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    return records.filter((record) => {
      const matchesStatus = status === "all" || record.status === status
      const matchesSearch = !term || Object.values(record).some((value) => String(value ?? "").toLowerCase().includes(term))
      return matchesStatus && matchesSearch
    })
  }, [records, search, status])

  return (
    <WorkspacePage
      title={definition.plural}
      description={`Manage tenant location data and shared ${definition.plural.toLowerCase()} available to this workspace.`}
      technicalName={`page.common.location.${kind}.list`}
      actions={
        <div className="flex items-center gap-2">
          <Button className="h-9 rounded-md" disabled={recordsQuery.isFetching} onClick={() => void recordsQuery.refetch()} type="button" variant="outline">
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
        onFilterValueChange={setStatus}
        onSearchValueChange={setSearch}
        searchPlaceholder={`Search ${definition.plural.toLowerCase()}`}
        searchValue={search}
      />
      <LocationTable
        definition={definition}
        loading={recordsQuery.isFetching && records.length === 0}
        records={filteredRecords}
        onEdit={(record) => setEditing(record)}
      />
      <LocationUpsertDialog
        definition={definition}
        error={mutation.error instanceof Error ? mutation.error.message : ""}
        loading={mutation.isPending}
        open={editing !== undefined}
        parents={parentQueries}
        record={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSubmit={(payload) => mutation.mutate(payload)}
      />
    </WorkspacePage>
  )
}

export function LocationTable({
  definition,
  loading,
  onEdit,
  records
}: {
  definition: LocationDefinition
  loading: boolean
  onEdit: (record: LocationRecord) => void
  records: LocationRecord[]
}) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <WorkspaceTableHeaderCell>#</WorkspaceTableHeaderCell>
              {definition.columns.map((column) => <WorkspaceTableHeaderCell key={column.key}>{column.label}</WorkspaceTableHeaderCell>)}
              <WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr className="border-b border-border/70 last:border-b-0" key={record.id}>
                <td className="px-4 py-2.5 text-muted-foreground">{index + 1}</td>
                {definition.columns.map((column) => (
                  <td className={cn("px-4 py-2.5", column.key === "name" && "font-medium")} key={column.key}>
                    {column.key === "status"
                      ? <WorkspaceStatusBadge label={record.status} tone={record.status === "active" ? "success" : "neutral"} />
                      : String(record[column.key] ?? "-")}
                  </td>
                ))}
                <td className="px-4 py-1.5 text-right">
                  {record.tenantId === "global"
                    ? <span className="text-xs text-muted-foreground">Shared</span>
                    : <WorkspaceRowActions onEdit={() => onEdit(record)} title={record.name} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading ? <WorkspaceTableSkeletonRows columns={definition.columns.length + 2} /> : null}
      {!loading && records.length === 0 ? <WorkspaceTableEmptyState>No {definition.plural.toLowerCase()} found.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  )
}

type LocationParents = {
  countries: LocationRecord[]
  districts: LocationRecord[]
  states: LocationRecord[]
}

function useLocationParents(kind: LocationKind): LocationParents {
  const countries = useQuery({
    enabled: kind === "state" || kind === "district" || kind === "city",
    queryKey: ["core", "location", "country"],
    queryFn: () => listLocationRecords(locationDefinitions.country.path)
  })
  const states = useQuery({
    enabled: kind === "district" || kind === "city",
    queryKey: ["core", "location", "state"],
    queryFn: () => listLocationRecords(locationDefinitions.state.path)
  })
  const districts = useQuery({
    enabled: kind === "city",
    queryKey: ["core", "location", "district"],
    queryFn: () => listLocationRecords(locationDefinitions.district.path)
  })
  return {
    countries: countries.data ?? [],
    districts: districts.data ?? [],
    states: states.data ?? []
  }
}

export function LocationUpsertDialog({
  definition,
  error,
  loading,
  onClose,
  onSubmit,
  open,
  parents,
  record
}: {
  definition: LocationDefinition
  error: string
  loading: boolean
  onClose: () => void
  onSubmit: (payload: LocationSavePayload) => void
  open: boolean
  parents: LocationParents
  record: LocationRecord | null
}) {
  const formKey = `${definition.kind}:${record?.id ?? "new"}:${open}`

  return (
    <WorkspaceUpsertDialog
      className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      description={`Enter the ${definition.label.toLowerCase()} details and save without leaving the list.`}
      onClose={onClose}
      open={open}
      title={`${record ? "Edit" : "New"} ${definition.label.toLowerCase()}`}
    >
      <LocationForm
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
  )
}

function LocationForm({
  definition,
  error,
  initialValue,
  loading,
  onCancel,
  onSubmit,
  parents
}: {
  definition: LocationDefinition
  error: string
  initialValue: LocationSavePayload
  loading: boolean
  onCancel: () => void
  onSubmit: (payload: LocationSavePayload) => void
  parents: LocationParents
}) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState(initialValue)
  const update = (patch: Partial<LocationSavePayload>) => {
    const next = { ...value, ...patch }
    setValue(next)
  }
  const choose = (field: "country" | "district" | "state", id: string, records: LocationRecord[], selectedLabel?: string) => {
    const selected = records.find((item) => item.id === id)
    const relation = {
      [`${field}Id`]: id,
      [`${field}Name`]: selected?.name ?? selectedLabel ?? null
    }
    if (field === "country") update({ ...relation, stateId: null, stateName: null, districtId: null, districtName: null })
    else if (field === "state") update({ ...relation, districtId: null, districtName: null })
    else update(relation)
  }
  const createParent = async (kind: "country" | "district" | "state", name: string): Promise<WorkspaceLookupOption | undefined> => {
    if (kind === "state" && !value.countryId) {
      toast.error("Select a country before creating a state.")
      return undefined
    }
    if (kind === "district" && (!value.countryId || !value.stateId)) {
      toast.error("Select a country and state before creating a district.")
      return undefined
    }
    const payload = inlineCreateLocationPayload()
    payload.code = codeFromName(name)
    payload.name = name
    if (kind === "state" || kind === "district") {
      payload.countryId = value.countryId ?? null
      payload.countryName = value.countryName ?? null
    }
    if (kind === "district") {
      payload.stateId = value.stateId ?? null
      payload.stateName = value.stateName ?? null
    }
    try {
      const created = await createLocationRecord(locationDefinitions[kind].path, payload)
      await queryClient.invalidateQueries({ queryKey: ["core", "location", kind] })
      toast.success(`${locationDefinitions[kind].label} created`, { description: `${created.name} was selected.` })
      return { label: created.name, value: created.id }
    } catch (error) {
      toast.error(`Unable to create ${locationDefinitions[kind].label.toLowerCase()}`, {
        description: error instanceof Error ? error.message : "Please try again."
      })
      return undefined
    }
  }

  return (
    <form onSubmit={(event) => {
      event.preventDefault()
      onSubmit(definition.kind === "city" ? { ...value, code: value.code || codeFromName(value.name) } : value)
    }}>
      {error ? <WorkspaceFormBanner title="Unable to save">{error}</WorkspaceFormBanner> : null}
      <WorkspaceFormGrid columns={definition.kind === "city" ? 1 : 2}>
        {definition.kind === "pincode" ? (
          <>
            <Field label="Pincode" required><Input required value={value.pincode ?? ""} onChange={(event) => update({ code: event.target.value, name: event.target.value, pincode: event.target.value })} /></Field>
            <Field label="Area name" required><Input required value={value.areaName ?? ""} onChange={(event) => update({ areaName: event.target.value })} /></Field>
            <Field label="City"><Input value={value.cityName ?? ""} onChange={(event) => update({ cityName: event.target.value })} /></Field>
            <Field label="State"><Input value={value.stateName ?? ""} onChange={(event) => update({ stateName: event.target.value })} /></Field>
            <Field label="Country"><Input value={value.countryName ?? ""} onChange={(event) => update({ countryName: event.target.value })} /></Field>
          </>
        ) : (
          <>
            <Field label={`${definition.label} name`} required><Input required value={value.name} onChange={(event) => update({ name: event.target.value })} /></Field>
            {definition.kind !== "city" ? (
              <Field label={`${definition.label} code`} required><Input className="font-mono" required value={value.code} onChange={(event) => update({ code: event.target.value })} /></Field>
            ) : null}
          </>
        )}
        {definition.kind === "country" ? (
          <>
            <Field label="ISO 2"><Input maxLength={2} value={value.iso2 ?? ""} onChange={(event) => update({ iso2: event.target.value })} /></Field>
            <Field label="ISO 3"><Input maxLength={3} value={value.iso3 ?? ""} onChange={(event) => update({ iso3: event.target.value })} /></Field>
            <Field label="Dial code"><Input value={value.dialCode ?? ""} onChange={(event) => update({ dialCode: event.target.value })} /></Field>
            <Field label="Currency code"><Input maxLength={3} value={value.currencyCode ?? ""} onChange={(event) => update({ currencyCode: event.target.value })} /></Field>
          </>
        ) : null}
        {definition.kind === "state" ? (
          <>
            <SelectField label="Country" required value={value.countryId ?? ""} records={parents.countries} onChange={(id) => choose("country", id, parents.countries)} />
            <Field label="GST state code"><Input value={value.gstStateCode ?? ""} onChange={(event) => update({ gstStateCode: event.target.value })} /></Field>
            <Field label="Short code"><Input value={value.shortCode ?? ""} onChange={(event) => update({ shortCode: event.target.value })} /></Field>
          </>
        ) : null}
        {definition.kind === "district" ? (
          <>
            <SelectField label="Country" required value={value.countryId ?? ""} records={parents.countries} onChange={(id) => choose("country", id, parents.countries)} />
            <SelectField label="State" required value={value.stateId ?? ""} records={parents.states.filter((item) => !value.countryId || item.countryId === value.countryId)} onChange={(id) => choose("state", id, parents.states)} />
          </>
        ) : null}
        {definition.kind === "city" ? (
          <>
            <LookupField createLabel="Create country" label="Country" required value={value.countryId ?? ""} records={parents.countries} onChange={(id, label) => choose("country", id, parents.countries, label)} onCreate={(name) => createParent("country", name)} />
            <LookupField createLabel="Create state" disabled={!value.countryId} label="State" required value={value.stateId ?? ""} records={parents.states.filter((item) => item.countryId === value.countryId)} onChange={(id, label) => choose("state", id, parents.states, label)} onCreate={(name) => createParent("state", name)} />
            <LookupField createLabel="Create district" disabled={!value.stateId} label="District" required value={value.districtId ?? ""} records={parents.districts.filter((item) => item.stateId === value.stateId)} onChange={(id, label) => choose("district", id, parents.districts, label)} onCreate={(name) => createParent("district", name)} />
          </>
        ) : null}
        <Field label="Sort order"><Input min={0} type="number" value={value.sortOrder} onChange={(event) => update({ sortOrder: Number(event.target.value) })} /></Field>
        <WorkspaceFormField label="Active">
          <div className="flex h-11 items-center gap-3 rounded-md border border-border/80 px-3">
            <Switch checked={value.status === "active"} onCheckedChange={(checked) => update({ status: checked ? "active" : "inactive" })} />
            <span className="text-sm text-muted-foreground">{value.status === "active" ? "Available" : "Inactive"}</span>
          </div>
        </WorkspaceFormField>
      </WorkspaceFormGrid>
      <WorkspaceFormFooter
        className="mt-6 border-t pt-4"
        onCancel={onCancel}
        primaryLabel="Save"
        primaryLoading={loading}
        primaryProps={{ children: <><Save className="size-4" />Save</> }}
      />
    </form>
  )
}

function Field({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean }) {
  return <WorkspaceFormField label={label} {...(required ? { required: true } : {})}>{children}</WorkspaceFormField>
}

function SelectField({
  label,
  onChange,
  records,
  required,
  value
}: {
  label: string
  onChange: (value: string, label?: string) => void
  records: LocationRecord[]
  required?: boolean
  value: string
}) {
  return (
    <WorkspaceFormField label={label} {...(required ? { required: true } : {})}>
      <WorkspaceLookup
        allowTextValue={false}
        onValueChange={(next, option) => onChange(next, option?.label)}
        options={records.map((record) => ({ label: record.name, value: record.id }))}
        placeholder={`Select ${label.toLowerCase()}`}
        value={value}
      />
    </WorkspaceFormField>
  )
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
  createLabel: string
  disabled?: boolean
  label: string
  onChange: (value: string, label?: string) => void
  onCreate: (name: string) => Promise<WorkspaceLookupOption | undefined>
  records: LocationRecord[]
  required?: boolean
  value: string
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
        options={records.map((record) => ({ label: record.name, value: record.id }))}
        placeholder={disabled ? `Select ${label === "State" ? "country" : "state"} first` : `Search or select ${label.toLowerCase()}`}
        {...(required !== undefined ? { required } : {})}
        value={value}
      />
    </WorkspaceFormField>
  )
}

function toFormValue(kind: LocationKind, record: LocationRecord | null): LocationSavePayload {
  if (record) {
    const { id: _id, tenantId: _tenantId, uuid: _uuid, ...value } = record
    return value
  }
  return emptyLocationPayload(kind)
}

function emptyLocationPayload(kind?: LocationKind): LocationSavePayload {
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
  }
}

function codeFromName(name: string) {
  const code = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "")
  return code || `LOCATION-${Date.now()}`
}

function inlineCreateLocationPayload(): LocationSavePayload {
  return {
    ...emptyLocationPayload(),
    capital: "-",
    currencyCode: "-",
    dialCode: "-",
    gstStateCode: "-",
    iso2: "-",
    iso3: "-",
    numericCode: "-",
    shortCode: "-"
  }
}
