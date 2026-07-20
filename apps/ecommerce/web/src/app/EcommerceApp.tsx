import { AppLayout } from "@codexsun/ui";
import { LayoutDashboardIcon, ShoppingBagIcon } from "lucide-react";
import { ecommerceFallbackProfile } from "../config/deployment";
import {
  EcommerceOverviewWorkspace,
  overviewModule,
  useEcommerceAppInfo
} from "../modules/overview";

export function EcommerceApp() {
  const overview = overviewModule.register();
  const { appInfo, status } = useEcommerceAppInfo();
  const brandName = appInfo?.brandName ?? ecommerceFallbackProfile.brandName;
  const tagline = appInfo?.tagline ?? ecommerceFallbackProfile.tagline;

  return (
    <AppLayout
      brand={{
        href: "/",
        subtitle: tagline,
        title: brandName
      }}
      headerTitle={overview.label}
      homeHref="/app"
      logoutHref="/"
      menuItems={[
        {
          icon: LayoutDashboardIcon,
          isActive: true,
          onSelect: () => window.scrollTo({ behavior: "smooth", top: 0 }),
          title: overview.label
        }
      ]}
      subtitle={null}
      title={null}
      user={{
        email: "Public ecommerce marketplace",
        fallback: ecommerceFallbackProfile.fallback,
        name: brandName
      }}
      versionLabel={`v ${__APP_VERSION__}`}
      workspaceItems={[
        {
          active: true,
          description: "Configurable multi-vendor ecommerce marketplace.",
          icon: ShoppingBagIcon,
          title: brandName,
          url: "/app"
        }
      ]}
    >
      <EcommerceOverviewWorkspace appInfo={appInfo} status={status} />
    </AppLayout>
  );
}
