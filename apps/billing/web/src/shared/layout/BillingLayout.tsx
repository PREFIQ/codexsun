import type { ReactNode } from "react";
import { AppLayout } from "@codexsun/ui/layouts/app-layout";
import type { SidemenuItem } from "@codexsun/ui/blocks/menu/sidemenu/sub/sidemenu-section";
import type { SidebarBrand } from "@codexsun/ui/blocks/menu/sidemenu/app-sidebar";
import type { TopMenuWorkspaceItem } from "@codexsun/ui/blocks/menu/sidemenu/top-menu";
import { HomeIcon, LayoutDashboardIcon, ReceiptTextIcon } from "lucide-react";

const billingBrand: SidebarBrand = {
  href: "/billing",
  subtitle: "billing workspace",
  title: "Billing Desk",
};

const billingWorkspaceItems: TopMenuWorkspaceItem[] = [
  {
    active: true,
    description: "Sales workspace, print preview, and invoice operations.",
    icon: ReceiptTextIcon,
    title: "Billing",
    url: "/billing",
  },
];

export function BillingLayout({
  children,
  currentPath,
  headerTitle,
  subtitle,
  title,
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
      url: "/billing",
    },
    {
      icon: ReceiptTextIcon,
      isActive: currentPath.startsWith("/billing/sales"),
      items: [
        {
          isActive: currentPath === "/billing/sales",
          title: "Sales list",
          url: "/billing/sales",
        },
      ],
      title: "Sales",
      url: "/billing/sales",
    },
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
        name: "Billing User",
      }}
      userMenuItems={[
        { icon: HomeIcon, title: "Billing home", url: "/billing" },
        { icon: ReceiptTextIcon, title: "Sales", url: "/billing/sales" },
      ]}
      versionLabel="v 1.0.7"
      workspaceItems={billingWorkspaceItems}
    >
      {children}
    </AppLayout>
  );
}
