import type { PlatformAppDefinition, PlatformAppId } from "./app-registry.types.js";

export const platformAppRegistry: PlatformAppDefinition[] = [
  {
    alwaysEnabled: true,
    defaultLanding: true,
    description: "Platform workspace, tenant profile, application settings, users, and access.",
    id: "application",
    label: "Application",
    moduleKey: "platform.application",
    stack: "platform"
  },
  {
    alwaysEnabled: false,
    defaultLanding: false,
    description: "Billing sales, core masters, invoice flow, and billing setup.",
    id: "billing",
    label: "Billing",
    moduleKey: "billing.sales",
    stack: "billing"
  }
];

export function resolveEnabledApps(enabledModuleKeys: string[]) {
  const enabled = new Set(["platform.application", ...enabledModuleKeys]);
  return platformAppRegistry.map((app) => ({
    ...app,
    enabled: app.alwaysEnabled || enabled.has(app.moduleKey)
  }));
}

export function resolveLandingApp(value: unknown, enabledModuleKeys: string[]): PlatformAppId {
  const enabledApps = resolveEnabledApps(enabledModuleKeys).filter((app) => app.enabled);
  const requested = typeof value === "string" ? value : "";
  if (enabledApps.some((app) => app.id === requested)) {
    return requested as PlatformAppId;
  }
  return "application";
}
