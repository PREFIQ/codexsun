import { useEffect, useMemo, useState } from "react";
import { SaveIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceShowCard } from "@codexsun/ui/workspace/show";
import { WorkspaceSwitchCard } from "@codexsun/ui/workspace/status";
import { WorkspaceFormField } from "@codexsun/ui/workspace/upsert";
import { usePlatformAppsQuery } from "../app-registry";
import { updateTenantAppConnections } from "./tenant.services";
import type { Tenant } from "./tenant.types";

export function TenantAppConnections({
  onUpdated,
  tenant
}: {
  onUpdated: (tenant: Tenant) => void;
  tenant: Tenant;
}) {
  const client = useQueryClient();
  const appsQuery = usePlatformAppsQuery();
  const [enabledKeys, setEnabledKeys] = useState(() => tenant.enabledModuleKeys);
  const [landingApp, setLandingApp] = useState<Tenant["defaultLandingApp"]>(
    tenant.defaultLandingApp
  );
  const apps = appsQuery.data ?? [];

  useEffect(() => {
    setEnabledKeys(tenant.enabledModuleKeys);
    setLandingApp(tenant.defaultLandingApp);
  }, [tenant]);

  const enabledApps = useMemo(
    () =>
      apps.filter(
        (app) =>
          app.alwaysEnabled ||
          app.moduleKey === "platform.application" ||
          enabledKeys.includes(app.moduleKey)
      ),
    [apps, enabledKeys]
  );
  const save = useMutation({
    mutationFn: () => {
      const normalizedEnabled = Array.from(
        new Set(["platform.application", ...enabledKeys])
      ).sort();
      const disabled = apps
        .filter((app) => !app.alwaysEnabled && !normalizedEnabled.includes(app.moduleKey))
        .map((app) => app.moduleKey);
      return updateTenantAppConnections(tenant, normalizedEnabled, disabled, landingApp);
    },
    onError: (error) =>
      toast.error("App connections could not be saved", {
        description: error instanceof Error ? error.message : "Update failed."
      }),
    onSuccess: async (updated) => {
      await client.invalidateQueries({ queryKey: ["admin", "tenants"] });
      onUpdated(updated);
      toast.success("Tenant app connections updated");
    }
  });

  useEffect(() => {
    if (!enabledApps.some((app) => app.appId === landingApp)) {
      setLandingApp("application");
    }
  }, [enabledApps, landingApp]);

  return (
    <div className="space-y-4">
      <WorkspaceShowCard title="Default connection">
        <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <WorkspaceFormField label="Landing app">
            <WorkspaceSelect
              value={landingApp}
              options={enabledApps.map((app) => ({ label: app.label, value: app.appId }))}
              onValueChange={(value) => setLandingApp(value as Tenant["defaultLandingApp"])}
            />
          </WorkspaceFormField>
          <Button
            type="button"
            disabled={save.isPending || appsQuery.isLoading}
            onClick={() => save.mutate()}
          >
            <SaveIcon className="size-4" />
            {save.isPending ? "Saving..." : "Save connections"}
          </Button>
        </div>
      </WorkspaceShowCard>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {apps.map((app) => {
          const locked = app.alwaysEnabled || app.moduleKey === "platform.application";
          const enabled = locked || enabledKeys.includes(app.moduleKey);
          return (
            <WorkspaceSwitchCard
              key={app.id}
              ariaLabel={`${app.label} tenant connection`}
              checked={enabled}
              description={app.description}
              disabled={locked}
              fieldLabel={app.label}
              onCheckedChange={(checked) =>
                setEnabledKeys((current) =>
                  checked
                    ? Array.from(new Set([...current, app.moduleKey]))
                    : current.filter((key) => key !== app.moduleKey)
                )
              }
            />
          );
        })}
      </div>
    </div>
  );
}
