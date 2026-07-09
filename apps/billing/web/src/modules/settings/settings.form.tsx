import { Save } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Switch } from "@codexsun/ui/components/switch";
import { WorkspaceFormField, WorkspaceFormPanel, WorkspaceSelect } from "@codexsun/ui/workspace";
import type { BillingDocumentKind, BillingDocumentLayoutSettings, BillingSettings } from "./settings.types";

const documentKinds: BillingDocumentKind[] = ["quotation", "sales", "purchase"];
const layoutKeys: Array<keyof BillingDocumentLayoutSettings> = ["usePo", "useDc", "useColour", "useSize", "useEinvoice", "useEway"];

export function SalesSettingsForm({ loading, onChange, onSave, settings }: { loading: boolean; onChange: (settings: BillingSettings) => void; onSave: () => void; settings: BillingSettings }) {
  function patchLayout(kind: BillingDocumentKind, key: keyof BillingDocumentLayoutSettings, checked: boolean) {
    onChange({
      ...settings,
      layout: {
        ...settings.layout,
        [kind]: {
          ...settings.layout[kind],
          [key]: checked,
        },
      },
    });
  }

  return (
    <WorkspaceFormPanel title="Billing settings">
      <div className="space-y-4">
        <WorkspaceFormField label="GST mode"><WorkspaceSelect value={settings.gstApiMode} options={[{ label: "E-Invoice + E-Way", value: "einvoice_eway" }, { label: "E-Way only", value: "eway_only" }]} onValueChange={(gstApiMode) => onChange({ ...settings, gstApiMode: gstApiMode as BillingSettings["gstApiMode"] })} /></WorkspaceFormField>
        {documentKinds.map((kind) => (
          <div className="rounded-md border p-3" key={kind}>
            <div className="mb-3 text-sm font-semibold capitalize">{kind}</div>
            <div className="grid gap-3 md:grid-cols-2">
              {layoutKeys.map((key) => (
                <label className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm font-medium" key={`${kind}-${key}`}>
                  {key.replace(/^use/, "")}
                  <Switch checked={settings.layout[kind][key]} onCheckedChange={(checked) => patchLayout(kind, key, checked)} />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end border-t pt-4"><Button type="button" disabled={loading} onClick={onSave}><Save className="size-4" />Save</Button></div>
    </WorkspaceFormPanel>
  );
}
