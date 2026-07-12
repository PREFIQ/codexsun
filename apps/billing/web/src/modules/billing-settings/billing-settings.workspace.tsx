import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { Textarea } from "@codexsun/ui/components/textarea";
import {
  WorkspaceAnimatedTabs,
  type WorkspaceAnimatedTab
} from "@codexsun/ui/workspace/animated-tabs";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { getBillingSettings, saveBillingSettings } from "./billing-settings.services";
import {
  defaultBillingSettings,
  type BillingDocumentKind,
  type BillingDocumentLayoutSettings,
  type BillingSettings
} from "./billing-settings.types";

const documents: Array<{ key: BillingDocumentKind; label: string; note: string }> = [
  {
    key: "quotation",
    label: "Quotation",
    note: "Quotation entry, item table, preview, and print controls."
  },
  {
    key: "sales",
    label: "Sales",
    note: "Sales invoice entry, item rows, E-invoice, and E-way controls."
  },
  {
    key: "purchase",
    label: "Purchase",
    note: "Purchase entry, supplier items, and GST transport controls."
  }
];

const switches: Array<{ key: keyof BillingDocumentLayoutSettings; label: string }> = [
  { key: "usePo", label: "PO" },
  { key: "useDc", label: "DC" },
  { key: "useColour", label: "Colour" },
  { key: "useSize", label: "Size" },
  { key: "useEinvoice", label: "E-invoice" },
  { key: "useEway", label: "E-way" }
];

export function BillingSettingsWorkspace() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryFn: getBillingSettings,
    queryKey: ["billing", "settings"]
  });
  const [activeTab, setActiveTab] = useState("layout");
  const [form, setForm] = useState<BillingSettings>(defaultBillingSettings);

  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: saveBillingSettings,
    onSuccess: async (settings) => {
      setForm(settings);
      await queryClient.invalidateQueries({ queryKey: ["billing", "settings"] });
      toast.success("Billing settings published", {
        description: "Quotation, sales, and purchase screens will use the updated controls."
      });
    },
    onError: (error) => {
      toast.error("Unable to publish billing settings", {
        description: error instanceof Error ? error.message : "Please try again."
      });
    }
  });

  function patchLayout(next: Partial<BillingDocumentLayoutSettings>) {
    setForm((current) => ({
      ...current,
      layout: { ...current.layout, ...next }
    }));
  }

  function patchFeature(kind: keyof BillingSettings["features"], enabled: boolean) {
    setForm((current) => ({
      ...current,
      features: { ...current.features, [kind]: enabled }
    }));
  }

  function patchPrinting(next: Partial<BillingSettings["printing"]>) {
    setForm((current) => ({ ...current, printing: { ...current.printing, ...next } }));
  }

  function patchLetterhead(next: Partial<BillingSettings["printing"]["letterhead"]>) {
    setForm((current) => ({
      ...current,
      printing: {
        ...current.printing,
        letterhead: { ...current.printing.letterhead, ...next }
      }
    }));
  }

  function patchCustomise(next: Partial<BillingSettings["customise"]>) {
    setForm((current) => ({ ...current, customise: { ...current.customise, ...next } }));
  }

  const tabs: WorkspaceAnimatedTab[] = useMemo(
    () => [
      {
        label: "Layout",
        value: "layout",
        content: (
          <SettingsPanel
            title="Billing Layout"
            note="Industry switches control fields independently for each billing document."
          >
            <div className="rounded-md border border-border/70 bg-background p-4">
              <div className="text-sm font-semibold">GST API mode</div>
              <div className="mt-2">
                <WorkspaceSelect
                  value={form.gstApiMode}
                  options={[
                    { label: "E-invoice + E-way", value: "einvoice_eway" },
                    { label: "E-way only", value: "eway_only" }
                  ]}
                  onValueChange={(gstApiMode) =>
                    setForm((current) => ({
                      ...current,
                      gstApiMode: gstApiMode as BillingSettings["gstApiMode"]
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-3">
              {switches.map((item) => (
                <ToggleRow
                  key={item.key}
                  checked={form.layout[item.key]}
                  label={item.label}
                  note={`Show ${item.label} controls in quotation, sales, and purchase.`}
                  onChange={(checked) => patchLayout({ [item.key]: checked })}
                />
              ))}
            </div>
          </SettingsPanel>
        )
      },
      {
        label: "Printing",
        value: "printing",
        content: (
          <SettingsPanel
            title="Billing Printing"
            note="Shared print and letterhead controls for quotation, sales, and purchase."
          >
            <ToggleRow
              checked={form.printing.printWithLogo}
              label="Print with logo"
              note="Shows the active company logo in every billing document header."
              onChange={(printWithLogo) => patchPrinting({ printWithLogo })}
              badge="Client"
            />
            <ToggleRow
              checked={form.printing.printAccountNumber}
              label="Print account no"
              note="Shows the company bank account number in billing document bank details."
              onChange={(printAccountNumber) => patchPrinting({ printAccountNumber })}
              badge="Client"
            />
            <ToggleRow
              checked={form.printing.printQrAccountDetails}
              label="Print QR account details"
              note="Controls whether QR account details are printed on billing documents."
              onChange={(printQrAccountDetails) => patchPrinting({ printQrAccountDetails })}
              badge="Client"
            />
            <label className="block rounded-md border border-border/70 bg-background p-4">
              <span className="text-sm font-semibold">Customer address layout</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Choose whether documents print billing only, or both billing and shipping addresses.
              </span>
              <select
                className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.printing.addressMode}
                onChange={(event) =>
                  patchPrinting({
                    addressMode: event.target.value as "billing_only" | "billing_and_shipping"
                  })
                }
              >
                <option value="billing_only">Billing only — document details on the right</option>
                <option value="billing_and_shipping">Billing and shipping</option>
              </select>
            </label>
            <label className="block rounded-md border border-border/70 bg-background p-4">
              <span className="text-sm font-semibold">Custom terms</span>
              <Textarea
                className="mt-3 min-h-24 resize-y rounded-md"
                value={form.printing.customTerms}
                onChange={(event) => patchPrinting({ customTerms: event.target.value })}
              />
            </label>
            <LetterheadDesigner
              settings={form.printing.letterhead}
              showLogo={form.printing.printWithLogo}
              onChange={patchLetterhead}
            />
          </SettingsPanel>
        )
      },
      {
        label: "Customise",
        value: "customise",
        content: (
          <SettingsPanel
            title="Bill Customise"
            note="Shared document names, language, and totals presentation."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {documents.map((document) => (
                <SettingsField key={document.key} label={`${document.label} title`}>
                  <Input
                    className="h-10 rounded-md"
                    value={form.customise.documentTitles[document.key]}
                    onChange={(event) =>
                      patchCustomise({
                        documentTitles: {
                          ...form.customise.documentTitles,
                          [document.key]: event.target.value
                        }
                      })
                    }
                  />
                </SettingsField>
              ))}
            </div>
            <SettingsField label="Print language">
              <WorkspaceSelect
                value={form.customise.printLanguage}
                options={[{ label: "English", value: "english" }]}
                onValueChange={() => undefined}
              />
            </SettingsField>
          </SettingsPanel>
        )
      },
      {
        label: "Features",
        value: "features",
        content: (
          <SettingsPanel
            title="Billing Features"
            note="Enable or disable complete billing document flows."
          >
            <ToggleRow
              checked={form.features.quotation}
              label="Quotation"
              note="Shows quotation entries and enables quotation consolidation into draft sales invoices."
              onChange={(quotation) => patchFeature("quotation", quotation)}
              badge="Client"
            />
            <ToggleRow
              checked={form.features.exportSales}
              label="Export Sales"
              note="Shows export sales entries, totals, shortcuts, and document settings."
              onChange={(exportSales) => patchFeature("exportSales", exportSales)}
              badge="Client"
            />
            <ToggleRow
              checked={form.features.tconnect}
              label="TConnect"
              note="Shows the TConnect trade connection workspace in the client app menu and landing desk."
              onChange={(tconnect) => patchFeature("tconnect", tconnect)}
              badge="Client"
            />
          </SettingsPanel>
        )
      }
    ],
    [form]
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground/80">
            Billing Settings
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground/70">
            Configure billing layout, printing, customisation, and feature controls.
          </p>
        </div>
        <Button
          className="h-9 rounded-md"
          disabled={query.isLoading || mutation.isPending}
          onClick={() => mutation.mutate(form)}
          type="button"
        >
          <Save className="size-4" />
          Publish live
        </Button>
      </div>
      {query.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {query.error instanceof Error
            ? query.error.message
            : "Billing settings could not be loaded."}
        </div>
      ) : null}
      <WorkspaceAnimatedTabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
    </section>
  );
}

function ToggleRow({
  badge = "Industry",
  checked,
  disabled = false,
  label,
  note,
  onChange
}: {
  badge?: "Client" | "Industry";
  checked: boolean;
  disabled?: boolean;
  label: string;
  note: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-3 rounded-md border border-border/70 bg-card px-4 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold">{label}</div>
          <span
            className={
              badge === "Industry"
                ? "rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700"
                : "rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700"
            }
          >
            {badge}
          </span>
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{note}</div>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

function SettingsPanel({
  children,
  note,
  title
}: {
  children?: React.ReactNode;
  note: string;
  title: string;
}) {
  return (
    <div className="space-y-4 rounded-md border border-border/70 bg-card/95 p-4 shadow-sm">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </div>
  );
}

function SettingsField({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block rounded-md border border-border/70 bg-background p-4">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function LetterheadDesigner({
  onChange,
  settings,
  showLogo
}: {
  onChange: (next: Partial<BillingSettings["printing"]["letterhead"]>) => void;
  settings: BillingSettings["printing"]["letterhead"];
  showLogo: boolean;
}) {
  const fields: Array<{ key: keyof typeof settings; label: string; type?: "color" | "number" }> = [
    { key: "companyFont", label: "Company font" },
    { key: "addressFont", label: "Address font" },
    { key: "companySize", label: "Company size", type: "number" },
    { key: "addressSize", label: "Address size", type: "number" },
    { key: "contactSize", label: "Contact size", type: "number" },
    { key: "taxSize", label: "Tax size", type: "number" },
    { key: "headerHeightMm", label: "Header height mm", type: "number" },
    { key: "logoHeightMm", label: "Logo height mm", type: "number" },
    { key: "logoWidthMm", label: "Logo width mm", type: "number" },
    { key: "logoLeftMm", label: "Logo left mm", type: "number" },
    { key: "logoTopMm", label: "Logo top mm", type: "number" },
    { key: "companyColor", label: "Company color", type: "color" },
    { key: "addressColor", label: "Address color", type: "color" },
    { key: "borderColor", label: "Border color", type: "color" }
  ];

  return (
    <div className="rounded-md border border-border/70 bg-background p-4">
      <div
        className="relative overflow-hidden rounded-md border bg-white"
        style={{
          borderColor: settings.borderColor,
          height: `${Math.max(settings.headerHeightMm * 3.6, 140)}px`
        }}
      >
        {showLogo ? (
          <div
            className="absolute flex items-center justify-center rounded-md border-2 border-neutral-700 text-lg font-bold text-neutral-700"
            style={{
              height: `${settings.logoHeightMm * 3}px`,
              left: `${settings.logoLeftMm * 3}px`,
              top: `${settings.logoTopMm * 3}px`,
              width: `${settings.logoWidthMm * 3}px`
            }}
          >
            CS
          </div>
        ) : null}
        <div className="absolute inset-x-32 top-1/2 -translate-y-1/2 text-center">
          <div
            style={{
              color: settings.companyColor,
              fontFamily: settings.companyFont,
              fontSize: `${settings.companySize}px`,
              fontWeight: 700
            }}
          >
            CODEXSUN
          </div>
          <div
            style={{
              color: settings.addressColor,
              fontFamily: settings.addressFont,
              fontSize: `${settings.addressSize}px`
            }}
          >
            address1, ADDRESS 2
          </div>
          <div
            style={{
              color: settings.addressColor,
              fontFamily: settings.addressFont,
              fontSize: `${settings.contactSize}px`
            }}
          >
            Tiruppur, Tamil Nadu, India - 641602
          </div>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-semibold">Letterhead Designer</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Used by quotation, sales, purchase, receipt, payment, stock documents, and statements.
        </p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {fields.map((field) => (
          <label key={field.key} className="text-sm text-muted-foreground">
            <span className="mb-1.5 block">{field.label}</span>
            <Input
              className={
                field.type === "color"
                  ? "h-10 w-14 cursor-pointer rounded-md p-1"
                  : "h-10 rounded-md"
              }
              type={field.type ?? "text"}
              value={settings[field.key]}
              onChange={(event) =>
                onChange({
                  [field.key]:
                    field.type === "number" ? Number(event.target.value) : event.target.value
                })
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}
