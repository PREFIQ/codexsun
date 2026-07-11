import { useState } from "react";
import { AppLayout } from "@codexsun/ui";
import {
  BellRingIcon,
  ChefHatIcon,
  CircleGaugeIcon,
  ClipboardListIcon,
  ConciergeBellIcon,
  FileClockIcon,
  LayoutGridIcon,
  ReceiptTextIcon,
  Settings2Icon,
  UtensilsIcon
} from "lucide-react";
import { ServiceOrdersWorkspace, type KitchenServePage } from "../modules/service-orders";
const pages: Array<{ key: KitchenServePage; label: string; icon: typeof CircleGaugeIcon }> = [
  { key: "overview", label: "Overview", icon: CircleGaugeIcon },
  { key: "tables", label: "Floor & Tables", icon: LayoutGridIcon },
  { key: "menu", label: "Menu", icon: UtensilsIcon },
  { key: "waiter-orders", label: "Waiter Orders", icon: ClipboardListIcon },
  { key: "kitchen", label: "Kitchen Display", icon: ChefHatIcon },
  { key: "ready", label: "Ready to Serve", icon: BellRingIcon },
  { key: "bill-waiting", label: "Bill Waiting", icon: ReceiptTextIcon },
  { key: "history", label: "Order History", icon: FileClockIcon },
  { key: "settings", label: "Settings", icon: Settings2Icon }
];
export function KitchenServeApp() {
  const [page, setPage] = useState<KitchenServePage>("overview");
  return (
    <AppLayout
      brand={{
        href: "/kitchen-serve",
        subtitle: "waiter · kitchen · billing",
        title: "KitchenServe"
      }}
      headerTitle={pages.find((item) => item.key === page)?.label ?? "KitchenServe"}
      homeHref="/kitchen-serve"
      logoutHref="/login"
      menuItems={pages.map((item) => ({
        icon: item.icon,
        isActive: page === item.key,
        title: item.label,
        onSelect: () => setPage(item.key)
      }))}
      title={null}
      subtitle={null}
      user={{ email: "Tenant operation", fallback: "K", name: "KitchenServe" }}
      versionLabel={`v ${__APP_VERSION__}`}
      workspaceItems={[
        {
          active: true,
          title: "KitchenServe",
          description: "Waiter, kitchen, serving, and bill-waiting operations.",
          icon: ConciergeBellIcon,
          url: "/kitchen-serve"
        }
      ]}
    >
      <ServiceOrdersWorkspace page={page} />
    </AppLayout>
  );
}
