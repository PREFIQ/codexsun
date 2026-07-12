import type { ReactNode } from "react";
import { AppLayout } from "@codexsun/ui/layouts/app-layout";
import type { SidemenuItem } from "@codexsun/ui/blocks/menu/sidemenu/sub/sidemenu-section";
import type { SidebarBrand } from "@codexsun/ui/blocks/menu/sidemenu/app-sidebar";
import type { TopMenuWorkspaceItem } from "@codexsun/ui/blocks/menu/sidemenu/top-menu";
import {
  FileTextIcon,
  HomeIcon,
  LayoutDashboardIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShoppingCartIcon,
  ShipWheelIcon,
  WalletCardsIcon
} from "lucide-react";

const billingBrand: SidebarBrand = {
  href: "/billing",
  subtitle: "billing workspace",
  title: "Billing Desk"
};

const billingWorkspaceItems: TopMenuWorkspaceItem[] = [
  {
    active: true,
    description: "Sales workspace, print preview, and invoice operations.",
    icon: ReceiptTextIcon,
    title: "Billing",
    url: "/billing"
  }
];

export function BillingLayout({
  children,
  currentPath,
  headerTitle,
  subtitle,
  title
}: {
  children: ReactNode;
  currentPath: string;
  headerTitle: ReactNode;
  subtitle: ReactNode;
  title: ReactNode;
}) {
  const menuItems: SidemenuItem[] = [
    {
      icon: LayoutDashboardIcon,
      isActive: currentPath === "/billing" || currentPath === "/",
      title: "Overview",
      url: "/billing"
    },
    {
      icon: ReceiptTextIcon,
      isActive: currentPath.startsWith("/billing/sales"),
      items: [
        {
          isActive: currentPath === "/billing/sales",
          title: "Sales list",
          url: "/billing/sales"
        }
      ],
      title: "Sales",
      url: "/billing/sales"
    },
    {
      icon: FileTextIcon,
      isActive: currentPath.startsWith("/billing/quotation"),
      items: [
        {
          isActive: currentPath === "/billing/quotation",
          title: "Quotation list",
          url: "/billing/quotation"
        }
      ],
      title: "Quotation",
      url: "/billing/quotation"
    },
    {
      icon: ShoppingCartIcon,
      isActive: currentPath.startsWith("/billing/purchase"),
      items: [
        {
          isActive: currentPath === "/billing/purchase",
          title: "Purchase list",
          url: "/billing/purchase"
        }
      ],
      title: "Purchase",
      url: "/billing/purchase"
    },
    {
      icon: ShipWheelIcon,
      isActive: currentPath.startsWith("/billing/export-sales"),
      items: [
        {
          isActive: currentPath === "/billing/export-sales",
          title: "Export sales list",
          url: "/billing/export-sales"
        }
      ],
      title: "Export Sales",
      url: "/billing/export-sales"
    },
    {
      icon: WalletCardsIcon,
      isActive: currentPath.startsWith("/billing/payment"),
      items: [
        {
          isActive: currentPath === "/billing/payment",
          title: "Payment list",
          url: "/billing/payment"
        }
      ],
      title: "Payment",
      url: "/billing/payment"
    },
    {
      icon: WalletCardsIcon,
      isActive: currentPath.startsWith("/billing/receipt"),
      items: [
        {
          isActive: currentPath === "/billing/receipt",
          title: "Receipt list",
          url: "/billing/receipt"
        }
      ],
      title: "Receipt",
      url: "/billing/receipt"
    },
    {
      icon: SettingsIcon,
      isActive: currentPath.startsWith("/billing/settings"),
      items: [
        {
          isActive: currentPath === "/billing/settings",
          title: "Billing Settings",
          url: "/billing/settings"
        },
        {
          isActive:
            currentPath === "/billing/settings/documents" ||
            currentPath === "/billing/settings/sales",
          title: "Document Settings",
          url: "/billing/settings/documents"
        }
      ],
      title: "Settings",
      url: "/billing/settings"
    }
  ];

  return (
    <AppLayout
      brand={billingBrand}
      headerTitle={headerTitle}
      homeHref="/billing"
      logoutHref="/billing"
      menuItems={menuItems}
      subtitle={subtitle}
      title={title}
      user={{
        email: "billing@codexsun.app",
        fallback: "B",
        name: "Billing User"
      }}
      userMenuItems={[
        { icon: HomeIcon, title: "Billing home", url: "/billing" },
        { icon: ReceiptTextIcon, title: "Sales", url: "/billing/sales" },
        { icon: FileTextIcon, title: "Quotation", url: "/billing/quotation" },
        { icon: ShoppingCartIcon, title: "Purchase", url: "/billing/purchase" },
        { icon: ShipWheelIcon, title: "Export Sales", url: "/billing/export-sales" },
        { icon: WalletCardsIcon, title: "Payment", url: "/billing/payment" },
        { icon: WalletCardsIcon, title: "Receipt", url: "/billing/receipt" },
        { icon: SettingsIcon, title: "Billing Settings", url: "/billing/settings" },
        { icon: SettingsIcon, title: "Document Settings", url: "/billing/settings/documents" }
      ]}
      versionLabel={`v ${__APP_VERSION__}`}
      workspaceItems={billingWorkspaceItems}
    >
      {children}
    </AppLayout>
  );
}
