import { Building2Icon, HandshakeIcon, SearchCheckIcon, ShieldCheckIcon } from "lucide-react";
import { b2bConnectFallbackProfile } from "../../config/deployment";
import { getB2bConnectApiUrl } from "./overview.services";
import type { B2bConnectApiStatus, B2bConnectAppInfo } from "./overview.types";

const capabilityLanes = [
  {
    description: "Verified business profiles will be owned by the organisations leaf module.",
    icon: Building2Icon,
    title: "Business Profiles"
  },
  {
    description: "Buyer requirements and seller offers remain separate module-owned workflows.",
    icon: SearchCheckIcon,
    title: "Discovery"
  },
  {
    description: "Enquiries and commercial conversations will use explicit public contracts.",
    icon: HandshakeIcon,
    title: "B2B Connections"
  },
  {
    description: "Tenant, permission, verification, and audit checks stay active for every action.",
    icon: ShieldCheckIcon,
    title: "Trusted Operations"
  }
] as const;

export function B2bConnectOverviewWorkspace({
  appInfo,
  status
}: {
  appInfo: B2bConnectAppInfo | null;
  status: B2bConnectApiStatus;
}) {
  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-5 lg:w-[calc(100%-3rem)]">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">B2B marketplace</p>
            <h1 className="mt-2 text-3xl font-semibold">
              {appInfo?.brandName ?? b2bConnectFallbackProfile.brandName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {appInfo?.purpose ?? b2bConnectFallbackProfile.purpose}
            </p>
            {appInfo ? (
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {appInfo.stack.foundation.join(" + ")} + {appInfo.stack.owner}
              </p>
            ) : null}
          </div>
          <div className="text-right text-sm">
            <p className="font-medium capitalize">API {status}</p>
            <p className="mt-1 text-xs text-muted-foreground">{getB2bConnectApiUrl()}</p>
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
