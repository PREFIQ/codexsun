import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Switch } from "@codexsun/ui/components/switch";
import { WorkspaceAnimatedTabs, type WorkspaceAnimatedTab } from "@codexsun/ui/workspace/animated-tabs";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { useRouterState } from "@tanstack/react-router";
import { PageTitle } from "../../shared/document/PageTitle";
import { BillingLayout } from "../../shared/layout/BillingLayout";
import { saveSalesSettings } from "./settings.services";
import { useSalesSettings } from "./settings.hooks";
import type { BillingSalesSettings } from "./settings.types";

const defaultSettings: BillingSalesSettings = {
  featureQuotation: true,
  gstApiMode: "einvoice_eway",
  useColour: true,
  useDc: false,
  useEinvoice: true,
  useEway: true,
  usePo: false,
  useSize: true,
};

export function SalesSettingsPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <BillingLayout
      currentPath={pathname}
      headerTitle="Sales Settings"
      subtitle="Configure billing sales, quotation, GST, and print controls."
      title="Billing Workspace"
    >
      <PageTitle title="Sales Settings" />
      <SalesSettingsWorkspace />
    </BillingLayout>
  );
}

function SalesSettingsWorkspace() {
  const queryClient = useQueryClient();
  const settingsQuery = useSalesSettings();
  const [activeTab, setActiveTab] = useState("layout");
  const [form, setForm] = useState<BillingSalesSettings>(defaultSettings);

  useEffect(() => {
    if (settingsQuery.data) setForm(settingsQuery.data);
  }, [settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: saveSalesSettings,
    onSuccess: async (settings) => {
      await queryClient.invalidateQueries({ queryKey: ["billing", "settings", "sales"] });
      setForm(settings);
      toast.success("Sales settings published", { description: "Quotation and sales entry screens will use the latest layout." });
    },
    onError: (error) => {
      toast.error("Unable to publish settings", { description: error instanceof Error ? error.message : "Please try again." });
    },
  });

  function patch(next: Partial<BillingSalesSettings>) {
    setForm((current) => ({ ...current, ...next }));
  }

  const tabs: WorkspaceAnimatedTab[] = useMemo(() => [
    {
      value: "layout",
      label: "Layout",
      content: (
        <div className="rounded-md border border-border/70 bg-card/95 p-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Sales Layout</h2>
            <p className="text-sm text-muted-foreground">Toggle fields used by sales and quotation entry screens.</p>
          </div>
          <div className="mt-6 space-y-3">
            <div className="rounded-md border border-border/70 bg-background p-4">
              <label className="text-sm font-semibold text-foreground" htmlFor="gst-api-mode">GST API mode</label>
              <div className="mt-2">
                <WorkspaceSelect
                  ariaLabel="GST API mode"
                  value={form.gstApiMode}
                  options={[
                    { label: "E-invoice + E-way", value: "einvoice_eway" },
                    { label: "E-way only", value: "eway_only" },
                  ]}
                  onValueChange={(gstApiMode) => patch({ gstApiMode: gstApiMode as BillingSalesSettings["gstApiMode"] })}
                />
              </div>
            </div>
            <SettingsToggle checked={form.usePo} label="Use PO in sales" note="Shows PO number on sales and quotation item rows." onChange={(usePo) => patch({ usePo })} />
            <SettingsToggle checked={form.useDc} label="Use DC in sales" note="Shows DC number on sales and quotation item rows." onChange={(useDc) => patch({ useDc })} />
            <SettingsToggle checked={form.useColour} label="Use Colour in sales" note="Shows colour on sales and quotation item rows." onChange={(useColour) => patch({ useColour })} />
            <SettingsToggle checked={form.useSize} label="Use Size in sales" note="Shows size on sales and quotation item rows." onChange={(useSize) => patch({ useSize })} />
            <SettingsToggle checked={form.useEinvoice} label="Use E-invoice in sales" note="Shows the E-invoice details tab on sales upsert." onChange={(useEinvoice) => patch({ useEinvoice })} />
            <SettingsToggle checked={form.useEway} label="Use E-way in sales" note="Shows the E-way details tab on sales upsert." onChange={(useEway) => patch({ useEway })} />
          </div>
        </div>
      ),
    },
    {
      value: "printing",
      label: "Printing",
      content: <PlaceholderPanel title="Printing" note="Print controls will use the active quotation and sales layout." />,
    },
    {
      value: "customise",
      label: "Customise",
      content: <PlaceholderPanel title="Customise" note="Template customisation controls are ready for billing print layouts." />,
    },
    {
      value: "features",
      label: "Features",
      content: (
        <div className="rounded-md border border-border/70 bg-card/95 p-4 shadow-sm">
          <SettingsToggle checked={form.featureQuotation} label="Enable quotations" note="Shows quotation list, entry, preview, and conversion workspace." onChange={(featureQuotation) => patch({ featureQuotation })} />
        </div>
      ),
    },
  ], [form]);

  return (
    <WorkspacePage
      title="Sales Settings"
      description="Configure sales layout, customisation, and print controls."
      technicalName="page.billing.settings.sales"
      actions={
        <Button className="h-9 rounded-md" disabled={mutation.isPending || settingsQuery.isLoading} onClick={() => mutation.mutate(form)} type="button">
          <Save className="size-4" />
          Publish live
        </Button>
      }
    >
      <WorkspaceAnimatedTabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
    </WorkspacePage>
  );
}

function SettingsToggle({ checked, label, note, onChange }: { checked: boolean; label: string; note: string; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 rounded-md border border-border/70 bg-background px-4 py-3 shadow-sm">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Industry</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{note}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function PlaceholderPanel({ note, title }: { note: string; title: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-card/95 p-5 text-sm text-muted-foreground shadow-sm">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1">{note}</p>
    </div>
  );
}

