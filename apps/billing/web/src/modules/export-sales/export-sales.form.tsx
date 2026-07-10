import { useMemo, useState, type ReactNode } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceAnimatedTabs, type WorkspaceAnimatedTab } from "@codexsun/ui/workspace/animated-tabs";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceFormBanner, WorkspaceFormField, WorkspaceFormGrid, WorkspaceFormPanel, WorkspaceUpsertPage } from "@codexsun/ui/workspace/upsert";
import { formatDocumentNumber, type BillingDocumentLayoutSettings, type BillingDocumentNumberSettings } from "../settings/settings.types";
import { exportSalesSchema } from "./export-sales.schema";
import { formatMoney } from "./export-sales.services";
import { createEmptyExportSale, createEmptyExportSaleItem, type ExportSale, type ExportSaleLineItemInput, type ExportSaleSavePayload } from "./export-sales.types";

export function ExportSalesUpsertPage({
  errorMessage,
  loading,
  onBack,
  onSubmit,
  numbering,
  sale,
  settings,
}: {
  errorMessage: string;
  loading: boolean;
  onBack: () => void;
  onSubmit: (payload: ExportSaleSavePayload) => void;
  numbering: BillingDocumentNumberSettings;
  sale: ExportSale | null;
  settings: BillingDocumentLayoutSettings;
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [banner, setBanner] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftItem, setDraftItem] = useState<ExportSaleLineItemInput>(createEmptyExportSaleItem());
  const [form, setForm] = useState<ExportSaleSavePayload>(() =>
    sale
      ? toExportSalePayload(sale)
      : {
          ...createEmptyExportSale(),
          invoiceNumber: numbering.automatic ? formatDocumentNumber(numbering) : createEmptyExportSale().invoiceNumber,
        }
  );
  const totals = useMemo(() => buildDraftTotals(form), [form]);
  const isEdit = Boolean(sale);

  const tabs: WorkspaceAnimatedTab[] = [
    {
      label: "Details",
      value: "details",
      content: (
        <WorkspaceFormPanel>
          <WorkspaceFormGrid columns={2}>
            <WorkspaceFormField label="Customer name" required>
              <Input className="h-11 rounded-md" value={form.customerName} onChange={(event) => updateField("customerName", event.target.value)} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Export sales number" required>
              <Input
                className="h-11 rounded-md font-mono uppercase"
                disabled={!isEdit && numbering.automatic}
                value={form.invoiceNumber}
                onChange={(event) => updateField("invoiceNumber", event.target.value.toUpperCase())}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Work order no">
              <Input className="h-11 rounded-md" value={form.workOrderNo} onChange={(event) => updateField("workOrderNo", event.target.value)} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Date" required>
              <WorkspaceDatePicker value={form.issuedOn} onValueChange={(value) => updateField("issuedOn", value)} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Export sales tax type" required className="md:col-span-2">
              <WorkspaceSelect
                ariaLabel="Export sales tax type"
                options={[
                  { label: "IGST", value: "IGST" },
                  { label: "CGST + SGST", value: "CGST + SGST" },
                ]}
                value={form.taxType}
                onValueChange={(value) => updateField("taxType", value)}
              />
            </WorkspaceFormField>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
      ),
    },
    {
      label: "Address",
      value: "address",
      content: (
        <WorkspaceFormPanel>
          <WorkspaceFormGrid columns={2}>
            <WorkspaceFormField label="Customer email" required>
              <Input className="h-11 rounded-md" value={form.customerEmail} onChange={(event) => updateField("customerEmail", event.target.value)} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Customer phone" required>
              <Input className="h-11 rounded-md" value={form.customerPhone} onChange={(event) => updateField("customerPhone", event.target.value)} />
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
        <WorkspaceFormPanel title="Export Sales Items">
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_0.7fr_0.7fr_0.45fr_0.45fr_auto]">
              <Field label="Product name">
                <Input className="h-11 rounded-md" value={draftItem.productName} onChange={(event) => updateDraft("productName", event.target.value)} />
              </Field>
              <Field label="Description">
                <Input className="h-11 rounded-md" value={draftItem.description} onChange={(event) => updateDraft("description", event.target.value)} />
              </Field>
              {settings.useColour ? (
                <Field label="Colour">
                  <Input className="h-11 rounded-md" value={draftItem.colour} onChange={(event) => updateDraft("colour", event.target.value)} />
                </Field>
              ) : null}
              {settings.useSize ? (
                <Field label="Size">
                  <Input className="h-11 rounded-md" value={draftItem.size} onChange={(event) => updateDraft("size", event.target.value)} />
                </Field>
              ) : null}
              <Field label="Quantity">
                <Input className="h-11 rounded-md text-right" type="number" min={0} step="0.001" value={draftItem.quantity} onChange={(event) => updateDraft("quantity", Number(event.target.value) || 0)} />
              </Field>
              <Field label="Price">
                <Input className="h-11 rounded-md text-right" type="number" min={0} step="0.01" value={draftItem.rate} onChange={(event) => updateDraft("rate", Number(event.target.value) || 0)} />
              </Field>
              <div className="flex items-end">
                <Button type="button" className="h-11 rounded-md px-4" onClick={addOrUpdateItem}>
                  <Plus className="size-4" />
                  {editingIndex === null ? "Add" : "Update"}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <Field label="HSN code">
                <Input className="h-11 rounded-md uppercase" value={draftItem.hsnCode} onChange={(event) => updateDraft("hsnCode", event.target.value.toUpperCase())} />
              </Field>
              <Field label="Unit">
                <Input className="h-11 rounded-md uppercase" value={draftItem.unit} onChange={(event) => updateDraft("unit", event.target.value.toUpperCase())} />
              </Field>
              <Field label="GST %">
                <Input className="h-11 rounded-md text-right" type="number" min={0} step="0.01" value={draftItem.taxRate} onChange={(event) => updateDraft("taxRate", Number(event.target.value) || 0)} />
              </Field>
              <Field label="Line total">
                <div className="flex h-11 items-center justify-end rounded-md border border-border/70 bg-muted/20 px-3 text-sm font-medium">
                  {formatMoney(calculateItemTotal(draftItem), form.currencyCode)}
                </div>
              </Field>
            </div>

            <div className="overflow-x-auto rounded-md border border-border/70">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">#</th>
                    <th className="px-3 py-3 text-left font-medium">Particulars</th>
                    <th className="px-3 py-3 text-left font-medium">HSN Code</th>
                    <th className="px-3 py-3 text-left font-medium">Colour</th>
                    <th className="px-3 py-3 text-left font-medium">Size</th>
                    <th className="px-3 py-3 text-right font-medium">Qty</th>
                    <th className="px-3 py-3 text-right font-medium">Rate</th>
                    <th className="px-3 py-3 text-left font-medium">Unit</th>
                    <th className="px-3 py-3 text-right font-medium">Taxable</th>
                    <th className="px-3 py-3 text-right font-medium">GST %</th>
                    <th className="px-3 py-3 text-right font-medium">IGST</th>
                    <th className="px-3 py-3 text-right font-medium">Total</th>
                    <th className="px-3 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, index) => {
                    const taxable = roundMoney(item.quantity * item.rate);
                    const gstAmount = roundMoney(taxable * item.taxRate / 100);
                    return (
                      <tr key={`export-sale-item-${index}`} className="border-t border-border/70">
                        <td className="px-3 py-3">{index + 1}</td>
                        <td className="px-3 py-3">
                          <div className="font-medium">{item.productName}</div>
                          {item.description ? <div className="text-xs text-muted-foreground">{item.description}</div> : null}
                        </td>
                        <td className="px-3 py-3">{item.hsnCode || "-"}</td>
                        <td className="px-3 py-3">{item.colour || "-"}</td>
                        <td className="px-3 py-3">{item.size || "-"}</td>
                        <td className="px-3 py-3 text-right">{item.quantity}</td>
                        <td className="px-3 py-3 text-right">{formatMoney(item.rate, form.currencyCode)}</td>
                        <td className="px-3 py-3">{item.unit}</td>
                        <td className="px-3 py-3 text-right">{formatMoney(taxable, form.currencyCode)}</td>
                        <td className="px-3 py-3 text-right">{item.taxRate}%</td>
                        <td className="px-3 py-3 text-right">{formatMoney(gstAmount, form.currencyCode)}</td>
                        <td className="px-3 py-3 text-right font-semibold">{formatMoney(taxable + gstAmount, form.currencyCode)}</td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" className="h-8 rounded-md px-2" onClick={() => editItem(index)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button type="button" variant="outline" className="h-8 rounded-md px-2 text-destructive" onClick={() => removeItem(index)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {form.items.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-3 py-6 text-center text-sm text-muted-foreground">
                        Add at least one export sales item.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-full max-w-md space-y-3">
              <TotalsRow label="Taxable amount" value={formatMoney(totals.subtotal, form.currencyCode)} />
              <TotalsRow label="GST total" value={formatMoney(totals.taxAmount, form.currencyCode)} />
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                <span className="text-base text-foreground">Round off</span>
                <span className="text-foreground">:</span>
                <Input className="h-11 rounded-md text-right" type="number" step="0.01" value={form.roundOff} onChange={(event) => updateField("roundOff", Number(event.target.value) || 0)} />
              </div>
              <TotalsRow label="Grand total" strong value={formatMoney(totals.amount, form.currencyCode)} />
            </div>
          </div>
        </WorkspaceFormPanel>
      ),
    },
    {
      label: "Notes",
      value: "notes",
      content: (
        <WorkspaceFormPanel>
          <WorkspaceFormGrid columns={2}>
            <WorkspaceFormField label="Status" required>
              <WorkspaceSelect
                ariaLabel="Export sales status"
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Confirmed", value: "confirmed" },
                  { label: "Cancelled", value: "cancelled" },
                ]}
                value={form.status}
                onValueChange={(value) => updateField("status", value as ExportSaleSavePayload["status"])}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Currency" required>
              <Input className="h-11 rounded-md font-mono uppercase" maxLength={3} value={form.currencyCode} onChange={(event) => updateField("currencyCode", event.target.value.toUpperCase())} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Notes" className="md:col-span-2">
              <Textarea className="min-h-32 rounded-md" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
            </WorkspaceFormField>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
      ),
    },
  ];

  function updateField<K extends keyof ExportSaleSavePayload>(key: K, value: ExportSaleSavePayload[K]) {
    setBanner("");
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateDraft<K extends keyof ExportSaleLineItemInput>(key: K, value: ExportSaleLineItemInput[K]) {
    setBanner("");
    setDraftItem((current) => ({ ...current, [key]: value }));
  }

  function addOrUpdateItem() {
    if (!draftItem.productName.trim()) {
      setBanner("Product name is required.");
      setActiveTab("items");
      return;
    }
    if (!draftItem.hsnCode.trim()) {
      setBanner("HSN code is required.");
      setActiveTab("items");
      return;
    }
    if (draftItem.quantity <= 0) {
      setBanner("Quantity must be greater than zero.");
      setActiveTab("items");
      return;
    }

    setForm((current) => {
      const nextItems = [...current.items];
      if (editingIndex === null) nextItems.push({ ...draftItem });
      else nextItems[editingIndex] = { ...draftItem };
      return { ...current, items: nextItems };
    });
    setDraftItem(createEmptyExportSaleItem());
    setEditingIndex(null);
  }

  function editItem(index: number) {
    setDraftItem({ ...createEmptyExportSaleItem(), ...form.items[index] });
    setEditingIndex(index);
  }

  function removeItem(index: number) {
    setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
    if (editingIndex === index) {
      setDraftItem(createEmptyExportSaleItem());
      setEditingIndex(null);
    }
  }

  return (
    <WorkspaceUpsertPage
      title={isEdit ? "Edit export sales" : "New export sales"}
      description="Create and update export sales invoices in the same billing tone as the live entry desk."
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
          const parsed = exportSalesSchema.safeParse(form);
          if (!parsed.success) {
            setBanner(parsed.error.issues[0]?.message ?? "Please complete the required export sales fields.");
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
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
            <Button type="submit" disabled={loading} className="rounded-md">
              <Save className="size-4" />
              {loading ? "Saving..." : isEdit ? "Update" : "Save"}
            </Button>
            <Button type="button" variant="outline" className="rounded-md" onClick={onBack}>
              <X className="size-4" />
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </WorkspaceUpsertPage>
  );
}

function toExportSalePayload(sale: ExportSale): ExportSaleSavePayload {
  return {
    billingAddress: sale.billingAddress,
    currencyCode: sale.currencyCode,
    customerEmail: sale.customerEmail,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    invoiceNumber: sale.invoiceNumber,
    issuedOn: sale.issuedOn,
    items: sale.items.map((item) => ({
      colour: item.colour,
      dcNo: item.dcNo,
      description: item.description,
      hsnCode: item.hsnCode,
      poNo: item.poNo,
      productName: item.productName,
      quantity: item.quantity,
      rate: item.rate,
      size: item.size,
      taxRate: item.taxRate,
      unit: item.unit,
    })),
    notes: sale.notes,
    roundOff: sale.roundOff,
    shippingAddress: sale.shippingAddress,
    status: sale.status,
    taxType: sale.taxType,
    workOrderNo: sale.workOrderNo,
  };
}

function calculateItemTotal(item: ExportSaleLineItemInput) {
  const taxable = roundMoney(Number(item.quantity || 0) * Number(item.rate || 0));
  const tax = roundMoney(taxable * Number(item.taxRate || 0) / 100);
  return roundMoney(taxable + tax);
}

function buildDraftTotals(form: ExportSaleSavePayload) {
  const subtotal = roundMoney(form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0));
  const taxAmount = roundMoney(form.items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0) * Number(item.taxRate || 0)) / 100, 0));
  return {
    amount: roundMoney(subtotal + taxAmount + Number(form.roundOff || 0)),
    subtotal,
    taxAmount,
  };
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-foreground">{label}</div>
      {children}
    </div>
  );
}

function TotalsRow({ label, strong = false, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
      <span className={strong ? "text-base font-semibold text-foreground" : "text-base text-foreground"}>{label}</span>
      <span className="text-foreground">:</span>
      <span className={strong ? "text-right text-base font-semibold" : "text-right"}>{value}</span>
    </div>
  );
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
