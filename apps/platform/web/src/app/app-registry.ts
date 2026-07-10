import {
  Building2Icon,
  CircleGaugeIcon,
  CreditCardIcon,
  FileSpreadsheetIcon,
  Globe2Icon,
  LandmarkIcon,
  MapPinnedIcon,
  PackageIcon,
  ReceiptIndianRupeeIcon,
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
        { title: "Quotation", isActive: activePage === "billing.quotation", onSelect: () => onSelect("billing.quotation") },
        { title: "Sales", isActive: activePage === "billing.sales", onSelect: () => onSelect("billing.sales") },
        { title: "Purchase", isActive: activePage === "billing.purchase", onSelect: () => onSelect("billing.purchase") },
        { title: "Export Sales", isActive: activePage === "billing.export-sales", onSelect: () => onSelect("billing.export-sales") },
        {
          icon: PackageIcon,
          title: "Master",
          isActive: activePage === "core.master.contact" || activePage === "core.master.product" || activePage === "core.master.work-order",
          items: [
            { title: "Contact", isActive: activePage === "core.master.contact", onSelect: () => onSelect("core.master.contact") },
            { title: "Product", isActive: activePage === "core.master.product", onSelect: () => onSelect("core.master.product") },
            { title: "Work Order", isActive: activePage === "core.master.work-order", onSelect: () => onSelect("core.master.work-order") }
          ]
        },
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
        { title: "Billing Settings", isActive: activePage === "billing.settings", onSelect: () => onSelect("billing.settings") },
        { title: "Document Settings", isActive: activePage === "billing.document-settings", onSelect: () => onSelect("billing.document-settings") }
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
        {
          title: "Masters",
          isActive: activePage === "accounts.groups" || activePage === "accounts.ledgers" || activePage === "accounts.opening-balances",
          items: [
            { title: "Account Groups", isActive: activePage === "accounts.groups", onSelect: () => onSelect("accounts.groups") },
            { title: "Ledgers", isActive: activePage === "accounts.ledgers", onSelect: () => onSelect("accounts.ledgers") },
            { title: "Opening Balances", isActive: activePage === "accounts.opening-balances", onSelect: () => onSelect("accounts.opening-balances") }
          ]
        },
        {
          title: "Vouchers",
          isActive: activePage === "accounts.vouchers" || activePage === "accounts.sales-postings" || activePage === "accounts.receipts-payments",
          items: [
            { title: "All Vouchers", isActive: activePage === "accounts.vouchers", onSelect: () => onSelect("accounts.vouchers") },
            { title: "Billing Postings", isActive: activePage === "accounts.sales-postings", onSelect: () => onSelect("accounts.sales-postings") },
            { title: "Receipts & Payments", isActive: activePage === "accounts.receipts-payments", onSelect: () => onSelect("accounts.receipts-payments") }
          ]
        },
        {
          title: "Reports",
          isActive: activePage === "accounts.reports" || activePage === "accounts.trial-balance" || activePage === "accounts.ledger-statement" || activePage === "accounts.balance-sheet" || activePage === "accounts.profit-loss",
          items: [
            { title: "Reports Overview", isActive: activePage === "accounts.reports", onSelect: () => onSelect("accounts.reports") },
            { title: "Trial Balance", isActive: activePage === "accounts.trial-balance", onSelect: () => onSelect("accounts.trial-balance") },
            { title: "Ledger Statement", isActive: activePage === "accounts.ledger-statement", onSelect: () => onSelect("accounts.ledger-statement") },
            { title: "Balance Sheet", isActive: activePage === "accounts.balance-sheet", onSelect: () => onSelect("accounts.balance-sheet") },
            { title: "Profit & Loss", isActive: activePage === "accounts.profit-loss", onSelect: () => onSelect("accounts.profit-loss") }
          ]
        },
        {
          title: "Settings",
          isActive: activePage === "accounts.settings" || activePage === "accounts.posting-rules" || activePage === "accounts.financial-year" || activePage === "accounts.voucher-numbering" || activePage === "accounts.tally-integration",
          items: [
            { title: "Accounts Settings", isActive: activePage === "accounts.settings", onSelect: () => onSelect("accounts.settings") },
            { title: "Posting Rules", isActive: activePage === "accounts.posting-rules", onSelect: () => onSelect("accounts.posting-rules") },
            { title: "Financial Year", isActive: activePage === "accounts.financial-year", onSelect: () => onSelect("accounts.financial-year") },
            { title: "Voucher Numbering", isActive: activePage === "accounts.voucher-numbering", onSelect: () => onSelect("accounts.voucher-numbering") },
            { title: "Tally Integration", isActive: activePage === "accounts.tally-integration", onSelect: () => onSelect("accounts.tally-integration") }
          ]
        }
      ]
    };
  }

  return {
    icon: Building2Icon,
    isActive: activePage.startsWith("application") || activePage === "core.organisation.company",
    title: "Application",
    items: [
      { title: "Overview", isActive: activePage === "application.overview", onSelect: () => onSelect("application.overview") },
      {
        title: "Application",
        isActive: activePage === "application.landing" || activePage === "application.profile" || activePage === "application.settings",
        items: [
          { title: "Landing Desk", isActive: activePage === "application.landing", onSelect: () => onSelect("application.landing") },
          { title: "Platform Profile", isActive: activePage === "application.profile", onSelect: () => onSelect("application.profile") },
          { title: "Settings", isActive: activePage === "application.settings", onSelect: () => onSelect("application.settings") }
        ]
      },
      {
        icon: Building2Icon,
        title: "Organisation",
        isActive: activePage === "core.organisation.company",
        items: [
          { title: "Company", isActive: activePage === "core.organisation.company", onSelect: () => onSelect("core.organisation.company") }
        ]
      }
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
        isActive:
          activePage === "billing.quotation" ||
          activePage === "billing.sales" ||
          activePage === "billing.purchase" ||
          activePage === "billing.export-sales" ||
          activePage === "billing.settings" ||
          activePage === "billing.document-settings",
        title: "Billing",
        items: [
          { title: "Quotation", isActive: activePage === "billing.quotation", onSelect: () => onSelect("billing.quotation") },
          { title: "Sales", isActive: activePage === "billing.sales", onSelect: () => onSelect("billing.sales") },
          { title: "Purchase", isActive: activePage === "billing.purchase", onSelect: () => onSelect("billing.purchase") },
          { title: "Export Sales", isActive: activePage === "billing.export-sales", onSelect: () => onSelect("billing.export-sales") },
          { title: "Billing Settings", isActive: activePage === "billing.settings", onSelect: () => onSelect("billing.settings") },
          { title: "Document Settings", isActive: activePage === "billing.document-settings", onSelect: () => onSelect("billing.document-settings") }
        ]
      },
      {
        icon: PackageIcon,
        isActive: activePage === "core.master.contact" || activePage === "core.master.product" || activePage === "core.master.work-order",
        title: "Master",
        items: [
          { title: "Contact", isActive: activePage === "core.master.contact", onSelect: () => onSelect("core.master.contact") },
          { title: "Product", isActive: activePage === "core.master.product", onSelect: () => onSelect("core.master.product") },
          { title: "Work Order", isActive: activePage === "core.master.work-order", onSelect: () => onSelect("core.master.work-order") }
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
        title: "Masters",
        items: [
          { title: "Account Groups", isActive: activePage === "accounts.groups", onSelect: () => onSelect("accounts.groups") },
          { title: "Ledgers", isActive: activePage === "accounts.ledgers", onSelect: () => onSelect("accounts.ledgers") },
          { title: "Opening Balances", isActive: activePage === "accounts.opening-balances", onSelect: () => onSelect("accounts.opening-balances") }
        ]
      },
      {
        icon: ReceiptIndianRupeeIcon,
        isActive: activePage === "accounts.vouchers" || activePage === "accounts.sales-postings" || activePage === "accounts.receipts-payments",
        title: "Vouchers",
        items: [
          { title: "All Vouchers", isActive: activePage === "accounts.vouchers", onSelect: () => onSelect("accounts.vouchers") },
          { title: "Billing Postings", isActive: activePage === "accounts.sales-postings", onSelect: () => onSelect("accounts.sales-postings") },
          { title: "Receipts & Payments", isActive: activePage === "accounts.receipts-payments", onSelect: () => onSelect("accounts.receipts-payments") }
        ]
      },
      {
        icon: FileSpreadsheetIcon,
        isActive: activePage === "accounts.reports" || activePage === "accounts.trial-balance" || activePage === "accounts.ledger-statement" || activePage === "accounts.balance-sheet" || activePage === "accounts.profit-loss",
        title: "Reports",
        items: [
          { title: "Reports Overview", isActive: activePage === "accounts.reports", onSelect: () => onSelect("accounts.reports") },
          { title: "Trial Balance", isActive: activePage === "accounts.trial-balance", onSelect: () => onSelect("accounts.trial-balance") },
          { title: "Ledger Statement", isActive: activePage === "accounts.ledger-statement", onSelect: () => onSelect("accounts.ledger-statement") },
          { title: "Balance Sheet", isActive: activePage === "accounts.balance-sheet", onSelect: () => onSelect("accounts.balance-sheet") },
          { title: "Profit & Loss", isActive: activePage === "accounts.profit-loss", onSelect: () => onSelect("accounts.profit-loss") }
        ]
      },
      {
        icon: Settings2Icon,
        isActive: activePage === "accounts.settings" || activePage === "accounts.posting-rules" || activePage === "accounts.financial-year" || activePage === "accounts.voucher-numbering" || activePage === "accounts.tally-integration",
        title: "Settings",
        items: [
          { title: "Accounts Settings", isActive: activePage === "accounts.settings", onSelect: () => onSelect("accounts.settings") },
          { title: "Posting Rules", isActive: activePage === "accounts.posting-rules", onSelect: () => onSelect("accounts.posting-rules") },
          { title: "Financial Year", isActive: activePage === "accounts.financial-year", onSelect: () => onSelect("accounts.financial-year") },
          { title: "Voucher Numbering", isActive: activePage === "accounts.voucher-numbering", onSelect: () => onSelect("accounts.voucher-numbering") },
          { title: "Tally Integration", isActive: activePage === "accounts.tally-integration", onSelect: () => onSelect("accounts.tally-integration") }
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
      isActive: activePage === "application.landing" || activePage === "application.profile" || activePage === "application.settings",
      title: "Application",
      items: [
        { title: "Landing Desk", isActive: activePage === "application.landing", onSelect: () => onSelect("application.landing") },
        { title: "Platform Profile", isActive: activePage === "application.profile", onSelect: () => onSelect("application.profile") },
        { title: "Settings", isActive: activePage === "application.settings", onSelect: () => onSelect("application.settings") }
      ]
    },
    {
      icon: Building2Icon,
      isActive: activePage === "core.organisation.company",
      title: "Organisation",
      items: [
        { title: "Company", isActive: activePage === "core.organisation.company", onSelect: () => onSelect("core.organisation.company") }
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
