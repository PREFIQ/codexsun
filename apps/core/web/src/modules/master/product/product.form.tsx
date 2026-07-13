import { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import {
  WorkspaceFormActions,
  WorkspaceFormBanner,
  WorkspaceFormBody,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceFormSurface
} from "@codexsun/ui/workspace/upsert";
import { productSchema } from "./product.schema";
import type { ProductRecord, ProductSavePayload } from "./product.types";
export function ProductForm({
  error,
  loading,
  onBack,
  onSubmit,
  record
}: {
  error: string;
  loading: boolean;
  onBack: () => void;
  onSubmit: (payload: ProductSavePayload) => void;
  record: ProductRecord | null;
}) {
  const [validationError, setValidationError] = useState("");
  const [form, setForm] = useState<ProductSavePayload>(() =>
    record
      ? { ...record }
      : { name: "", openingRate: 0, openingStock: 0, isActive: true, status: "active" }
  );
  const field = (key: keyof ProductSavePayload, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{record ? "Edit Product" : "New Product"}</h1>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>
      <WorkspaceFormSurface>
        <WorkspaceFormBody>
          <WorkspaceFormGrid columns={2}>
            <Text
              label="Product name"
              value={form.name}
              onChange={(value) => field("name", value)}
            />
            {(["typeId", "productCategoryId", "hsnCodeId", "unitId", "taxId"] as const).map(
              (key) => (
                <NumberField
                  key={key}
                  label={labels[key]}
                  value={form[key]}
                  onChange={(value) => field(key, value)}
                />
              )
            )}
            <NumberField
              label="Opening quantity"
              value={form.openingStock}
              onChange={(value) => field("openingStock", value ?? 0)}
            />
            <NumberField
              label="Opening price"
              value={form.openingRate}
              onChange={(value) => field("openingRate", value ?? 0)}
            />
            <WorkspaceFormField label="Active">
              <div className="flex h-11 items-center justify-between rounded-md border px-3">
                <span className="text-sm">Available for use</span>
                <Switch
                  checked={form.isActive !== false}
                  onCheckedChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      isActive: value,
                      status: value ? "active" : "inactive"
                    }))
                  }
                />
              </div>
            </WorkspaceFormField>
          </WorkspaceFormGrid>
          {validationError || error ? (
            <WorkspaceFormBanner title="Unable to save">
              {validationError || error}
            </WorkspaceFormBanner>
          ) : null}
        </WorkspaceFormBody>
        <WorkspaceFormActions>
          <Button
            disabled={loading || !form.name.trim()}
            onClick={() => {
              const result = productSchema.safeParse(form);
              if (!result.success) {
                setValidationError(result.error.issues[0]?.message ?? "Check the product details.");
                return;
              }
              setValidationError("");
              onSubmit(form);
            }}
          >
            <Save className="size-4" />
            Save
          </Button>
          <Button variant="outline" onClick={onBack}>
            <X className="size-4" />
            Cancel
          </Button>
        </WorkspaceFormActions>
      </WorkspaceFormSurface>
    </section>
  );
}
const labels = {
  typeId: "Product type ID",
  productCategoryId: "Category ID",
  hsnCodeId: "HSN code ID",
  unitId: "Unit ID",
  taxId: "GST tax ID"
};
function Text({
  label,
  value,
  onChange
}: {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
}) {
  return (
    <WorkspaceFormField label={label} required>
      <Input value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />
    </WorkspaceFormField>
  );
}
function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: unknown;
  onChange: (value: number | null) => void;
}) {
  return (
    <WorkspaceFormField label={label}>
      <Input
        type="number"
        value={value == null ? "" : String(value)}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      />
    </WorkspaceFormField>
  );
}
