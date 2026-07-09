import {
  Building2Icon,
  CircleGaugeIcon,
  CreditCardIcon,
  Globe2Icon,
  LandmarkIcon,
  MapPinnedIcon,
  PackageIcon,
  Settings2Icon,
  UsersIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  ReceiptTextIcon,
  type LucideIcon
} from "lucide-react";
import type { SidemenuItem } from "@codexsun/ui/blocks/menu/sidemenu/sub/sidemenu-section";
import { commonMasterDefinitions } from "../modules/common/registry";

export type PlatformAppId = "application" | "billing" | "accounts";

export type PlatformAppDefinition = {
  accentClass: string;
  alwaysEnabled: boolean;
  defaultLanding: boolean;
  description: string;
  id: PlatformAppId;
  icon: LucideIcon;
  label: string;
  moduleKey: string;
  stack: "platform" | "billing" | "accounts";
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
    alwaysEnabled: false,
    defaultLanding: false,
    description: "Sales, purchase, receipt, payment, report, master, common, and billing settings.",
    icon: ReceiptTextIcon,
    id: "billing",
    label: "Billing",
    moduleKey: "billing.sales",
    stack: "billing"
  },
  {
    accentClass: "bg-blue-700",
    alwaysEnabled: false,
    defaultLanding: false,
    description: "Ledgers, vouchers, double-entry postings, balances, reports, and Tally-ready accounting.",
    icon: LandmarkIcon,
    id: "accounts",
    label: "Accounts",
    moduleKey: "accounts.ledgers",
    stack: "accounts"
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
          title: "Common",
          isActive: activePage.startsWith("core.common"),
          items: [
            {
              icon: MapPinnedIcon,
              title: "Location",
              isActive: activePage.startsWith("core.common.location"),
              items: [
                { title: "Countries", isActive: activePage === "core.common.location.countries", onSelect: () => onSelect("core.common.location.countries") },
                { title: "States", isActive: activePage === "core.common.location.states", onSelect: () => onSelect("core.common.location.states") },
                { title: "Districts", isActive: activePage === "core.common.location.districts", onSelect: () => onSelect("core.common.location.districts") },
                { title: "Cities", isActive: activePage === "core.common.location.cities", onSelect: () => onSelect("core.common.location.cities") },
                { title: "Pincodes", isActive: activePage === "core.common.location.pincodes", onSelect: () => onSelect("core.common.location.pincodes") }
              ]
            },
            ...commonMasterMenuGroups(activePage, onSelect)
          ]
        },
        { title: "Billing Settings", isActive: activePage === "billing.settings", onSelect: () => onSelect("billing.settings") }
      ]
    };
  }

  if (appId === "accounts") {
    return {
      icon: LandmarkIcon,
      isActive: activePage.startsWith("accounts"),
      title: "Accounts",
      items: [
        { title: "Overview", isActive: activePage === "accounts.overview", onSelect: () => onSelect("accounts.overview") },
        { title: "Ledgers", isActive: activePage === "accounts.ledgers", onSelect: () => onSelect("accounts.ledgers") },
        { title: "Vouchers", isActive: activePage === "accounts.vouchers", onSelect: () => onSelect("accounts.vouchers") },
        { title: "Reports", isActive: activePage === "accounts.reports", onSelect: () => onSelect("accounts.reports") },
        { title: "Accounts Settings", isActive: activePage === "accounts.settings", onSelect: () => onSelect("accounts.settings") }
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

export function appMenuItemsFor(appId: PlatformAppId, activePage: string, onSelect: (page: string) => void): SidemenuItem[] {
  if (appId === "billing") {
    return [
      {
        icon: CircleGaugeIcon,
        isActive: activePage === "billing.overview",
        onSelect: () => onSelect("billing.overview"),
        title: "Overview"
      },
      {
        icon: ReceiptTextIcon,
        isActive: activePage === "billing.quotation" || activePage === "billing.sales" || activePage === "billing.settings",
        title: "Billing",
        items: [
          { title: "Quotation", isActive: activePage === "billing.quotation", onSelect: () => onSelect("billing.quotation") },
          { title: "Sales", isActive: activePage === "billing.sales", onSelect: () => onSelect("billing.sales") },
          { title: "Billing Settings", isActive: activePage === "billing.settings", onSelect: () => onSelect("billing.settings") }
        ]
      },
      {
        icon: Globe2Icon,
        isActive: activePage.startsWith("core.common"),
        title: "Common",
        items: [
          {
            icon: MapPinnedIcon,
            title: "Location",
            isActive: activePage.startsWith("core.common.location"),
            items: [
              { title: "Countries", isActive: activePage === "core.common.location.countries", onSelect: () => onSelect("core.common.location.countries") },
              { title: "States", isActive: activePage === "core.common.location.states", onSelect: () => onSelect("core.common.location.states") },
              { title: "Districts", isActive: activePage === "core.common.location.districts", onSelect: () => onSelect("core.common.location.districts") },
              { title: "Cities", isActive: activePage === "core.common.location.cities", onSelect: () => onSelect("core.common.location.cities") },
              { title: "Pincodes", isActive: activePage === "core.common.location.pincodes", onSelect: () => onSelect("core.common.location.pincodes") }
            ]
          },
          ...commonMasterMenuGroups(activePage, onSelect)
        ]
      }
    ];
  }

  if (appId === "accounts") {
    return [
      {
        icon: CircleGaugeIcon,
        isActive: activePage === "accounts.overview",
        onSelect: () => onSelect("accounts.overview"),
        title: "Overview"
      },
      {
        icon: LandmarkIcon,
        isActive: activePage.startsWith("accounts") && activePage !== "accounts.overview",
        title: "Accounts",
        items: [
          { title: "Ledgers", isActive: activePage === "accounts.ledgers", onSelect: () => onSelect("accounts.ledgers") },
          { title: "Vouchers", isActive: activePage === "accounts.vouchers", onSelect: () => onSelect("accounts.vouchers") },
          { title: "Reports", isActive: activePage === "accounts.reports", onSelect: () => onSelect("accounts.reports") },
          { title: "Accounts Settings", isActive: activePage === "accounts.settings", onSelect: () => onSelect("accounts.settings") }
        ]
      }
    ];
  }

  return [
    {
      icon: CircleGaugeIcon,
      isActive: activePage === "application.overview",
      onSelect: () => onSelect("application.overview"),
      title: "Overview"
    },
    {
      icon: Building2Icon,
      isActive: activePage.startsWith("application") && activePage !== "application.overview",
      title: "Application",
      items: [
        { title: "Landing Desk", isActive: activePage === "application.landing", onSelect: () => onSelect("application.landing") },
        { title: "Platform Profile", isActive: activePage === "application.profile", onSelect: () => onSelect("application.profile") },
        { title: "Settings", isActive: activePage === "application.settings", onSelect: () => onSelect("application.settings") }
      ]
    }
  ];
}

export function appWorkspaceItems(enabledApps: PlatformAppId[], activeApp: PlatformAppId) {
  return platformAppRegistry
    .filter((app) => enabledApps.includes(app.id))
    .map((app) => ({
      active: app.id === activeApp,
      description: app.description,
      icon: app.icon,
      title: app.label,
      url: `/app/${app.id}/overview`
    }));
}

export const applicationPageIcons = {
  application: Building2Icon,
  accounts: LandmarkIcon,
  billing: CreditCardIcon,
  core: Globe2Icon,
  settings: Settings2Icon
};

function commonMasterMenuGroups(activePage: string, onSelect: (page: string) => void): SidemenuItem[] {
  const groups = [
    { icon: UsersIcon, id: "contacts", label: "Contacts" },
    { icon: PackageIcon, id: "products", label: "Product" },
    { icon: ClipboardListIcon, id: "workorder", label: "Work Orders" },
    { icon: Settings2Icon, id: "others", label: "Others" }
  ] as const;
  return groups.map((group) => ({
    icon: group.icon,
    title: group.label,
    isActive: activePage.startsWith(`core.common.${group.id}.`),
    items: commonMasterDefinitions
      .filter((definition) => definition.group === group.id)
      .map((definition) => {
        const page = pageKeyForCommonMaster(definition.path);
        return {
          title: definition.label,
          isActive: activePage === page,
          onSelect: () => onSelect(page)
        };
      })
  }));
}

function pageKeyForCommonMaster(path: string) {
  return path.replace(/^\/core\//, "core.").replaceAll("/", ".");
}
