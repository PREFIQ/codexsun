import { BoxesIcon, PackageCheckIcon, ShoppingCartIcon, StoreIcon } from "lucide-react";
import { ecommerceFallbackProfile } from "../../config/deployment";
import { getEcommerceApiUrl } from "./overview.services";
import type { EcommerceApiStatus, EcommerceAppInfo } from "./overview.types";

const capabilityLanes = [
  {
    description: "Vendor onboarding and commercial status will belong to the vendors leaf module.",
    icon: StoreIcon,
    title: "Multi-vendor Supply"
  },
  {
    description: "Products, variants, pricing, and availability stay inside catalog ownership.",
    icon: BoxesIcon,
    title: "Product Catalog"
  },
  {
    description:
      "Public customer selection and checkout will be isolated in cart and order modules.",
    icon: ShoppingCartIcon,
    title: "Customer Commerce"
  },
  {
    description: "Fulfilment will coordinate delivery through explicit order contracts and events.",
    icon: PackageCheckIcon,
    title: "Delivery Operations"
  }
] as const;

export function EcommerceOverviewWorkspace({
  appInfo,
  status
}: {
  appInfo: EcommerceAppInfo | null;
  status: EcommerceApiStatus;
}) {
  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-5 lg:w-[calc(100%-3rem)]">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">
              Multi-vendor ecommerce
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              {appInfo?.brandName ?? ecommerceFallbackProfile.brandName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {appInfo?.purpose ?? ecommerceFallbackProfile.purpose}
            </p>
            {appInfo ? (
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {appInfo.stack.foundation.join(" + ")} + {appInfo.stack.owner}
              </p>
            ) : null}
          </div>
          <div className="text-right text-sm">
            <p className="font-medium capitalize">API {status}</p>
            <p className="mt-1 text-xs text-muted-foreground">{getEcommerceApiUrl()}</p>
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {capabilityLanes.map((lane) => (
          <article className="rounded-xl border bg-card p-5 shadow-sm" key={lane.title}>
            <lane.icon className="size-5 text-primary" aria-hidden="true" />
            <h2 className="mt-4 font-semibold">{lane.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{lane.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
