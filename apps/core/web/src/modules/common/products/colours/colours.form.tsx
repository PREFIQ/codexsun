import { useState } from "react";
import { Save } from "lucide-react";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import {
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormFooter,
  WorkspaceFormGrid,
  WorkspaceUpsertDialog
} from "@codexsun/ui/workspace/upsert";
import { coloursSchema } from "./colours.schema";
import type { ColoursRecord, ColoursSavePayload } from "./colours.types";

const emptyColours: ColoursSavePayload = {
  name: "",
  isActive: true,
  sortOrder: 1000
};

export function ColoursForm({
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
  onSubmit: (payload: ColoursSavePayload) => void;
  open: boolean;
  record: ColoursRecord | null;
}) {
  return (
    <WorkspaceUpsertDialog
      description="Enter the colour details and save without leaving the list."
      onClose={onCancel}
      open={open}
      title={`${record ? "Edit" : "New"} colour`}
    >
      <ColoursFormBody
        key={`${record?.id ?? "new"}:${open}`}
        {...(error ? { error } : {})}
        initialValue={record ? toPayload(record) : emptyColours}
        loading={loading}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    </WorkspaceUpsertDialog>
  );
}

function ColoursFormBody({
  error,
  initialValue,
  loading,
  onCancel,
  onSubmit
}: {
  error?: string;
  initialValue: ColoursSavePayload;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (payload: ColoursSavePayload) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [validationError, setValidationError] = useState("");
  const shownError = validationError || error;
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = coloursSchema.safeParse(value);
        if (!parsed.success) {
          setValidationError(parsed.error.issues[0]?.message ?? "Check the details.");
          return;
        }
        setValidationError("");
        onSubmit(value);
      }}
    >
      {shownError ? (
        <WorkspaceFormBanner title="Unable to save">{shownError}</WorkspaceFormBanner>
      ) : null}
      <WorkspaceFormGrid columns={1}>
        <WorkspaceFormField label="Name">
          <Input
            autoFocus
            type="color"
            value={value.name}
            onChange={(event) => setValue((current) => ({ ...current, name: event.target.value }))}
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
            aria-label="Colour active status"
            checked={value.isActive}
            className="ml-auto"
            onCheckedChange={(checked) =>
              setValue((current) => ({ ...current, isActive: checked }))
            }
          />
        </div>
      </WorkspaceFormGrid>
      <WorkspaceFormFooter
        className="mt-6 border-t pt-4"
        onCancel={onCancel}
        primaryLabel="Save colour"
        primaryLoading={loading}
        primaryProps={{
          children: (
            <>
              <Save className="size-4" />
              Save colour
            </>
          )
        }}
      />
    </form>
  );
}
function toPayload(record: ColoursRecord): ColoursSavePayload {
  return { name: record.name, isActive: record.isActive, sortOrder: record.sortOrder };
}
