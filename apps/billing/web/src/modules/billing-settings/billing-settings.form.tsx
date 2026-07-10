import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFormPanel } from "@codexsun/ui/workspace";
import { BillingSettingsWorkspace } from "./billing-settings.workspace";

export function BillingSettingsForm() {
  return (
    <WorkspaceFormPanel title="Billing settings" description="Tenant-owned billing settings editor.">
      <BillingSettingsWorkspace />
      <Button type="button">Review settings</Button>
    </WorkspaceFormPanel>
  );
}
