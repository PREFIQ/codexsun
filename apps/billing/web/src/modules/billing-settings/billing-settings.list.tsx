import { WorkspaceStatusBadge, WorkspaceTableHeaderCell, WorkspaceTablePanel } from "@codexsun/ui/workspace";
import { defaultBillingSettings } from "./billing-settings.types";

export function BillingSettingsList() {
  return (
    <WorkspaceTablePanel>
      <thead>
        <tr>
          <WorkspaceTableHeaderCell>Area</WorkspaceTableHeaderCell>
          <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
        </tr>
      </thead>
      <tbody>
        {Object.keys(defaultBillingSettings.features).map((feature) => (
          <tr key={feature}>
            <td className="px-3 py-2 text-sm capitalize">{feature}</td>
            <td className="px-3 py-2"><WorkspaceStatusBadge label="Active" tone="success" /></td>
          </tr>
        ))}
      </tbody>
    </WorkspaceTablePanel>
  );
}
