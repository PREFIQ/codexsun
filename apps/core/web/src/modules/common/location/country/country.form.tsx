import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import {
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormFooter,
  WorkspaceFormGrid,
  WorkspaceUpsertDialog
} from "@codexsun/ui/workspace/upsert";
import { countrySchema } from "./country.schema";
import type { CountryRecord, CountrySavePayload } from "./country.types";

const emptyCountry: CountrySavePayload = {
  code: "",
  name: "",
  sortOrder: 1000,
  status: "active"
};

export function CountryForm({
  error,
  loading,
  onCancel,
  onSubmit,
  open,
  record
}: {
  error?: string;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (payload: CountrySavePayload) => void;
  open: boolean;
  record: CountryRecord | null;
}) {
  return (
    <WorkspaceUpsertDialog
      description="Enter the country details and save without leaving the list."
      onClose={onCancel}
      open={open}
      title={`${record ? "Edit" : "New"} country`}
    >
      <CountryFormBody
        key={`${record?.id ?? "new"}:${open}`}
        {...(error ? { error } : {})}
        initialValue={record ? toPayload(record) : emptyCountry}
        loading={loading}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    </WorkspaceUpsertDialog>
  );
}

function CountryFormBody({
  error,
  initialValue,
  loading,
  onCancel,
  onSubmit
}: {
  error?: string;
  initialValue: CountrySavePayload;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (payload: CountrySavePayload) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [validationError, setValidationError] = useState("");
  const shownError = validationError || error;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = countrySchema.safeParse(value);
        if (!parsed.success) {
          setValidationError(parsed.error.issues[0]?.message ?? "Check the country details.");
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
        <WorkspaceFormField label="Country name" required>
          <Input
            autoFocus
            maxLength={200}
            required
            value={value.name}
            onChange={(event) => setValue((current) => ({ ...current, name: event.target.value }))}
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="Country code" required>
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
            aria-label="Country active status"
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
        primaryLabel="Save country"
        primaryLoading={loading}
        primaryProps={{
          children: (
            <>
              <Save className="size-4" />
              Save country
            </>
          )
        }}
      />
    </form>
  );
}

export function CountryView({
  onClose,
  record
}: {
  onClose: () => void;
  record: CountryRecord | null;
}) {
  return (
    <WorkspaceUpsertDialog onClose={onClose} open={record !== null} title="Country details">
      {record ? (
        <div className="space-y-4">
          <WorkspaceFormGrid columns={1}>
            <WorkspaceFormField label="Country name">
              <Input readOnly value={record.name} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Country code">
              <Input className="font-mono" readOnly value={record.code} />
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

function toPayload(record: CountryRecord): CountrySavePayload {
  return {
    code: record.code,
    name: record.name,
    sortOrder: record.sortOrder,
    status: record.status
  };
}
