import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ChevronDown,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@codexsun/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@codexsun/ui/components/dropdown-menu";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { Textarea } from "@codexsun/ui/components/textarea";
import {
  WorkspaceAnimatedTabs,
  type WorkspaceAnimatedTab
} from "@codexsun/ui/workspace/animated-tabs";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import {
  WorkspaceFormActions,
  WorkspaceFormSurface,
  WorkspaceFormTabbedBody
} from "@codexsun/ui/workspace/upsert";
import { cn } from "@codexsun/ui/lib/utils";
import {
  formatDocumentNumber,
  type BillingDocumentLayoutSettings,
  type BillingDocumentNumberSettings
} from "../settings";
import {
  createEmptyExportSale,
  createEmptyExportSaleEinvoice,
  createEmptyExportSaleEway,
  type ExportSale,
  type ExportSaleEinvoiceDetails,
  type ExportSaleEwayDetails,
  type ExportSaleSavePayload,
  type ExportSaleTaxType
} from "./export-sales.types";
import {
  buildExportSaleAddressChoices,
  findPreferredExportSaleAddress,
  formatExportSaleAddress,
  ExportSaleAddressDialog,
  ExportSaleAddressField,
  exportSaleAddressDraftFromText,
  type ExportSaleAddressDraft
} from "./export-sales-address-editor";
import {
  createExportSaleAddressType,
  createExportSaleContact,
  createExportSaleLookup,
  createExportSaleLocation,
  formatMoney,
  generateExportSaleEinvoice,
  generateExportSaleEway,
  listExportSaleAddressTypes,
  listExportSaleColours,
  listExportSaleContacts,
  listExportSaleHsnCodes,
  listExportSaleLocations,
  listExportSaleProductCategories,
  listExportSaleProducts,
  listExportSaleSizes,
  listExportSaleTaxes,
  listExportSaleTransports,
  listExportSaleUnits,
  listExportSaleWorkOrders,
  exportSaleToPayload,
  updateExportSaleContact,
  updateExportSaleLookup,
  type ExportSaleContactSavePayload,
  type ExportSaleLocationKind,
  type ExportSaleLocationRecord,
  type ExportSaleLookupOption,
  type ExportSaleLookupRecord,
  type ExportSaleMasterSavePayload,
  createExportSaleTransport,
  type ExportSaleTransportSavePayload
} from "./export-sales.services";
import { useExportSaleContext } from "./export-sales.hooks";
import { exportSalesSchema } from "./export-sales.schema";

export function ExportSalesForm({
  canAdminRevoke: _canAdminRevoke,
  errorMessage,
  loading,
  numbering,
  onBack,
  onRevoke: _onRevoke,
  onSubmit,
  exportSale,
  settings
}: {
  canAdminRevoke: boolean;
  errorMessage: string;
  loading: boolean;
  numbering: BillingDocumentNumberSettings;
  onBack: () => void;
  onRevoke?: () => void;
  onSubmit: (payload: ExportSaleSavePayload, printAfter?: boolean) => void;
  exportSale: ExportSale | null;
  settings: BillingDocumentLayoutSettings;
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [workflowAction, setWorkflowAction] = useState<"draft" | "submit" | "revoke">(
    exportSale?.status === "confirmed" ? "revoke" : "draft"
  );
  const [form, setForm] = useState<ExportSaleSavePayload>(() =>
    exportSale
      ? exportSaleToPayload(exportSale)
      : {
          ...createEmptyExportSale(),
          invoiceNumber: numbering.automatic
            ? formatDocumentNumber(numbering)
            : createEmptyExportSale().invoiceNumber
        }
  );
  const contextQuery = useExportSaleContext();
  useEffect(() => {
    if (exportSale || !numbering.automatic) return;
    const nextExportSaleNumber = formatDocumentNumber(numbering);
    setForm((current) =>
      current.invoiceNumber === nextExportSaleNumber
        ? current
        : { ...current, invoiceNumber: nextExportSaleNumber }
    );
  }, [numbering, exportSale]);
  const [itemDraft, setItemDraft] = useState(
    () =>
      createEmptyExportSale().items[0] ?? {
        colour: "",
        colourId: null,
        dcNo: "",
        description: "",
        hsnCode: "",
        hsnCodeId: null,
        poNo: "",
        productName: "",
        productId: null,
        quantity: 1,
        rate: 0,
        size: "",
        sizeId: null,
        taxId: null,
        taxRate: 18,
        unit: "Nos",
        unitId: 0
      }
  );
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemResetSignal, setItemResetSignal] = useState(0);
  const [editingContact, setEditingContact] = useState<ExportSaleLookupOption["record"] | null>(
    null
  );
  const [editingProduct, setEditingProduct] = useState<ExportSaleLookupRecord | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<ExportSaleLookupRecord | null>(null);
  const [editingAddressKind, setEditingAddressKind] = useState<"billing" | "shipping" | null>(null);
  const [roundOffManual, setRoundOffManual] = useState(
    Boolean(exportSale && Number(exportSale.roundOff || 0) !== 0)
  );
  const [billingAddressDraft, setBillingAddressDraft] = useState<ExportSaleAddressDraft>(() =>
    exportSaleAddressDraftFromText(form.billingAddress, "Billing")
  );
  const [shippingAddressDraft, setShippingAddressDraft] = useState<ExportSaleAddressDraft>(() =>
    exportSaleAddressDraftFromText(form.shippingAddress, "Shipping")
  );
  const [billingAddressChoice, setBillingAddressChoice] = useState("");
  const [shippingAddressChoice, setShippingAddressChoice] = useState("");

  useEffect(() => {
    if (exportSale || !contextQuery.data) return;
    setForm((current) => ({
      ...current,
      companyId: contextQuery.data.companyId,
      currencyCode: contextQuery.data.currencyCode,
      currencyId: contextQuery.data.currencyId,
      financialYearId: contextQuery.data.financialYearId
    }));
  }, [contextQuery.data, exportSale]);
  const contactsQuery = useQuery({
    queryFn: listExportSaleContacts,
    queryKey: ["billing", "exportSale", "lookups", "contacts"]
  });
  const workOrdersQuery = useQuery({
    queryFn: listExportSaleWorkOrders,
    queryKey: ["billing", "exportSale", "lookups", "work-orders"]
  });
  const productsQuery = useQuery({
    queryFn: listExportSaleProducts,
    queryKey: ["billing", "exportSale", "lookups", "products"]
  });
  const coloursQuery = useQuery({
    queryFn: listExportSaleColours,
    queryKey: ["billing", "exportSale", "lookups", "colours"]
  });
  const sizesQuery = useQuery({
    queryFn: listExportSaleSizes,
    queryKey: ["billing", "exportSale", "lookups", "sizes"]
  });
  const transportsQuery = useQuery({
    queryFn: listExportSaleTransports,
    queryKey: ["billing", "exportSale", "lookups", "transports"]
  });
  const contactSaveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: ExportSaleContactSavePayload }) =>
      id ? updateExportSaleContact(id, payload) : createExportSaleContact(payload)
  });
  const masterSaveMutation = useMutation({
    mutationFn: ({
      id,
      kind,
      payload
    }: {
      id?: string;
      kind: "products" | "workOrders";
      payload: ExportSaleMasterSavePayload;
    }) =>
      id
        ? updateExportSaleLookup(kind, id, masterPayload(kind, payload))
        : createExportSaleLookup(kind, masterPayload(kind, payload))
  });
  const transportSaveMutation = useMutation({ mutationFn: createExportSaleTransport });
  const complianceMutation = useMutation({
    mutationFn: ({
      id,
      kind,
      details
    }: {
      id: string;
      kind: "einvoice" | "eway";
      details: ExportSaleEinvoiceDetails | ExportSaleEwayDetails;
    }) =>
      kind === "einvoice"
        ? generateExportSaleEinvoice(id, details as ExportSaleEinvoiceDetails)
        : generateExportSaleEway(id, details as ExportSaleEwayDetails)
  });
  const selectedContact = (contactsQuery.data ?? []).find(
    (option) =>
      Number(option.record?.id ?? 0) === form.customerId ||
      option.value === form.customerName ||
      option.label === form.customerName
  );
  const selectedWorkOrder = (workOrdersQuery.data ?? []).find(
    (option) =>
      Number(option.record?.id ?? 0) === form.workOrderId ||
      option.value === form.workOrderNo ||
      option.label === form.workOrderNo
  );
  const contactAddressChoices = useMemo(
    () => buildExportSaleAddressChoices(selectedContact?.record),
    [selectedContact?.record]
  );
  const itemTotals = useMemo(
    () => computeExportSaleTotals(form.items, form.taxType),
    [form.items, form.taxType]
  );
  const suggestedRoundOff = useMemo(
    () => computeSuggestedRoundOff(itemTotals.amount),
    [itemTotals.amount]
  );
  const eway = form.eway ?? createEmptyExportSaleEway();
  const einvoice = form.einvoice ?? createEmptyExportSaleEinvoice();
  const selectedTransport = (transportsQuery.data ?? []).find(
    (option) =>
      Number(option.record?.id ?? 0) === eway.transportId ||
      option.value === eway.transport ||
      option.label === eway.transport
  );

  useEffect(() => {
    if (!contactAddressChoices.length) return;
    const billing = contactAddressChoices.find(
      (choice) => choice.addressId === form.billingAddressId
    );
    const shipping = contactAddressChoices.find(
      (choice) => choice.addressId === form.shippingAddressId
    );
    if (billing) setBillingAddressChoice(billing.value);
    if (shipping) setShippingAddressChoice(shipping.value);
  }, [contactAddressChoices, form.billingAddressId, form.shippingAddressId]);

  function patch(next: Partial<ExportSaleSavePayload>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function patchDraft(next: Partial<typeof itemDraft>) {
    setItemDraft((current) => ({ ...current, ...next }));
  }

  useEffect(() => {
    if (roundOffManual) return;
    setForm((current) =>
      current.roundOff === suggestedRoundOff ? current : { ...current, roundOff: suggestedRoundOff }
    );
  }, [roundOffManual, suggestedRoundOff]);

  function applyAddressDraft(
    kind: "billing" | "shipping",
    draft: ExportSaleAddressDraft,
    choiceValue = ""
  ) {
    const formatted = formatExportSaleAddress(draft);
    const addressId =
      contactAddressChoices.find((choice) => choice.value === choiceValue)?.addressId ?? 0;
    if (kind === "billing") {
      setBillingAddressDraft(draft);
      setBillingAddressChoice(choiceValue);
      patch({ billingAddress: formatted, billingAddressId: addressId || form.billingAddressId });
      return;
    }
    setShippingAddressDraft(draft);
    setShippingAddressChoice(choiceValue);
    patch({ shippingAddress: formatted, shippingAddressId: addressId || form.shippingAddressId });
  }

  function applyContactAddresses(record?: ExportSaleLookupRecord | null) {
    const choices = buildExportSaleAddressChoices(record);
    const preferredBilling = findPreferredExportSaleAddress(choices, "Billing");
    const preferredShipping = findPreferredExportSaleAddress(choices, "Shipping");
    if (preferredBilling)
      applyAddressDraft("billing", preferredBilling.draft, preferredBilling.value);
    if (preferredShipping)
      applyAddressDraft("shipping", preferredShipping.draft, preferredShipping.value);
  }

  function applyContactSelection(value: string, option?: ExportSaleLookupOption | null) {
    patch({
      customerId: Number(option?.record?.id ?? 0),
      customerName: option?.label ?? value
    });
    if (option?.record) applyContactAddresses(option.record);
  }

  function applyRoundOff(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setRoundOffManual(false);
      patch({ roundOff: suggestedRoundOff });
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) return;
    setRoundOffManual(true);
    patch({ roundOff: parsed });
  }

  function patchEway(next: Partial<ExportSaleEwayDetails>) {
    patch({ eway: { ...eway, ...next } });
  }

  function patchEinvoice(next: Partial<ExportSaleEinvoiceDetails>) {
    patch({ einvoice: { ...einvoice, ...next } });
  }

  async function generateEway() {
    if (!exportSale) {
      toast.error("Save the export sale before generating the E-way bill.");
      return;
    }
    try {
      const updated = await complianceMutation.mutateAsync({
        id: exportSale.id,
        kind: "eway",
        details: eway
      });
      patch({ eway: updated.eway, einvoice: updated.einvoice });
      toast.success("E-way bill generated");
    } catch (error) {
      toast.error("E-way generation failed", {
        description: error instanceof Error ? error.message : "Please check WhiteBooks settings."
      });
    }
  }

  async function generateEinvoice() {
    if (!exportSale) {
      toast.error("Save the export sale before generating the E-invoice.");
      return;
    }
    try {
      const updated = await complianceMutation.mutateAsync({
        id: exportSale.id,
        kind: "einvoice",
        details: einvoice
      });
      patch({ einvoice: updated.einvoice });
      toast.success("E-invoice generated");
    } catch (error) {
      toast.error("E-invoice generation failed", {
        description: error instanceof Error ? error.message : "Please check WhiteBooks settings."
      });
    }
  }

  function resetDraft() {
    setItemDraft({
      colour: "",
      colourId: null,
      dcNo: "",
      description: "",
      hsnCode: "",
      hsnCodeId: null,
      poNo: "",
      productName: "",
      productId: null,
      quantity: 1,
      rate: 0,
      size: "",
      sizeId: null,
      taxId: null,
      taxRate: 18,
      unit: "Nos",
      unitId: 0
    });
    setEditingItemIndex(null);
    setItemResetSignal((current) => current + 1);
  }

  function addOrUpdateItem() {
    if (!itemDraft.productName.trim()) {
      toast.error("Product name is required");
      return;
    }
    setForm((current) => ({
      ...current,
      items:
        editingItemIndex === null
          ? [...current.items, { ...itemDraft }]
          : current.items.map((item, index) =>
              index === editingItemIndex ? { ...itemDraft } : item
            )
    }));
    resetDraft();
  }

  function editItem(index: number) {
    const item = form.items[index];
    if (!item) return;
    setItemDraft({ ...item });
    setEditingItemIndex(index);
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index)
    }));
    if (editingItemIndex === index) resetDraft();
  }

  function applyProductSelection(value: string, option?: ExportSaleLookupOption | null) {
    const record = option?.record;
    patchDraft({
      hsnCode: record?.hsnCode ?? itemDraft.hsnCode,
      hsnCodeId: numericId(record?.hsnCodeId),
      productId: numericId(record?.id),
      productName: option?.label ?? value,
      rate: Number(record?.price ?? record?.openingRate ?? itemDraft.rate ?? 0),
      taxRate: Number(record?.taxRate ?? itemDraft.taxRate ?? 18),
      taxId: numericId(record?.taxId),
      unit: record?.unitName ?? itemDraft.unit,
      unitId: Number(record?.unitId ?? itemDraft.unitId ?? 0)
    });
  }

  const tabs: WorkspaceAnimatedTab[] = [
    {
      value: "details",
      label: "Details",
      content: (
        <div className="space-y-0">
          <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
            <div className="space-y-5">
              <Field label="Customer name" required>
                <WorkspaceLookup
                  createDescription="Add contact details and address without leaving this exportSale."
                  createLabel="New contact"
                  createMode="popup"
                  createTitle="New contact"
                  emptyLabel="No contacts found. Create a new contact."
                  loading={contactsQuery.isLoading}
                  options={contactsQuery.data ?? []}
                  placeholder="Search contact"
                  required
                  value={form.customerName}
                  onTextChange={(value) => patch({ customerId: 0, customerName: value })}
                  onValueChange={(value, option) =>
                    applyContactSelection(
                      value,
                      option as ExportSaleLookupOption | null | undefined
                    )
                  }
                  renderCreateForm={({ initialName, onCancel, onCreated }) => (
                    <ExportSaleContactQuickForm
                      initialValue={contactDraftFromRecord(undefined, initialName)}
                      loading={contactSaveMutation.isPending}
                      onCancel={onCancel}
                      onSave={async (payload) => {
                        const created = await contactSaveMutation.mutateAsync({ payload });
                        await contactsQuery.refetch();
                        const option = exportSaleContactOption(created);
                        onCreated(option);
                        patch({ customerId: Number(created.id), customerName: option.label });
                        applyContactAddresses(created);
                        toast.success("Contact saved", { description: option.label });
                      }}
                      title="New contact"
                    />
                  )}
                  trailingAction={
                    selectedContact?.record ? (
                      <button
                        aria-label="Edit selected contact"
                        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Edit selected contact"
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditingContact(selectedContact.record);
                        }}
                      >
                        <ArrowUpRight className="size-4" />
                      </button>
                    ) : undefined
                  }
                />
              </Field>
              <Field label="Work order no">
                <WorkspaceLookup
                  createDescription="Add a work order without leaving this exportSale."
                  createLabel="New work order"
                  createMode="popup"
                  createTitle="New work order"
                  emptyLabel="No work orders found. Create a new work order."
                  loading={workOrdersQuery.isLoading}
                  options={workOrdersQuery.data ?? []}
                  placeholder="Search work order"
                  value={form.workOrderNo}
                  onTextChange={(value) => patch({ workOrderId: null, workOrderNo: value })}
                  onValueChange={(value, option) =>
                    patch({
                      workOrderId: numericId(
                        (option as ExportSaleLookupOption | undefined)?.record?.id
                      ),
                      workOrderNo: option?.value ?? value
                    })
                  }
                  renderCreateForm={({ initialName, onCancel, onCreated }) => (
                    <ExportSaleMasterQuickForm
                      kind="workOrders"
                      initialValue={masterDraftFromRecord(undefined, initialName)}
                      loading={masterSaveMutation.isPending}
                      onCancel={onCancel}
                      onSave={async (payload) => {
                        const created = await masterSaveMutation.mutateAsync({
                          kind: "workOrders",
                          payload
                        });
                        await workOrdersQuery.refetch();
                        const option = exportSaleWorkOrderOption(created);
                        onCreated(option);
                        patch({ workOrderId: Number(created.id), workOrderNo: option.value });
                        toast.success("Work order saved", { description: option.label });
                      }}
                      title="New work order"
                    />
                  )}
                  trailingAction={
                    selectedWorkOrder?.record ? (
                      <button
                        aria-label="Edit selected work order"
                        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Edit selected work order"
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (selectedWorkOrder.record)
                            setEditingWorkOrder(selectedWorkOrder.record);
                        }}
                      >
                        <ArrowUpRight className="size-4" />
                      </button>
                    ) : undefined
                  }
                />
              </Field>
            </div>
            <div className="space-y-5">
              <Field label="Export sale number">
                <Input
                  value={form.invoiceNumber}
                  onChange={(event) => patch({ invoiceNumber: event.target.value.toUpperCase() })}
                />
              </Field>
              <Field label="Date">
                <WorkspaceDatePicker
                  value={form.issuedOn}
                  onValueChange={(value) => patch({ issuedOn: value })}
                />
              </Field>
              <Field label="Export sale tax type">
                <WorkspaceSelect
                  value={form.taxType}
                  options={[
                    { label: "CGST + SGST", value: "cgst-sgst" },
                    { label: "IGST", value: "igst" }
                  ]}
                  onValueChange={(taxType) => patch({ taxType: taxType as ExportSaleTaxType })}
                />
              </Field>
            </div>
          </div>
          <ExportSaleItemsSection
            draft={itemDraft}
            editing={editingItemIndex !== null}
            items={form.items}
            colourOptions={coloursQuery.data ?? []}
            coloursLoading={coloursQuery.isLoading}
            productOptions={productsQuery.data ?? []}
            productsLoading={productsQuery.isLoading}
            resetSignal={itemResetSignal}
            settings={settings}
            sizeOptions={sizesQuery.data ?? []}
            sizesLoading={sizesQuery.isLoading}
            taxType={form.taxType}
            roundOff={Number(form.roundOff ?? 0)}
            roundOffManual={roundOffManual}
            suggestedRoundOff={suggestedRoundOff}
            onAdd={addOrUpdateItem}
            onDraftChange={patchDraft}
            onEdit={editItem}
            onProductSelect={applyProductSelection}
            onRoundOffChange={applyRoundOff}
            onRemove={removeItem}
            onResetRoundOff={() => {
              setRoundOffManual(false);
              patch({ roundOff: suggestedRoundOff });
            }}
            onReset={resetDraft}
            onCreateColour={async (name) => {
              const created = await createExportSaleLookup("colours", { isActive: true, name });
              await coloursQuery.refetch();
              toast.success("Colour saved", { description: name });
              return exportSaleCommonOption(created);
            }}
            onCreateProduct={async (name) => {
              const created = await masterSaveMutation.mutateAsync({
                kind: "products",
                payload: masterDraftFromRecord(undefined, name)
              });
              await productsQuery.refetch();
              toast.success("Product saved", { description: name });
              return exportSaleProductOption(created);
            }}
            renderProductCreateForm={({ initialName, onCancel, onCreated }) => (
              <ExportSaleProductQuickForm
                initialValue={masterDraftFromRecord(undefined, initialName)}
                loading={masterSaveMutation.isPending}
                onCancel={onCancel}
                onSave={async (payload) => {
                  const created = await masterSaveMutation.mutateAsync({
                    kind: "products",
                    payload
                  });
                  await productsQuery.refetch();
                  const option = exportSaleProductOption(created);
                  onCreated(option);
                  toast.success("Product saved", { description: option.label });
                }}
                title="New product"
              />
            )}
            onCreateSize={async (name) => {
              const created = await createExportSaleLookup("sizes", { isActive: true, name });
              await sizesQuery.refetch();
              toast.success("Size saved", { description: name });
              return exportSaleCommonOption(created);
            }}
            onEditProduct={(record) => setEditingProduct(record)}
          />
        </div>
      )
    },
    {
      value: "address",
      label: "Address",
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <ExportSaleAddressField
            choices={contactAddressChoices}
            description={form.billingAddress}
            disabled={!selectedContact?.record}
            label="Billing address"
            selectedValue={billingAddressChoice}
            onEdit={() => setEditingAddressKind("billing")}
            onSelect={(choice) => applyAddressDraft("billing", choice.draft, choice.value)}
          />
          <ExportSaleAddressField
            choices={contactAddressChoices}
            description={form.shippingAddress}
            disabled={!selectedContact?.record}
            label="Shipping address"
            selectedValue={shippingAddressChoice}
            onEdit={() => setEditingAddressKind("shipping")}
            onSelect={(choice) => applyAddressDraft("shipping", choice.draft, choice.value)}
          />
        </div>
      )
    },
    ...(settings.useEway
      ? [
          {
            value: "eway",
            label: "E-way",
            content: (
              <ExportSaleEwayTab
                value={eway}
                onChange={patchEway}
                onGenerate={generateEway}
                options={transportsQuery.data ?? []}
                loading={transportsQuery.isLoading}
                selected={selectedTransport}
                onTransportChange={(value, option) =>
                  patchEway({
                    transport: option?.label ?? value,
                    transportGst: option?.record?.gst ?? "",
                    transportId: numericId(option?.record?.id)
                  })
                }
                onCreateTransport={async (payload) => {
                  const created = await transportSaveMutation.mutateAsync(payload);
                  await transportsQuery.refetch();
                  return {
                    description: created.gst || created.vehicleNo || "",
                    label: created.name || created.id,
                    meta: created.gst || "",
                    value: created.name || created.id,
                    record: created
                  };
                }}
              />
            )
          }
        ]
      : []),
    ...(settings.useEinvoice
      ? [
          {
            value: "einvoice",
            label: "E-invoice",
            content: (
              <ExportSaleEinvoiceTab
                value={einvoice}
                onChange={patchEinvoice}
                onGenerate={generateEinvoice}
              />
            )
          }
        ]
      : []),
    {
      value: "terms",
      label: "Terms",
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Terms">
            <Textarea
              className="min-h-32"
              value={form.terms}
              onChange={(event) => patch({ terms: event.target.value })}
            />
          </Field>
          <Field label="Comments">
            <Textarea
              className="min-h-32"
              value={form.notes}
              onChange={(event) => patch({ notes: event.target.value })}
            />
          </Field>
        </div>
      )
    }
  ];

  function submit(printAfter = false, status: ExportSaleSavePayload["status"] = form.status) {
    if (!form.companyId || !form.financialYearId || !form.currencyId) {
      toast.error("Default Company context is not ready");
      return;
    }
    if (!form.customerId) {
      toast.error("Select a persisted customer");
      return;
    }
    if (!form.billingAddressId || !form.shippingAddressId) {
      toast.error("Select persisted billing and shipping addresses");
      return;
    }
    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!form.items.length) {
      toast.error("Add at least one item");
      return;
    }
    const payload = { ...form, status };
    const validation = exportSalesSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(
        validation.error.issues[0]?.message ?? "Complete the required export sale fields"
      );
      return;
    }
    onSubmit(payload, printAfter);
  }

  return (
    <WorkspacePage
      className="max-w-[96rem]"
      title={exportSale ? "Edit Export Sale" : "New Export Sale"}
      description="Create or update a tenant-isolated export sale voucher."
      actions={
        <Button className="h-9 rounded-md" onClick={onBack} type="button" variant="outline">
          <X className="size-4" />
          Cancel
        </Button>
      }
    >
      <WorkspaceFormSurface>
        <WorkspaceFormTabbedBody className="pb-7">
          <WorkspaceAnimatedTabs
            tabs={tabs}
            value={activeTab}
            onValueChange={setActiveTab}
            className="min-w-0"
            contentClassName="px-0 pb-0"
            listClassName="border-border/80"
          />
        </WorkspaceFormTabbedBody>
        {errorMessage ? (
          <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
        <WorkspaceFormActions>
          <Button disabled={loading} onClick={() => submit(false, "draft")} type="button">
            <Save className="size-4" />
            Save
          </Button>
          <Button disabled={loading} onClick={() => submit(true)} type="button" variant="outline">
            <Printer className="size-4" />
            Save & Print
          </Button>
          <Button onClick={onBack} type="button" variant="outline">
            <X className="size-4" />
            Cancel
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Export sale workflow action"
                  className={cn(
                    "h-8 w-20 min-w-20 justify-center gap-1 px-2 text-xs transition-[background-color,border-color,color,transform] duration-300 ease-out",
                    workflowAction === "draft" &&
                      "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100",
                    workflowAction === "submit" &&
                      "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                    workflowAction === "revoke" &&
                      "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  )}
                  disabled={loading}
                  title="Export sale workflow action"
                  type="button"
                  variant="outline"
                >
                  {workflowAction === "draft"
                    ? "Draft"
                    : workflowAction === "submit"
                      ? "Submit"
                      : "Revoke"}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-20 min-w-20 rounded-md p-1">
                <DropdownMenuItem
                  className="gap-1 px-2 text-xs"
                  onSelect={() => setWorkflowAction("draft")}
                >
                  <Save className="size-4" />
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-1 px-2 text-xs"
                  onSelect={() => setWorkflowAction("submit")}
                >
                  <Send className="size-4" />
                  Submit
                </DropdownMenuItem>
                {workflowAction === "submit" || exportSale?.status === "confirmed" ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-1 px-2 text-xs"
                      onSelect={() => setWorkflowAction("revoke")}
                    >
                      <RotateCcw className="size-4" />
                      Revoke
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </WorkspaceFormActions>
        <Dialog
          open={Boolean(editingContact)}
          onOpenChange={(open) => !open && setEditingContact(null)}
        >
          <DialogContent
            className="rounded-md p-0 sm:max-w-3xl"
            onInteractOutside={(event) => event.preventDefault()}
          >
            {editingContact ? (
              <ExportSaleContactQuickForm
                initialValue={contactDraftFromRecord(editingContact)}
                loading={contactSaveMutation.isPending}
                onCancel={() => setEditingContact(null)}
                onSave={async (payload) => {
                  const saved = await contactSaveMutation.mutateAsync({
                    id: editingContact.id,
                    payload
                  });
                  await contactsQuery.refetch();
                  patch({ customerName: exportSaleContactOption(saved).label });
                  applyContactAddresses(saved);
                  setEditingContact(null);
                  toast.success("Contact saved", {
                    description: exportSaleContactOption(saved).label
                  });
                }}
                title="Edit contact"
              />
            ) : null}
          </DialogContent>
        </Dialog>
        <Dialog
          open={Boolean(editingProduct)}
          onOpenChange={(open) => !open && setEditingProduct(null)}
        >
          <DialogContent
            className="rounded-md p-0 sm:max-w-3xl"
            onInteractOutside={(event) => event.preventDefault()}
          >
            {editingProduct ? (
              <ExportSaleProductQuickForm
                initialValue={masterDraftFromRecord(editingProduct)}
                loading={masterSaveMutation.isPending}
                onCancel={() => setEditingProduct(null)}
                onSave={async (payload) => {
                  const saved = await masterSaveMutation.mutateAsync({
                    id: editingProduct.id,
                    kind: "products",
                    payload
                  });
                  await productsQuery.refetch();
                  patchDraft({ productName: exportSaleProductOption(saved).label });
                  setEditingProduct(null);
                  toast.success("Product saved", {
                    description: exportSaleProductOption(saved).label
                  });
                }}
                title="Edit product"
              />
            ) : null}
          </DialogContent>
        </Dialog>
        <Dialog
          open={Boolean(editingWorkOrder)}
          onOpenChange={(open) => !open && setEditingWorkOrder(null)}
        >
          <DialogContent
            className="rounded-md p-0 sm:max-w-3xl"
            onInteractOutside={(event) => event.preventDefault()}
          >
            {editingWorkOrder ? (
              <ExportSaleMasterQuickForm
                kind="workOrders"
                initialValue={masterDraftFromRecord(editingWorkOrder)}
                loading={masterSaveMutation.isPending}
                onCancel={() => setEditingWorkOrder(null)}
                onSave={async (payload) => {
                  const saved = await masterSaveMutation.mutateAsync({
                    id: editingWorkOrder.id,
                    kind: "workOrders",
                    payload
                  });
                  await workOrdersQuery.refetch();
                  patch({ workOrderNo: exportSaleWorkOrderOption(saved).value });
                  setEditingWorkOrder(null);
                  toast.success("Work order saved", {
                    description: exportSaleWorkOrderOption(saved).label
                  });
                }}
                title="Edit work order"
              />
            ) : null}
          </DialogContent>
        </Dialog>
        <Dialog
          open={Boolean(editingAddressKind)}
          onOpenChange={(open) => !open && setEditingAddressKind(null)}
        >
          <DialogContent
            className="rounded-md p-0 sm:max-w-3xl"
            onInteractOutside={(event) => event.preventDefault()}
          >
            {editingAddressKind ? (
              <ExportSaleAddressDialog
                draft={
                  editingAddressKind === "billing" ? billingAddressDraft : shippingAddressDraft
                }
                onCancel={() => setEditingAddressKind(null)}
                onSave={(draft) => {
                  applyAddressDraft(editingAddressKind, draft);
                  setEditingAddressKind(null);
                  toast.success(
                    `${editingAddressKind === "billing" ? "Billing" : "Shipping"} address saved`
                  );
                }}
                title="Edit contact"
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </WorkspaceFormSurface>
    </WorkspacePage>
  );
}

function ExportSaleContactQuickForm({
  initialValue,
  loading,
  onCancel,
  onSave,
  title
}: {
  initialValue: ExportSaleContactSavePayload;
  loading: boolean;
  onCancel: () => void;
  onSave: (payload: ExportSaleContactSavePayload) => Promise<void>;
  title: string;
}) {
  const [form, setForm] = useState(initialValue);
  const [activeTab, setActiveTab] = useState("details");
  const [legalNameManual, setLegalNameManual] = useState(
    Boolean(initialValue.legalName && initialValue.legalName !== initialValue.name.toUpperCase())
  );
  const addressTypesQuery = useQuery({
    queryFn: listExportSaleAddressTypes,
    queryKey: ["billing", "exportSale", "lookups", "address-types"]
  });
  const countriesQuery = useQuery({
    queryFn: () => listExportSaleLocations("countries"),
    queryKey: ["billing", "exportSale", "lookups", "countries"]
  });
  const statesQuery = useQuery({
    queryFn: () => listExportSaleLocations("states"),
    queryKey: ["billing", "exportSale", "lookups", "states"]
  });
  const districtsQuery = useQuery({
    queryFn: () => listExportSaleLocations("districts"),
    queryKey: ["billing", "exportSale", "lookups", "districts"]
  });
  const citiesQuery = useQuery({
    queryFn: () => listExportSaleLocations("cities"),
    queryKey: ["billing", "exportSale", "lookups", "cities"]
  });
  const pincodesQuery = useQuery({
    queryFn: () => listExportSaleLocations("pincodes"),
    queryKey: ["billing", "exportSale", "lookups", "pincodes"]
  });

  useEffect(() => {
    const india = (countriesQuery.data ?? []).find(
      (record) => record.name.toLowerCase() === "india" || record.code.toUpperCase() === "IN"
    );
    if (!india || form.countryId) return;
    setForm((current) => ({ ...current, countryId: india.id, countryName: india.name }));
  }, [countriesQuery.data, form.countryId]);

  const locations = {
    cities: citiesQuery.data ?? [],
    districts: districtsQuery.data ?? [],
    pincodes: pincodesQuery.data ?? [],
    states: statesQuery.data ?? []
  };

  async function createLocation(kind: ExportSaleLocationKind, name: string) {
    const dependency =
      kind === "states"
        ? form.countryId
        : kind === "districts"
          ? form.stateId
          : kind === "cities"
            ? form.districtId
            : form.cityId;
    if (!dependency) {
      toast.error(
        `Select ${kind === "states" ? "India" : kind === "districts" ? "a state" : kind === "cities" ? "a district" : "a city"} first.`
      );
      return undefined;
    }
    const created = await createExportSaleLocation(kind, locationPayload(kind, name, form));
    await {
      cities: citiesQuery,
      districts: districtsQuery,
      pincodes: pincodesQuery,
      states: statesQuery
    }[kind].refetch();
    toast.success(`${kind === "pincodes" ? "Pincode" : kind.slice(0, -1)} saved`, {
      description: name
    });
    return exportSaleLocationOption(created);
  }

  const tabs: WorkspaceAnimatedTab[] = [
    {
      content: (
        <div className="grid gap-4">
          <ContactQuickField
            label="Contact name"
            required
            value={form.name}
            onChange={(name) =>
              setForm((current) => ({
                ...current,
                name,
                ...(!legalNameManual ? { legalName: name.toUpperCase() } : {})
              }))
            }
          />
          <ContactQuickField
            forceUppercase
            label="Legal name"
            value={form.legalName}
            onChange={(legalName) => {
              setLegalNameManual(true);
              setForm((current) => ({ ...current, legalName }));
            }}
            onMagic={() => {
              setLegalNameManual(false);
              setForm((current) => ({ ...current, legalName: current.name.trim().toUpperCase() }));
            }}
          />
          <ContactQuickField
            forceUppercase
            label="GSTIN"
            value={form.gstin}
            onChange={(gstin) => setForm((current) => ({ ...current, gstin }))}
          />
          <ContactQuickField
            label="Phone"
            value={form.primaryPhone}
            onChange={(primaryPhone) => setForm((current) => ({ ...current, primaryPhone }))}
          />
        </div>
      ),
      label: "Details",
      value: "details"
    },
    {
      content: (
        <div className="grid gap-4">
          <label className="grid gap-2">
            <Label>Address type</Label>
            <WorkspaceLookup
              createLabel="Save address type"
              createMode="inline"
              emptyLabel="No address types found. Type a value to create it."
              loading={addressTypesQuery.isLoading}
              options={(addressTypesQuery.data ?? [])
                .filter((record) => record.isActive !== false)
                .map(exportSaleContactOption)}
              placeholder="Search address type"
              value={form.addressTypeName}
              onCreate={async (name) => {
                const created = await createExportSaleAddressType(name);
                await addressTypesQuery.refetch();
                toast.success("Address type saved", { description: name });
                return exportSaleContactOption(created);
              }}
              onValueChange={(value, option) =>
                setForm((current) => ({ ...current, addressTypeName: option?.label ?? value }))
              }
            />
          </label>
          <ContactQuickField
            label="Address line 1"
            value={form.addressLine1}
            onChange={(addressLine1) => setForm((current) => ({ ...current, addressLine1 }))}
          />
          <ContactQuickField
            label="Address line 2"
            value={form.addressLine2}
            onChange={(addressLine2) => setForm((current) => ({ ...current, addressLine2 }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ContactLocationLookup
              label="State"
              kind="states"
              loading={statesQuery.isLoading}
              options={locations.states.filter(
                (record) => !form.countryId || record.countryId === form.countryId
              )}
              value={form.stateId || form.stateName}
              onCreate={createLocation}
              onPick={(record) => setForm((current) => locationPatch("states", record, current))}
            />
            <ContactLocationLookup
              label="District"
              kind="districts"
              loading={districtsQuery.isLoading}
              options={locations.districts.filter(
                (record) => !form.stateId || record.stateId === form.stateId
              )}
              value={form.districtId || form.districtName}
              onCreate={createLocation}
              onPick={(record) => setForm((current) => locationPatch("districts", record, current))}
            />
            <ContactLocationLookup
              label="City"
              kind="cities"
              loading={citiesQuery.isLoading}
              options={locations.cities.filter(
                (record) => !form.districtId || record.districtId === form.districtId
              )}
              value={form.cityId || form.cityName}
              onCreate={createLocation}
              onPick={(record) => setForm((current) => locationPatch("cities", record, current))}
            />
            <ContactLocationLookup
              label="Pincode"
              kind="pincodes"
              loading={pincodesQuery.isLoading}
              options={locations.pincodes.filter(
                (record) => !form.cityId || record.cityId === form.cityId
              )}
              value={form.pincodeId || form.pincodeName}
              onCreate={createLocation}
              onPick={(record) => setForm((current) => locationPatch("pincodes", record, current))}
            />
          </div>
        </div>
      ),
      label: "Address",
      value: "address"
    }
  ];

  return (
    <form
      className="grid gap-0"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(form);
      }}
    >
      <DialogHeader className="border-b border-border/80 px-5 py-4 pr-12">
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <WorkspaceAnimatedTabs
        contentClassName="h-[26rem] overflow-y-auto px-5 pb-5"
        listClassName="rounded-none border-x-0 border-t-0 px-5 shadow-none"
        tabs={tabs}
        value={activeTab}
        onValueChange={setActiveTab}
      />
      <DialogFooter className="border-t border-border/80 px-5 py-4">
        <Button disabled={loading} type="button" variant="outline" onClick={onCancel}>
          <X className="size-4" />
          Cancel
        </Button>
        <Button disabled={loading || !form.name.trim()} type="submit">
          <Save className="size-4" />
          Save contact
        </Button>
      </DialogFooter>
    </form>
  );
}

function ContactQuickField({
  className,
  forceUppercase = false,
  label,
  onChange,
  onMagic,
  required,
  type = "text",
  value
}: {
  className?: string;
  forceUppercase?: boolean;
  label: string;
  onChange: (value: string) => void;
  onMagic?: () => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
        {onMagic ? (
          <Button
            aria-label="Refresh legal name from contact name"
            className="size-7 rounded-md p-0"
            onClick={(event) => {
              event.preventDefault();
              onMagic();
            }}
            title="Refresh legal name from contact name"
            type="button"
            variant="outline"
          >
            <Sparkles className="size-3.5" />
          </Button>
        ) : null}
      </div>
      <Input
        autoCapitalize={forceUppercase ? "characters" : "none"}
        autoFocus={label === "Contact name"}
        className={cn("h-11 rounded-md", forceUppercase && "uppercase")}
        required={required}
        type={type}
        value={value}
        onChange={(event) =>
          onChange(forceUppercase ? event.target.value.toUpperCase() : event.target.value)
        }
      />
    </label>
  );
}

function ContactLocationLookup({
  kind,
  label,
  loading,
  onCreate,
  onPick,
  options,
  value
}: {
  kind: ExportSaleLocationKind;
  label: string;
  loading: boolean;
  onCreate: (
    kind: ExportSaleLocationKind,
    name: string
  ) => Promise<ExportSaleLookupOption | undefined>;
  onPick: (record: ExportSaleLocationRecord) => void;
  options: ExportSaleLocationRecord[];
  value: string;
}) {
  const lookupOptions = options
    .filter((record) => record.status !== "inactive")
    .map(exportSaleLocationOption);
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      <WorkspaceLookup
        allowTextValue={false}
        createLabel={`Create ${label.toLowerCase()}`}
        createMode="inline"
        emptyLabel={`No ${label.toLowerCase()} found. Type a value to create it.`}
        loading={loading}
        options={lookupOptions}
        placeholder={`Search ${label.toLowerCase()}`}
        value={value}
        onCreate={(name) => onCreate(kind, name)}
        onValueChange={(selected, option) => {
          const record =
            ((option as ExportSaleLookupOption | undefined)?.record as
              ExportSaleLocationRecord | undefined) ?? options.find((item) => item.id === selected);
          if (record) onPick(record);
        }}
      />
    </label>
  );
}

function exportSaleLocationOption(record: ExportSaleLocationRecord): ExportSaleLookupOption {
  const label = record.name || record.pincode || record.code;
  return {
    label,
    record,
    value: record.id
  };
}

function locationPayload(
  kind: ExportSaleLocationKind,
  name: string,
  form: ExportSaleContactSavePayload
) {
  const trimmedName = name.trim();
  const payload: Record<string, unknown> = {
    code: locationCode(trimmedName),
    name: trimmedName,
    sortOrder: 1000,
    status: "active",
    countryId: form.countryId || null,
    countryName: form.countryName || "India"
  };
  if (kind !== "states") {
    payload.stateId = form.stateId || null;
    payload.stateName = form.stateName || null;
  }
  if (kind === "cities" || kind === "pincodes") {
    payload.districtId = form.districtId || null;
    payload.districtName = form.districtName || null;
  }
  if (kind === "pincodes") {
    payload.areaName = trimmedName;
    payload.cityId = form.cityId || null;
    payload.cityName = form.cityName || null;
    payload.pincode = trimmedName;
  }
  return payload;
}

function locationPatch(
  kind: ExportSaleLocationKind,
  record: ExportSaleLocationRecord,
  form: ExportSaleContactSavePayload
): ExportSaleContactSavePayload {
  const label = record.pincode || record.name;
  const next = { ...form };
  if (kind === "states") {
    next.stateId = record.id;
    next.stateName = record.name;
    next.districtId = "";
    next.districtName = "";
    next.cityId = "";
    next.cityName = "";
    next.pincodeId = "";
    next.pincodeName = "";
  } else if (kind === "districts") {
    next.districtId = record.id;
    next.districtName = record.name;
    next.cityId = "";
    next.cityName = "";
    next.pincodeId = "";
    next.pincodeName = "";
  } else if (kind === "cities") {
    next.cityId = record.id;
    next.cityName = record.name;
    next.pincodeId = "";
    next.pincodeName = "";
  } else {
    next.pincodeId = record.id;
    next.pincodeName = label;
    next.cityId = record.cityId || next.cityId;
    next.cityName = record.cityName || next.cityName;
    next.districtId = record.districtId || next.districtId;
    next.districtName = record.districtName || next.districtName;
    next.stateId = record.stateId || next.stateId;
    next.stateName = record.stateName || next.stateName;
    next.countryId = record.countryId || next.countryId;
    next.countryName = record.countryName || next.countryName || "India";
  }
  return next;
}

function locationCode(value: string) {
  return (
    value
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "LOCATION"
  );
}

function contactDraftFromRecord(
  record?: ExportSaleLookupRecord,
  initialName = ""
): ExportSaleContactSavePayload {
  const address = record?.addresses?.[0] ?? {};
  return {
    addressTypeName: String(address.addressTypeName ?? "Billing"),
    addressLine1: String(address.addressLine1 ?? ""),
    addressLine2: String(address.addressLine2 ?? ""),
    cityId: String(address.cityId ?? ""),
    cityName: String(address.cityName ?? ""),
    countryId: String(address.countryId ?? ""),
    countryName: String(address.countryName ?? "India"),
    districtId: String(address.districtId ?? ""),
    districtName: String(address.districtName ?? ""),
    gstin: String(record?.gstin ?? ""),
    legalName: record?.legalName ?? initialName,
    name: record?.name ?? initialName,
    pincodeId: String(address.pincodeId ?? ""),
    pincodeName: String(address.pincodeName ?? ""),
    primaryEmail: record?.primaryEmail ?? "",
    primaryPhone: record?.primaryPhone ?? "",
    stateId: String(address.stateId ?? ""),
    stateName: String(address.stateName ?? "")
  };
}

function exportSaleContactOption(record: ExportSaleLookupRecord): ExportSaleLookupOption {
  const label = record.name || record.code || record.id;
  return {
    description: record.primaryPhone || record.primaryEmail || "",
    label,
    meta: record.code || "",
    record,
    value: label
  };
}

function ExportSaleMasterQuickForm({
  initialValue,
  kind,
  loading,
  onCancel,
  onSave,
  title
}: {
  initialValue: ExportSaleMasterSavePayload;
  kind: "products" | "workOrders";
  loading: boolean;
  onCancel: () => void;
  onSave: (payload: ExportSaleMasterSavePayload) => Promise<void>;
  title: string;
}) {
  const [form, setForm] = useState(initialValue);
  const product = kind === "products";
  return (
    <form
      className="grid gap-0"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(form);
      }}
    >
      <DialogHeader className="border-b border-border/80 px-5 py-4 pr-12">
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 px-5 py-5">
        <ContactQuickField
          label={product ? "Product name" : "Work order name"}
          required
          value={form.name}
          onChange={(name) => setForm((current) => ({ ...current, name }))}
        />
        <ContactQuickField
          label="Code"
          value={form.code}
          onChange={(code) => setForm((current) => ({ ...current, code: code.toUpperCase() }))}
        />
        {product ? (
          <>
            <ContactQuickField
              label="HSN code"
              value={form.hsnCode}
              onChange={(hsnCode) => setForm((current) => ({ ...current, hsnCode }))}
            />
            <ContactQuickField
              label="Unit"
              value={form.unitName}
              onChange={(unitName) => setForm((current) => ({ ...current, unitName }))}
            />
            <ContactQuickField
              label="Opening rate"
              type="number"
              value={String(form.openingRate)}
              onChange={(openingRate) =>
                setForm((current) => ({ ...current, openingRate: Number(openingRate || 0) }))
              }
            />
          </>
        ) : (
          <ContactQuickField
            label="Work order type"
            value={form.typeName}
            onChange={(typeName) => setForm((current) => ({ ...current, typeName }))}
          />
        )}
      </div>
      <DialogFooter className="border-t border-border/80 px-5 py-4">
        <Button disabled={loading} type="button" variant="outline" onClick={onCancel}>
          <X className="size-4" />
          Cancel
        </Button>
        <Button disabled={loading || !form.name.trim()} type="submit">
          <Save className="size-4" />
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

function masterDraftFromRecord(
  record?: ExportSaleLookupRecord,
  initialName = ""
): ExportSaleMasterSavePayload {
  return {
    code: record?.code ?? "",
    hsnCode: record?.hsnCode ?? "",
    hsnCodeId: record?.hsnCodeId ?? "",
    name: record?.name ?? initialName,
    openingRate: Number(record?.openingRate ?? record?.price ?? 0),
    productCategoryId: record?.productCategoryId ?? "",
    productCategoryName: record?.productCategoryName ?? "",
    taxId: record?.taxId ?? "",
    taxName: record?.taxName ?? "",
    taxRate: Number(record?.taxRate ?? record?.ratePercent ?? 0),
    typeName: record?.typeName ?? "",
    unitId: record?.unitId ?? "",
    unitName: record?.unitName ?? ""
  };
}

function masterPayload(kind: "products" | "workOrders", payload: ExportSaleMasterSavePayload) {
  return kind === "products"
    ? {
        code: payload.code.trim(),
        hsnCode: payload.hsnCode.trim(),
        hsnCodeId: payload.hsnCodeId || null,
        isActive: true,
        name: payload.name.trim(),
        openingRate: Number(payload.openingRate || 0),
        productCategoryId: payload.productCategoryId || null,
        productCategoryName: payload.productCategoryName?.trim() || null,
        taxId: payload.taxId || null,
        taxName: payload.taxName?.trim() || null,
        taxRate: Number(payload.taxRate || 0),
        unitId: payload.unitId || null,
        unitName: payload.unitName.trim()
      }
    : {
        code: payload.code.trim(),
        isActive: true,
        name: payload.name.trim(),
        typeName: payload.typeName.trim()
      };
}

function exportSaleProductOption(record: ExportSaleLookupRecord): ExportSaleLookupOption {
  const label = record.name || record.code || record.id;
  return {
    description: [record.hsnCode, record.unitName].filter(Boolean).join(" | "),
    label,
    meta: record.code || "",
    record,
    value: label
  };
}

function exportSaleWorkOrderOption(record: ExportSaleLookupRecord): ExportSaleLookupOption {
  const value = record.code || record.workOrderNo || record.name || record.id;
  return {
    description: record.name || record.typeName || "",
    label: value,
    meta: record.typeName || "",
    record,
    value
  };
}

function exportSaleCommonOption(record: ExportSaleLookupRecord): ExportSaleLookupOption {
  const label = record.name || record.code || record.id;
  return { label, record, value: label };
}

function ExportSaleItemsSection({
  colourOptions,
  coloursLoading,
  draft,
  editing,
  items,
  productOptions,
  productsLoading,
  resetSignal,
  settings,
  sizeOptions,
  sizesLoading,
  taxType,
  roundOff,
  roundOffManual,
  suggestedRoundOff,
  onAdd,
  onCreateColour,
  onCreateProduct,
  onCreateSize,
  renderProductCreateForm,
  onDraftChange,
  onEditProduct,
  onEdit,
  onProductSelect,
  onRoundOffChange,
  onRemove,
  onResetRoundOff,
  onReset
}: {
  colourOptions: ExportSaleLookupOption[];
  coloursLoading: boolean;
  draft: ExportSaleSavePayload["items"][number];
  editing: boolean;
  items: ExportSaleSavePayload["items"];
  productOptions: ExportSaleLookupOption[];
  productsLoading: boolean;
  resetSignal: number;
  settings: BillingDocumentLayoutSettings;
  sizeOptions: ExportSaleLookupOption[];
  sizesLoading: boolean;
  taxType: ExportSaleTaxType;
  roundOff: number;
  roundOffManual: boolean;
  suggestedRoundOff: number;
  onAdd: () => void;
  onCreateColour: (name: string) => Promise<ExportSaleLookupOption | undefined>;
  onCreateProduct: (name: string) => Promise<ExportSaleLookupOption | undefined>;
  onCreateSize: (name: string) => Promise<ExportSaleLookupOption | undefined>;
  renderProductCreateForm: (context: {
    initialName: string;
    onCancel: () => void;
    onCreated: (option: ExportSaleLookupOption) => void;
  }) => ReactNode;
  onDraftChange: (next: Partial<ExportSaleSavePayload["items"][number]>) => void;
  onEditProduct: (record: ExportSaleLookupRecord) => void;
  onEdit: (index: number) => void;
  onProductSelect: (value: string, option?: ExportSaleLookupOption | null) => void;
  onRoundOffChange: (value: string) => void;
  onRemove: (index: number) => void;
  onResetRoundOff: () => void;
  onReset: () => void;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const showPo = settings.usePo;
  const showDc = settings.useDc;
  const showColour = settings.useColour;
  const showSize = settings.useSize;
  const splitTax = taxType === "cgst-sgst";
  const totals = computeExportSaleTotals(items, taxType);
  const grandTotal = totals.amount + roundOff;
  const templateColumns = [
    ...(showPo ? ["minmax(6.5rem,0.7fr)"] : []),
    ...(showDc ? ["minmax(6.5rem,0.7fr)"] : []),
    "minmax(16rem,2fr)",
    "minmax(14rem,1.2fr)",
    ...(showColour ? ["minmax(7rem,0.8fr)"] : []),
    ...(showSize ? ["minmax(7rem,0.8fr)"] : []),
    "minmax(6rem,0.7fr)",
    "minmax(7rem,0.7fr)",
    "auto"
  ].join(" ");

  useEffect(() => {
    if (!resetSignal) return;
    window.requestAnimationFrame(() => {
      rowRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
    });
  }, [resetSignal]);

  return (
    <div className="mt-8 px-0 pb-0 pt-5">
      <div>
        <h3 className="text-lg font-semibold tracking-normal text-foreground underline decoration-foreground/70 underline-offset-4">
          Export Sale Items
        </h3>
        <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1 pt-1.5">
          <div className="min-w-[980px]">
            <div
              ref={rowRef}
              className="grid gap-1"
              style={{ gridTemplateColumns: templateColumns }}
            >
              {showPo ? (
                <Field label="PO">
                  <Input
                    value={draft.poNo}
                    onChange={(event) => onDraftChange({ poNo: event.target.value })}
                  />
                </Field>
              ) : null}
              {showDc ? (
                <Field label="DC">
                  <Input
                    value={draft.dcNo}
                    onChange={(event) => onDraftChange({ dcNo: event.target.value })}
                  />
                </Field>
              ) : null}
              <Field label="Product name">
                <WorkspaceLookup
                  createDescription="Add a product without leaving this exportSale."
                  createLabel="New product"
                  createMode="popup"
                  createTitle="New product"
                  emptyLabel="No products found. Create a new product."
                  loading={productsLoading}
                  options={productOptions}
                  placeholder="Search product"
                  value={draft.productName}
                  onTextChange={(value) => onDraftChange({ productName: value })}
                  onValueChange={(value, option) =>
                    onProductSelect(value, option as ExportSaleLookupOption | null | undefined)
                  }
                  onCreate={onCreateProduct}
                  renderCreateForm={renderProductCreateForm}
                  trailingAction={
                    productOptions.find(
                      (option) =>
                        option.value === draft.productName || option.label === draft.productName
                    )?.record ? (
                      <button
                        aria-label="Edit selected product"
                        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Edit selected product"
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.stopPropagation();
                          const record = productOptions.find(
                            (option) =>
                              option.value === draft.productName ||
                              option.label === draft.productName
                          )?.record;
                          if (record) onEditProduct(record);
                        }}
                      >
                        <ArrowUpRight className="size-4" />
                      </button>
                    ) : undefined
                  }
                />
              </Field>
              <Field label="Description">
                <Input
                  value={draft.description}
                  onChange={(event) => onDraftChange({ description: event.target.value })}
                />
              </Field>
              {showColour ? (
                <Field label="Colour">
                  <WorkspaceLookup
                    createLabel="Create colour"
                    createMode="inline"
                    emptyLabel="No colours found. Type a value to create it."
                    loading={coloursLoading}
                    options={colourOptions}
                    placeholder="Search colour"
                    value={draft.colour}
                    onTextChange={(value) => onDraftChange({ colour: value })}
                    onValueChange={(value, option) =>
                      onDraftChange({
                        colour: option?.label ?? value,
                        colourId: numericId(
                          (option as ExportSaleLookupOption | undefined)?.record?.id
                        )
                      })
                    }
                    onCreate={onCreateColour}
                  />
                </Field>
              ) : null}
              {showSize ? (
                <Field label="Size">
                  <WorkspaceLookup
                    createLabel="Create size"
                    createMode="inline"
                    emptyLabel="No sizes found. Type a value to create it."
                    loading={sizesLoading}
                    options={sizeOptions}
                    placeholder="Search size"
                    value={draft.size}
                    onTextChange={(value) => onDraftChange({ size: value })}
                    onValueChange={(value, option) =>
                      onDraftChange({
                        size: option?.label ?? value,
                        sizeId: numericId(
                          (option as ExportSaleLookupOption | undefined)?.record?.id
                        )
                      })
                    }
                    onCreate={onCreateSize}
                  />
                </Field>
              ) : null}
              <Field label="Quantity">
                <Input
                  className="text-center"
                  inputMode="numeric"
                  type="text"
                  value={String(draft.quantity)}
                  onChange={(event) => onDraftChange({ quantity: Number(event.target.value || 0) })}
                />
              </Field>
              <Field label="Price">
                <Input
                  className="text-right"
                  inputMode="decimal"
                  type="text"
                  value={String(draft.rate)}
                  onChange={(event) => onDraftChange({ rate: Number(event.target.value || 0) })}
                />
              </Field>
              <div className="flex items-end gap-2 pb-0.5">
                <Button
                  className="h-11 rounded-md bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700"
                  type="button"
                  onClick={onAdd}
                >
                  <Plus className="size-4" />
                  {editing ? "Update" : "Add"}
                </Button>
                {editing ? (
                  <Button
                    aria-label="Cancel item edit"
                    className="size-11 rounded-md p-0"
                    title="Cancel item edit"
                    type="button"
                    variant="outline"
                    onClick={onReset}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto rounded-md border border-border/70">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
            <thead className="bg-muted/60">
              <tr>
                {[
                  "#",
                  ...(showPo ? ["PO"] : []),
                  ...(showDc ? ["DC"] : []),
                  "Particulars",
                  "HSN Code",
                  ...(showColour ? ["Colour"] : []),
                  ...(showSize ? ["Size"] : []),
                  "Qty",
                  "Rate",
                  "Unit",
                  "Taxable",
                  "GST %",
                  ...(splitTax ? ["CGST", "SGST"] : ["IGST"]),
                  "Total",
                  "Action"
                ].map((heading) => (
                  <th
                    key={heading}
                    className={cn(
                      "border-b border-r border-border/70 px-3 py-2 text-sm font-medium text-muted-foreground last:border-r-0",
                      heading === "Particulars" ? "text-left" : "text-center"
                    )}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const line = computeExportSaleLine(item, taxType);
                return (
                  <tr
                    key={`${item.productName}-${index}`}
                    className="border-b border-border/70 last:border-b-0"
                  >
                    <td className="border-r border-border/70 px-3 py-2">{index + 1}</td>
                    {showPo ? (
                      <td className="border-r border-border/70 px-3 py-2">{item.poNo || "-"}</td>
                    ) : null}
                    {showDc ? (
                      <td className="border-r border-border/70 px-3 py-2">{item.dcNo || "-"}</td>
                    ) : null}
                    <td className="border-r border-border/70 px-3 py-2">
                      {[item.productName, item.description].filter(Boolean).join(" - ")}
                    </td>
                    <td className="border-r border-border/70 px-3 py-2 text-center">
                      {item.hsnCode || "-"}
                    </td>
                    {showColour ? (
                      <td className="border-r border-border/70 px-3 py-2">{item.colour || "-"}</td>
                    ) : null}
                    {showSize ? (
                      <td className="border-r border-border/70 px-3 py-2">{item.size || "-"}</td>
                    ) : null}
                    <td className="border-r border-border/70 px-3 py-2 text-center">
                      {item.quantity}
                    </td>
                    <td className="border-r border-border/70 px-3 py-2 text-right">
                      {formatMoney(item.rate)}
                    </td>
                    <td className="border-r border-border/70 px-3 py-2">{item.unit || "Nos"}</td>
                    <td className="border-r border-border/70 px-3 py-2 text-right">
                      {formatMoney(line.taxableAmount)}
                    </td>
                    <td className="border-r border-border/70 px-3 py-2 text-center">
                      {item.taxRate}%
                    </td>
                    {splitTax ? (
                      <>
                        <td className="border-r border-border/70 px-3 py-2 text-right">
                          {formatMoney(line.cgstAmount)}
                        </td>
                        <td className="border-r border-border/70 px-3 py-2 text-right">
                          {formatMoney(line.sgstAmount)}
                        </td>
                      </>
                    ) : (
                      <td className="border-r border-border/70 px-3 py-2 text-right">
                        {formatMoney(line.igstAmount)}
                      </td>
                    )}
                    <td className="border-r border-border/70 px-3 py-2 text-right font-semibold">
                      {formatMoney(line.lineTotal)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="rounded-md border border-border/70 p-1.5 text-muted-foreground hover:bg-muted"
                          type="button"
                          onClick={() => onEdit(index)}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                          type="button"
                          onClick={() => onRemove(index)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!items.length ? (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-sm text-muted-foreground"
                    colSpan={
                      11 +
                      (showPo ? 1 : 0) +
                      (showDc ? 1 : 0) +
                      (showColour ? 1 : 0) +
                      (showSize ? 1 : 0) +
                      (splitTax ? 2 : 1)
                    }
                  >
                    Add export sale items to see them here.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end">
          <div className="grid w-full max-w-[25rem] gap-3 text-sm">
            <TotalRow label="Taxable amount" value={formatMoney(totals.taxableAmount)} />
            <TotalRow label="GST total" value={formatMoney(totals.taxAmount)} />
            <RoundOffRow
              manual={roundOffManual}
              suggestedValue={suggestedRoundOff}
              value={roundOff}
              onChange={onRoundOffChange}
              onReset={onResetRoundOff}
            />
            <TotalRow label="Grand total" strong value={formatMoney(grandTotal)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportSaleTransportQuickForm({
  initialName,
  onCancel,
  onCreated,
  onSave
}: {
  initialName: string;
  onCancel: () => void;
  onCreated: (option: ExportSaleLookupOption) => void;
  onSave: (payload: ExportSaleTransportSavePayload) => Promise<ExportSaleLookupOption>;
}) {
  const [form, setForm] = useState<ExportSaleTransportSavePayload>({
    address: "",
    contactNo: "",
    contactPerson: "",
    gst: "",
    name: initialName,
    vehicleNo: ""
  });
  const update = (next: Partial<ExportSaleTransportSavePayload>) =>
    setForm((current) => ({ ...current, ...next }));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Transporter name" required>
        <Input value={form.name} onChange={(event) => update({ name: event.target.value })} />
      </Field>
      <Field label="Transporter GST">
        <Input
          value={form.gst}
          onChange={(event) => update({ gst: event.target.value.toUpperCase() })}
        />
      </Field>
      <Field label="Vehicle no">
        <Input
          value={form.vehicleNo}
          onChange={(event) => update({ vehicleNo: event.target.value.toUpperCase() })}
        />
      </Field>
      <Field label="Contact no">
        <Input
          value={form.contactNo}
          onChange={(event) => update({ contactNo: event.target.value })}
        />
      </Field>
      <Field label="Contact person">
        <Input
          value={form.contactPerson}
          onChange={(event) => update({ contactPerson: event.target.value })}
        />
      </Field>
      <Field label="Address">
        <Input value={form.address} onChange={(event) => update({ address: event.target.value })} />
      </Field>
      <div className="flex justify-end gap-2 md:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!form.name.trim()}
          onClick={async () => onCreated(await onSave(form))}
        >
          <Save className="size-4" />
          Save transport
        </Button>
      </div>
    </div>
  );
}

function ExportSaleEwayTab({
  loading,
  onChange,
  onCreateTransport,
  onGenerate,
  onTransportChange,
  options,
  selected,
  value
}: {
  loading: boolean;
  onChange: (next: Partial<ExportSaleEwayDetails>) => void;
  onCreateTransport: (
    payload: ExportSaleTransportSavePayload
  ) => Promise<{ description: string; label: string; meta: string; value: string }>;
  onGenerate: () => void;
  onTransportChange: (value: string, option?: ExportSaleLookupOption | null) => void;
  options: ExportSaleLookupOption[];
  selected: ExportSaleLookupOption | undefined;
  value: ExportSaleEwayDetails;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-3">
        <div className="text-sm text-muted-foreground">
          E-way status{" "}
          <span className="ml-2 rounded-sm bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
            {value.status === "generated" ? "Generated" : "Not generated"}
          </span>
        </div>
        <Button type="button" className="h-9 rounded-md" onClick={onGenerate}>
          <Send className="size-4" />
          Generate
        </Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="E-way bill no">
          <Input
            value={value.billNo}
            onChange={(event) => onChange({ billNo: event.target.value })}
          />
        </Field>
        <Field label="E-way bill date">
          <WorkspaceDatePicker
            value={value.billDate}
            onValueChange={(billDate) => onChange({ billDate })}
          />
        </Field>
        <Field label="Transport">
          <WorkspaceLookup
            createDescription="Add transporter details without leaving this exportSale."
            createLabel="New transport"
            createMode="popup"
            createTitle="New transport"
            emptyLabel="No transport found. Create a new transport."
            loading={loading}
            options={options}
            placeholder="Search transport"
            value={value.transport}
            onTextChange={(next) => onChange({ transport: next })}
            onValueChange={onTransportChange}
            renderCreateForm={({ initialName, onCancel, onCreated }) => (
              <ExportSaleTransportQuickForm
                initialName={initialName}
                onCancel={onCancel}
                onCreated={onCreated}
                onSave={onCreateTransport}
              />
            )}
          />
          {value.transportGst || selected?.record?.gst ? (
            <div className="mt-1 text-xs text-muted-foreground">
              Transporter GST:{" "}
              <span className="font-medium text-foreground">
                {value.transportGst || selected?.record?.gst}
              </span>
            </div>
          ) : null}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="E-way part">
            <WorkspaceSelect
              value={value.part}
              options={[
                { label: "Part A", value: "Part A" },
                { label: "Part B", value: "Part B" }
              ]}
              onValueChange={(part) => onChange({ part: part as ExportSaleEwayDetails["part"] })}
            />
          </Field>
          <Field label="Vehicle no">
            <Input
              value={value.vehicleNo}
              onChange={(event) => onChange({ vehicleNo: event.target.value.toUpperCase() })}
            />
          </Field>
        </div>
      </div>
      <Field label="Transport / vehicle notes">
        <Textarea
          className="min-h-28"
          value={value.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </Field>
    </div>
  );
}

function ExportSaleEinvoiceTab({
  onChange,
  onGenerate,
  value
}: {
  onChange: (next: Partial<ExportSaleEinvoiceDetails>) => void;
  onGenerate: () => void;
  value: ExportSaleEinvoiceDetails;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-3">
        <div className="text-sm text-muted-foreground">
          E-invoice status{" "}
          <span className="ml-2 rounded-sm bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
            {value.status === "generated" ? "Generated" : "Not generated"}
          </span>
        </div>
        <Button type="button" className="h-9 rounded-md" onClick={onGenerate}>
          <Send className="size-4" />
          Generate
        </Button>
      </div>
      <Field label="IRN">
        <Input
          value={value.irn}
          onChange={(event) => onChange({ irn: event.target.value.toUpperCase() })}
        />
      </Field>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="Ack no">
          <Input
            value={value.ackNo}
            onChange={(event) => onChange({ ackNo: event.target.value })}
          />
        </Field>
        <Field label="Ack date">
          <WorkspaceDatePicker
            value={value.ackDate}
            onValueChange={(ackDate) => onChange({ ackDate })}
          />
        </Field>
      </div>
      <Field label="Signed QR">
        <Textarea
          className="min-h-28"
          value={value.signedQr}
          onChange={(event) => onChange({ signedQr: event.target.value })}
        />
      </Field>
    </div>
  );
}

function Field({
  children,
  label,
  required
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-muted-foreground">
      {label}
      {required ? <span className="text-destructive"> *</span> : null}
      {children}
    </label>
  );
}

function ExportSaleProductQuickForm({
  initialValue,
  loading,
  onCancel,
  onSave,
  title
}: {
  initialValue: ExportSaleMasterSavePayload;
  loading: boolean;
  onCancel: () => void;
  onSave: (payload: ExportSaleMasterSavePayload) => Promise<void>;
  title: string;
}) {
  const [form, setForm] = useState(initialValue);
  const categoriesQuery = useQuery({
    queryFn: listExportSaleProductCategories,
    queryKey: ["billing", "exportSale", "lookups", "product-categories"]
  });
  const hsnCodesQuery = useQuery({
    queryFn: listExportSaleHsnCodes,
    queryKey: ["billing", "exportSale", "lookups", "hsn-codes"]
  });
  const unitsQuery = useQuery({
    queryFn: listExportSaleUnits,
    queryKey: ["billing", "exportSale", "lookups", "units"]
  });
  const taxesQuery = useQuery({
    queryFn: listExportSaleTaxes,
    queryKey: ["billing", "exportSale", "lookups", "taxes"]
  });

  function patchProduct(next: Partial<ExportSaleMasterSavePayload>) {
    setForm((current) => ({ ...current, ...next }));
  }

  async function createOption(
    kind: "productCategories" | "hsnCodes" | "units" | "taxes",
    name: string
  ) {
    const value = name.trim();
    const payload =
      kind === "hsnCodes"
        ? { code: value.toUpperCase(), description: value, isActive: true }
        : kind === "taxes"
          ? {
              description: `GST ${Number(value.replace(/%/g, "")) || 0}%`,
              isActive: true,
              ratePercent: Number(value.replace(/%/g, "")) || 0
            }
          : { isActive: true, name: value };
    const created = await createExportSaleLookup(kind, payload);
    const query = {
      productCategories: categoriesQuery,
      hsnCodes: hsnCodesQuery,
      units: unitsQuery,
      taxes: taxesQuery
    }[kind];
    await query.refetch();
    toast.success(
      `${kind === "productCategories" ? "Product category" : kind === "hsnCodes" ? "HSN code" : kind === "units" ? "Unit" : "GST tax rate"} saved`,
      { description: value }
    );
    return created;
  }

  const categoryOptions = (categoriesQuery.data ?? []).map(exportSaleCommonOption);
  const hsnOptions = (hsnCodesQuery.data ?? []).map((record) => ({
    ...exportSaleCommonOption(record),
    label: record.code || record.name || record.id,
    value: record.id
  }));
  const unitOptions = (unitsQuery.data ?? []).map(exportSaleCommonOption);
  const taxOptions = (taxesQuery.data ?? []).map((record) => ({
    ...exportSaleCommonOption(record),
    label: record.name || record.code || `${record.ratePercent ?? record.taxRate ?? 0}%`,
    value: record.id
  }));

  return (
    <form
      className="grid gap-0"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(form);
      }}
    >
      <DialogHeader className="border-b border-border/80 px-5 py-4 pr-12">
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
        <ContactQuickField
          label="Product name"
          required
          value={form.name}
          onChange={(name) => patchProduct({ name })}
        />
        <ProductPopupLookup
          label="Product category"
          loading={categoriesQuery.isLoading}
          options={categoryOptions}
          value={form.productCategoryId || form.productCategoryName || ""}
          placeholder="Search product category"
          onCreate={(name) => createOption("productCategories", name)}
          onValueChange={(value, option) =>
            patchProduct({
              productCategoryId: option?.value ?? value,
              productCategoryName: option?.label ?? value
            })
          }
        />
        <ProductPopupLookup
          label="HSN code"
          loading={hsnCodesQuery.isLoading}
          options={hsnOptions}
          value={form.hsnCodeId || form.hsnCode || ""}
          placeholder="Search HSN code"
          onCreate={(name) => createOption("hsnCodes", name)}
          onValueChange={(value, option) =>
            patchProduct({ hsnCodeId: option?.value ?? value, hsnCode: option?.label ?? value })
          }
        />
        <ProductPopupLookup
          label="Units"
          loading={unitsQuery.isLoading}
          options={unitOptions}
          value={form.unitId || form.unitName || ""}
          placeholder="Search units"
          onCreate={(name) => createOption("units", name)}
          onValueChange={(value, option) =>
            patchProduct({ unitId: option?.value ?? value, unitName: option?.label ?? value })
          }
        />
        <ProductPopupLookup
          numericOnly
          label="GST tax rate"
          loading={taxesQuery.isLoading}
          options={taxOptions}
          value={form.taxId || (form.taxRate !== undefined ? String(form.taxRate) : "")}
          placeholder="Search GST tax rate"
          onCreate={(name) => createOption("taxes", name)}
          onValueChange={(value, option) => {
            const record = option?.record;
            patchProduct({
              taxId: option?.value ?? value,
              taxName: option?.label ?? value,
              taxRate: Number(record?.ratePercent ?? record?.taxRate ?? value) || 0
            });
          }}
        />
        <ContactQuickField
          label="Opening price"
          type="number"
          value={String(form.openingRate)}
          onChange={(openingRate) => patchProduct({ openingRate: Number(openingRate || 0) })}
        />
      </div>
      <DialogFooter className="border-t border-border/80 px-5 py-4">
        <Button disabled={loading} type="button" variant="outline" onClick={onCancel}>
          <X className="size-4" />
          Cancel
        </Button>
        <Button disabled={loading || !form.name.trim()} type="submit">
          <Save className="size-4" />
          Save product
        </Button>
      </DialogFooter>
    </form>
  );
}

function ProductPopupLookup({
  label,
  loading,
  numericOnly = false,
  onCreate,
  onValueChange,
  options,
  placeholder,
  value
}: {
  label: string;
  loading: boolean;
  numericOnly?: boolean;
  onCreate: (name: string) => Promise<ExportSaleLookupRecord>;
  onValueChange: (value: string, option?: ExportSaleLookupOption | null) => void;
  options: ExportSaleLookupOption[];
  placeholder: string;
  value: string;
}) {
  const sanitize = numericOnly
    ? (input: string) => input.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1")
    : undefined;
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      <WorkspaceLookup
        createLabel={`Create ${label.toLowerCase()}`}
        createMode="inline"
        emptyLabel={`No ${label.toLowerCase()} found. Type a value to create it.`}
        loading={loading}
        options={options}
        placeholder={placeholder}
        value={value}
        {...(sanitize ? { sanitizeInput: sanitize } : {})}
        onCreate={async (name) =>
          exportSaleCommonOption(await onCreate(sanitize ? sanitize(name) : name))
        }
        onValueChange={onValueChange}
      />
    </label>
  );
}

function computeExportSaleLine(
  item: ExportSaleSavePayload["items"][number],
  taxType: ExportSaleTaxType
) {
  const taxableAmount = Number(item.quantity || 0) * Number(item.rate || 0);
  const taxAmount = (taxableAmount * Number(item.taxRate || 0)) / 100;
  const igstAmount = taxType === "igst" ? taxAmount : 0;
  const cgstAmount = taxType === "cgst-sgst" ? taxAmount / 2 : 0;
  const sgstAmount = taxType === "cgst-sgst" ? taxAmount / 2 : 0;
  return {
    amount: taxableAmount + taxAmount,
    cgstAmount,
    igstAmount,
    lineTotal: taxableAmount + taxAmount,
    sgstAmount,
    taxAmount,
    taxableAmount
  };
}

function computeExportSaleTotals(
  items: ExportSaleSavePayload["items"],
  taxType: ExportSaleTaxType
) {
  return items.reduce(
    (totals, item) => {
      const line = computeExportSaleLine(item, taxType);
      return {
        amount: totals.amount + line.amount,
        taxAmount: totals.taxAmount + line.taxAmount,
        taxableAmount: totals.taxableAmount + line.taxableAmount
      };
    },
    { amount: 0, taxAmount: 0, taxableAmount: 0 }
  );
}

function computeSuggestedRoundOff(amount: number) {
  const rounded = Math.round(Number(amount || 0));
  return Number((rounded - Number(amount || 0)).toFixed(2));
}

function TotalRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div
      className={cn("grid grid-cols-[1fr_auto_auto] items-center gap-4", strong && "font-semibold")}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">:</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function RoundOffRow({
  manual,
  suggestedValue,
  value,
  onChange,
  onReset
}: {
  manual: boolean;
  suggestedValue: number;
  value: number;
  onChange: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_minmax(5.5rem,6.5rem)] items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Round off</span>
        <button
          className="text-xs font-medium text-orange-500 underline-offset-4 hover:text-orange-600 hover:underline"
          type="button"
          onClick={onReset}
        >
          Auto {manual ? formatSignedMoney(suggestedValue) : ""}
        </button>
      </div>
      <span className="text-muted-foreground">:</span>
      <Input
        className="h-8 rounded-md px-2 text-right text-sm"
        inputMode="decimal"
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function formatSignedMoney(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatMoney(value)}`;
}

function numericId(value: string | number | null | undefined) {
  const id = Number(value ?? 0);
  return Number.isInteger(id) && id > 0 ? id : null;
}
