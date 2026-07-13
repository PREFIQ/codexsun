import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import {
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormFooter,
  WorkspaceFormGrid,
  WorkspaceUpsertDialog
} from "@codexsun/ui/workspace/upsert";
import { stateSchema } from "./state.schema";
import type { CountryOption, StateRecord, StateSavePayload } from "./state.types";

const emptyState: StateSavePayload = {
  countryId: 0,
  code: "",
  name: "",
  sortOrder: 1000,
  status: "active"
};

export function StateForm({
  countries,
  error,
  loading,
  onCancel,
  onSubmit,
  open,
  record
}: {
  countries: CountryOption[];
  error?: string;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (payload: StateSavePayload) => void;
  open: boolean;
  record: StateRecord | null;
}) {
  return (
    <WorkspaceUpsertDialog
      description="Enter the state details and save without leaving the list."
      onClose={onCancel}
      open={open}
      title={`${record ? "Edit" : "New"} state`}
    >
      <StateFormBody
        key={`${record?.id ?? "new"}:${open}`}
        countries={countries}
        {...(error ? { error } : {})}
        initialValue={record ? toPayload(record) : emptyState}
        loading={loading}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    </WorkspaceUpsertDialog>
  );
}

function StateFormBody({
  countries,
  error,
  initialValue,
  loading,
  onCancel,
  onSubmit
}: {
  countries: CountryOption[];
  error?: string;
  initialValue: StateSavePayload;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (payload: StateSavePayload) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [validationError, setValidationError] = useState("");
  const shownError = validationError || error;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = stateSchema.safeParse(value);
        if (!parsed.success) {
          setValidationError(parsed.error.issues[0]?.message ?? "Check the state details.");
          return;
        }
        setValidationError("");
        onSubmit(parsed.data);
      }}
    >
      {shownError ? (
        <WorkspaceFormBanner title="Unable to save">{shownError}</WorkspaceFormBanner>
      ) : null}
      <WorkspaceFormGrid columns={1}>
        <WorkspaceFormField label="State name" required>
          <Input
            autoFocus
            maxLength={200}
            required
            value={value.name}
            onChange={(event) => setValue((current) => ({ ...current, name: event.target.value }))}
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="State code" required>
          <Input
            className="font-mono uppercase"
            maxLength={80}
            required
            value={value.code}
            onChange={(event) =>
              setValue((current) => ({ ...current, code: event.target.value.toUpperCase() }))
            }
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="Country" required>
          <WorkspaceLookup
            allowTextValue={false}
            onValueChange={(countryId) =>
              setValue((current) => ({ ...current, countryId: Number(countryId) }))
            }
            options={countries
              .filter((country) => country.status === "active")
              .map((country) => ({
                label: `${country.name} (${country.code})`,
                value: String(country.id)
              }))}
            placeholder="Select country"
            required
            value={value.countryId ? String(value.countryId) : ""}
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="Sort order">
          <Input
            min={0}
            type="number"
            value={value.sortOrder}
            onChange={(event) =>
              setValue((current) => ({ ...current, sortOrder: Number(event.target.value) }))
            }
          />
        </WorkspaceFormField>
        <div className="flex h-11 items-center gap-3 rounded-md border border-border/80 px-3">
          <span className="text-sm font-medium">Active</span>
          <Switch
            aria-label="State active status"
            checked={value.status === "active"}
            className="ml-auto"
            onCheckedChange={(checked) =>
              setValue((current) => ({ ...current, status: checked ? "active" : "inactive" }))
            }
          />
        </div>
      </WorkspaceFormGrid>
      <WorkspaceFormFooter
        className="mt-6 border-t pt-4"
        onCancel={onCancel}
        primaryLabel="Save state"
        primaryLoading={loading}
        primaryProps={{
          children: (
            <>
              <Save className="size-4" />
              Save state
            </>
          )
        }}
      />
    </form>
  );
}

export function StateView({
  onClose,
  record
}: {
  onClose: () => void;
  record: StateRecord | null;
}) {
  return (
    <WorkspaceUpsertDialog onClose={onClose} open={record !== null} title="State details">
      {record ? (
        <div className="space-y-4">
          <WorkspaceFormGrid columns={1}>
            <WorkspaceFormField label="State name">
              <Input readOnly value={record.name} />
            </WorkspaceFormField>
            <WorkspaceFormField label="State code">
              <Input className="font-mono" readOnly value={record.code} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Country">
              <Input readOnly value={record.countryName} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Sort order">
              <Input readOnly value={record.sortOrder} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Status">
              <Input readOnly value={record.status === "active" ? "Active" : "Inactive"} />
            </WorkspaceFormField>
          </WorkspaceFormGrid>
          <Button onClick={onClose} type="button" variant="outline">
            Close
          </Button>
        </div>
      ) : null}
    </WorkspaceUpsertDialog>
  );
}

function toPayload(record: StateRecord): StateSavePayload {
  return {
    countryId: record.countryId,
    code: record.code,
    name: record.name,
    sortOrder: record.sortOrder,
    status: record.status
  };
}
