import type { ReactNode } from "react";
import {
  KeyRoundIcon,
  LogOutIcon,
  ShieldCheckIcon,
  UsersRoundIcon,
  WalletCardsIcon
} from "lucide-react";

import { AppLayout } from "./app-layout";
import type { SidemenuItem } from "../blocks/menu/sidemenu/sub/sidemenu-section";

type SuperLayoutProps = {
  actions?: ReactNode;
  children: ReactNode;
  menuItems?: SidemenuItem[];
  subtitle?: ReactNode;
  title?: ReactNode;
  versionLabel?: string;
};

const superMenuItems: SidemenuItem[] = [
  {
    title: "Admin",
    url: "/sa",
    icon: WalletCardsIcon,
    isActive: true,
    items: [
      {
        title: "Console",
        url: "/sa"
      },
      {
        title: "Application",
        url: "/app"
      },
      {
        title: "Domain",
        url: "/status"
      },
      {
        title: "Subscription",
        url: "/admin"
      },
      {
        title: "Apps",
        url: "/sa"
      },
      {
        title: "Compliance",
        url: "/status"
      },
      {
        title: "Master Database",
        url: "/status"
      },
      {
        title: "Access Control",
        url: "/admin"
      }
    ]
  }
];

const superWorkspaceItems = [
  {
    title: "Platform",
    description: "Master database, tenants, domains, and controls.",
    icon: ShieldCheckIcon,
    active: true,
    url: "/sa"
  },
  {
    title: "Application",
    description: "Tenant application workspace.",
    icon: UsersRoundIcon,
    url: "/app"
  },
  {
    title: "Staff",
    description: "Internal support and activation operations.",
    icon: WalletCardsIcon,
    url: "/admin"
  }
];

export function SuperLayout({
  actions,
  children,
  menuItems = superMenuItems,
  subtitle,
  title,
  versionLabel
}: SuperLayoutProps) {
  return (
    <AppLayout
      brand={{
        href: "/sa",
        subtitle: "super-admin",
        title: "Super Admin Desk"
      }}
      headerTitle="Super Admin Desk"
      homeHref="/sa"
      logoutHref="/sa/login"
      menuItems={menuItems}
      subtitle={subtitle}
      title={title}
      user={{
        email: "superadmin@codexsun.app",
        fallback: "S",
        name: "Super Admin"
      }}
      {...(versionLabel ? { versionLabel } : {})}
      userMenuItems={[
        {
          icon: ShieldCheckIcon,
          title: "Account"
        },
        {
          icon: KeyRoundIcon,
          title: "Access Control",
          url: "/sa"
        },
        {
          icon: LogOutIcon,
          title: "Log out",
          url: "/sa/login"
        }
      ]}
      workspaceItems={superWorkspaceItems}
    >
      {actions ? <div className="px-4 pt-4 lg:px-6">{actions}</div> : null}
      <div className="flex-1">{children}</div>
    </AppLayout>
  );
}
