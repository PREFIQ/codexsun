import {
  Building2Icon,
  CreditCardIcon,
  Globe2Icon,
  LayoutDashboardIcon,
  ReceiptTextIcon,
  Settings2Icon,
  type LucideIcon
} from "lucide-react";
import type { SidemenuItem } from "@codexsun/ui/blocks/menu/sidemenu/sub/sidemenu-section";

export type PlatformAppId = "application" | "billing";

export type PlatformAppDefinition = {
  accentClass: string;
  alwaysEnabled: boolean;
  defaultLanding: boolean;
  description: string;
  id: PlatformAppId;
  icon: LucideIcon;
  label: string;
  moduleKey: string;
  stack: "platform" | "billing";
};

export const platformAppRegistry: PlatformAppDefinition[] = [
  {
    accentClass: "bg-slate-950",
    alwaysEnabled: true,
    defaultLanding: true,
    description: "Platform workspace, tenant profile, application settings, users, and access.",
    icon: LayoutDashboardIcon,
    id: "application",
    label: "Application",
    moduleKey: "platform.application",
    stack: "platform"
  },
  {
    accentClass: "bg-emerald-600",
    alwaysEnabled: true,
    defaultLanding: false,
    description: "Sales, purchase, receipt, payment, report, master, common, and billing settings.",
    icon: ReceiptTextIcon,
    id: "billing",
    label: "Billing",
    moduleKey: "billing.sales",
    stack: "billing"
  }
];

export function normalizeModuleKeys(moduleKeys: string[]) {
  return Array.from(
    new Set(["platform.application", ...moduleKeys.map((key) => (key === "platform.tenant" ? "platform.application" : key))])
  );
}

export function enabledAppIds(moduleKeys: string[]) {
  const enabled = new Set(normalizeModuleKeys(moduleKeys));
  return platformAppRegistry.filter((app) => app.alwaysEnabled || enabled.has(app.moduleKey)).map((app) => app.id);
}

export function defaultLandingApp(value: unknown, moduleKeys: string[]): PlatformAppId {
  const requested = typeof value === "string" ? value : "";
  const enabled = enabledAppIds(moduleKeys);
  return enabled.includes(requested as PlatformAppId) ? (requested as PlatformAppId) : "application";
}

export function appMenuFor(appId: PlatformAppId, activePage: string, onSelect: (page: string) => void): SidemenuItem {
  if (appId === "billing") {
    return {
      icon: ReceiptTextIcon,
      isActive: activePage.startsWith("billing") || activePage.startsWith("core"),
      title: "Billing",
      items: [
        { title: "Overview", isActive: activePage === "billing.overview", onSelect: () => onSelect("billing.overview") },
        { title: "Sales", isActive: activePage === "billing.sales", onSelect: () => onSelect("billing.sales") },
        {
          title: "Core",
          isActive: activePage.startsWith("core"),
          items: [
            { title: "Countries", isActive: activePage === "core.country", onSelect: () => onSelect("core.country") }
          ]
        },
        { title: "Billing Settings", isActive: activePage === "billing.settings", onSelect: () => onSelect("billing.settings") }
      ]
    };
  }

  return {
    icon: Building2Icon,
    isActive: activePage.startsWith("application"),
    title: "Application",
    items: [
      { title: "Overview", isActive: activePage === "application.overview", onSelect: () => onSelect("application.overview") },
      { title: "Landing Desk", isActive: activePage === "application.landing", onSelect: () => onSelect("application.landing") },
      { title: "Platform Profile", isActive: activePage === "application.profile", onSelect: () => onSelect("application.profile") },
      { title: "Settings", isActive: activePage === "application.settings", onSelect: () => onSelect("application.settings") }
    ]
  };
}

export function appWorkspaceItems(enabledApps: PlatformAppId[], activeApp: PlatformAppId) {
  return platformAppRegistry
    .filter((app) => enabledApps.includes(app.id))
    .map((app) => ({
      active: app.id === activeApp,
      description: app.description,
      icon: app.icon,
      title: app.label,
      url: app.id === "application" ? "/app/application/overview" : "/app/billing/overview"
    }));
}

export const applicationPageIcons = {
  application: Building2Icon,
  billing: CreditCardIcon,
  core: Globe2Icon,
  settings: Settings2Icon
};
