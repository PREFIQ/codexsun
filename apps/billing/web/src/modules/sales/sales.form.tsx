import { useMemo, useState } from "react";
import { Save, Trash2, X } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceAnimatedTabs, type WorkspaceAnimatedTab } from "@codexsun/ui/workspace/animated-tabs";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceFormBanner, WorkspaceFormField, WorkspaceFormGrid, WorkspaceFormPanel, WorkspaceUpsertPage } from "@codexsun/ui/workspace/upsert";
import { formatMoney } from "./sales.services";
import { salesSchema } from "./sales.schema";
import { createEmptySale, createEmptySaleItem, type Sale, type SaleLineItemInput, type SaleSavePayload } from "./sales.types";

export function SalesUpsertPage({
  errorMessage,
  loading,
  onBack,
  onSubmit,
  sale,
}: {
  errorMessage: string;
  loading: boolean;
  onBack: () => void;
  onSubmit: (payload: SaleSavePayload) => void;
  sale: Sale | null;
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [banner, setBanner] = useState("");
  const [form, setForm] = useState<SaleSavePayload>(() => sale ? toSalePayload(sale) : createEmptySale());
  const totals = useMemo(() => buildDraftTotals(form), [form]);
  const isEdit = Boolean(sale);

  const tabs: WorkspaceAnimatedTab[] = [
    {
      label: "Details",
      value: "details",
      content: (
        <WorkspaceFormPanel
          footer={
            <>
              <Button type="button" className="rounded-md" onClick={() => setActiveTab("items")}>Next</Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={onBack}>
                <X className="size-4" />
                Cancel
              </Button>
            </>
          }
        >
          <WorkspaceFormGrid columns={2}>
            <WorkspaceFormField label="Invoice number" required>
              <Input className="h-11 rounded-md font-mono uppercase" value={form.invoiceNumber} onChange={(event) => updateField("invoiceNumber", event.target.value.toUpperCase())} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Invoice date" required>
              <WorkspaceDatePicker value={form.issuedOn} onValueChange={(value) => updateField("issuedOn", value)} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Customer name" required>
              <Input className="h-11 rounded-md" value={form.customerName} onChange={(event) => updateField("customerName", event.target.value)} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Customer email" required>
              <Input className="h-11 rounded-md" value={form.customerEmail} onChange={(event) => updateField("customerEmail", event.target.value)} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Customer phone" required>
              <Input className="h-11 rounded-md" value={form.customerPhone} onChange={(event) => updateField("customerPhone", event.target.value)} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Currency" required>
              <Input className="h-11 rounded-md font-mono uppercase" maxLength={3} value={form.currencyCode} onChange={(event) => updateField("currencyCode", event.target.value.toUpperCase())} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Billing address" required className="md:col-span-2">
              <Textarea className="min-h-28 rounded-md" value={form.billingAddress} onChange={(event) => updateField("billingAddress", event.target.value)} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Shipping address" required className="md:col-span-2">
              <Textarea className="min-h-28 rounded-md" value={form.shippingAddress} onChange={(event) => updateField("shippingAddress", event.target.value)} />
            </WorkspaceFormField>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
      ),
    },
    {
      label: "Items",
      value: "items",
      content: (
        <WorkspaceFormPanel
          footer={
            <>
              <Button type="button" className="rounded-md" onClick={() => setActiveTab("notes")}>Next</Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={() => setActiveTab("details")}>Back</Button>
            </>
          }
          title="Line items"
          description="Build the sale rows that drive totals and the print document."
        >
          <div className="space-y-4">
            {form.items.map((item, index) => (
              <div key={`item-${index}`} className="rounded-md border border-border/70 bg-background p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-foreground">Item {index + 1}</div>
                  <Button type="button" variant="outline" className="h-8 rounded-md" disabled={form.items.length === 1} onClick={() => removeItem(index)}>
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                </div>
                <WorkspaceFormGrid columns={2}>
                  <WorkspaceFormField label="Description" required className="md:col-span-2">
                    <Input className="h-11 rounded-md" value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="HSN code" required>
                    <Input className="h-11 rounded-md font-mono uppercase" value={item.hsnCode} onChange={(event) => updateItem(index, "hsnCode", event.target.value.toUpperCase())} />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Unit" required>
                    <Input className="h-11 rounded-md font-mono uppercase" value={item.unit} onChange={(event) => updateItem(index, "unit", event.target.value.toUpperCase())} />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Quantity" required>
                    <Input className="h-11 rounded-md" type="number" min={0} step="0.001" value={item.quantity} onChange={(event) => updateItem(index, "quantity", Number(event.target.value) || 0)} />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Rate" required>
                    <Input className="h-11 rounded-md" type="number" min={0} step="0.01" value={item.rate} onChange={(event) => updateItem(index, "rate", Number(event.target.value) || 0)} />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Tax rate (%)" required>
                    <Input className="h-11 rounded-md" type="number" min={0} step="0.01" value={item.taxRate} onChange={(event) => updateItem(index, "taxRate", Number(event.target.value) || 0)} />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Line total">
                    <div className="flex h-11 items-center rounded-md border border-border/70 bg-muted/20 px-3 text-sm font-medium">
                      {formatMoney(calculateItemTotal(item), form.currencyCode)}
                    </div>
                  </WorkspaceFormField>
                </WorkspaceFormGrid>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/20 px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Draft totals</div>
                <div className="text-xs text-muted-foreground">These totals update from the current line items.</div>
              </div>
              <Button type="button" variant="outline" className="rounded-md" onClick={addItem}>Add item</Button>
            </div>
            <div className="grid gap-2 rounded-md border border-border/70 bg-card/95 p-4 text-sm">
              <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal, form.currencyCode)} />
              <SummaryRow label="Tax" value={formatMoney(totals.taxAmount, form.currencyCode)} />
              <SummaryRow label="Round off" value={formatMoney(form.roundOff, form.currencyCode)} />
              <SummaryRow label="Grand total" strong value={formatMoney(totals.amount, form.currencyCode)} />
            </div>
          </div>
        </WorkspaceFormPanel>
      ),
    },
    {
      label: "Notes",
      value: "notes",
      content: (
        <WorkspaceFormPanel
          footer={
            <>
              <Button type="submit" disabled={loading} className="rounded-md">
                <Save className="size-4" />
                {loading ? "Saving..." : isEdit ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={() => setActiveTab("items")}>Back</Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={onBack}>
                <X className="size-4" />
                Cancel
              </Button>
            </>
          }
          title="Notes and totals"
          description="Finalize invoice notes, status, and round off before saving."
        >
          <WorkspaceFormGrid columns={2}>
            <WorkspaceFormField label="Status" required>
              <WorkspaceSelect
                ariaLabel="Status"
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Confirmed", value: "confirmed" },
                  { label: "Cancelled", value: "cancelled" },
                ]}
                value={form.status}
                onValueChange={(value) => updateField("status", value as SaleSavePayload["status"])}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Round off">
              <Input className="h-11 rounded-md" type="number" step="0.01" value={form.roundOff} onChange={(event) => updateField("roundOff", Number(event.target.value) || 0)} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Notes" className="md:col-span-2">
              <Textarea className="min-h-32 rounded-md" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
            </WorkspaceFormField>
          </WorkspaceFormGrid>
          <div className="mt-4 grid gap-2 rounded-md border border-border/70 bg-muted/20 p-4 text-sm">
            <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal, form.currencyCode)} />
            <SummaryRow label="Tax" value={formatMoney(totals.taxAmount, form.currencyCode)} />
            <SummaryRow label="Grand total" strong value={formatMoney(totals.amount, form.currencyCode)} />
          </div>
        </WorkspaceFormPanel>
      ),
    },
  ];

  function updateField<K extends keyof SaleSavePayload>(key: K, value: SaleSavePayload[K]) {
    setBanner("");
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateItem<K extends keyof SaleLineItemInput>(index: number, key: K, value: SaleLineItemInput[K]) {
    setBanner("");
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
    }));
  }

  function addItem() {
    setForm((current) => ({ ...current, items: [...current.items, createEmptySaleItem()] }));
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  return (
    <WorkspaceUpsertPage
      title={isEdit ? "Edit sale" : "New sale"}
      description="Create and update billing sales with the same workspace rhythm as the admin modules."
      action={
        <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
          <X className="size-4" />
          Cancel
        </Button>
      }
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = salesSchema.safeParse(form);
          if (!parsed.success) {
            setBanner(parsed.error.issues[0]?.message ?? "Please complete the required sales fields.");
            return;
          }
          setBanner("");
          onSubmit(parsed.data);
        }}
      >
        <div className="rounded-md border border-border/70 bg-card/95 p-5 shadow-sm">
          {banner || errorMessage ? (
            <WorkspaceFormBanner title={banner ? "Missing required field" : "Could not save"}>
              {banner || errorMessage}
            </WorkspaceFormBanner>
          ) : null}
          <WorkspaceAnimatedTabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
        </div>
      </form>
    </WorkspaceUpsertPage>
  );
}

function toSalePayload(sale: Sale): SaleSavePayload {
  return {
    billingAddress: sale.billingAddress,
    currencyCode: sale.currencyCode,
    customerEmail: sale.customerEmail,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    invoiceNumber: sale.invoiceNumber,
    issuedOn: sale.issuedOn,
    items: sale.items.map((item) => ({
      description: item.description,
      hsnCode: item.hsnCode,
      quantity: item.quantity,
      rate: item.rate,
      taxRate: item.taxRate,
      unit: item.unit,
    })),
    notes: sale.notes,
    roundOff: sale.roundOff,
    shippingAddress: sale.shippingAddress,
    status: sale.status,
  };
}

function calculateItemTotal(item: SaleLineItemInput) {
  const subtotal = Number(item.quantity || 0) * Number(item.rate || 0);
  const tax = subtotal * Number(item.taxRate || 0) / 100;
  return roundMoney(subtotal + tax);
}

function buildDraftTotals(form: SaleSavePayload) {
  const subtotal = roundMoney(form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0));
  const taxAmount = roundMoney(form.items.reduce((sum, item) => sum + ((Number(item.quantity || 0) * Number(item.rate || 0)) * Number(item.taxRate || 0) / 100), 0));
  return {
    amount: roundMoney(subtotal + taxAmount + Number(form.roundOff || 0)),
    subtotal,
    taxAmount,
  };
}

function SummaryRow({ label, strong = false, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className={strong ? "grid grid-cols-[1fr_auto] gap-4 font-semibold" : "grid grid-cols-[1fr_auto] gap-4"}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
