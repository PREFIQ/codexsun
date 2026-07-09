import { WorkspaceStatusBadge, WorkspaceTableHeaderCell, WorkspaceTablePanel } from "@codexsun/ui/workspace";
import type { BillingDocumentKind, BillingSettings } from "./settings.types";

const documentKinds: BillingDocumentKind[] = ["quotation", "sales", "purchase"];

export function SettingsList({ settings }: { settings: BillingSettings }) {
  const rows = documentKinds.flatMap((kind) => [
    [`${kind} enabled`, settings.features[kind]],
    [`${kind} PO`, settings.layout[kind].usePo],
    [`${kind} DC`, settings.layout[kind].useDc],
    [`${kind} Colour`, settings.layout[kind].useColour],
    [`${kind} Size`, settings.layout[kind].useSize],
    [`${kind} E-Invoice`, settings.layout[kind].useEinvoice],
    [`${kind} E-Way`, settings.layout[kind].useEway],
  ] as const);

  return (
    <WorkspaceTablePanel>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/45"><tr><WorkspaceTableHeaderCell>Setting</WorkspaceTableHeaderCell><WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell></tr></thead>
        <tbody>
          {rows.map(([label, enabled]) => (
            <tr className="border-b border-border/70 last:border-0" key={label}>
              <td className="px-4 py-2.5 font-medium">{label}</td>
              <td className="px-4 py-2.5"><WorkspaceStatusBadge label={enabled ? "Enabled" : "Off"} tone={enabled ? "success" : "neutral"} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </WorkspaceTablePanel>
  );
}
