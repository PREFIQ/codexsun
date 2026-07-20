import { AppLayout, GlobalLoader } from "@codexsun/ui";
import {
  Building2,
  Handshake,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  SearchCheck,
  UserRound
} from "lucide-react";
import { b2bConnectFallbackProfile } from "../../config/deployment";
import { logoutB2bConnect, type B2bConnectSession } from "../authentication";
import { BusinessProfileWorkspace } from "../business-profile";
import { useB2bConnectClientPortalDashboard } from "./client-portal.hooks";

const capabilityIcons = [Building2, SearchCheck, MessageSquareText] as const;

export function B2bConnectClientPortalWorkspace({ session }: { session: B2bConnectSession }) {
  const state = useB2bConnectClientPortalDashboard();
  if (state.status === "loading") return <GlobalLoader />;

  return (
    <AppLayout
      brand={{
        href: "/",
        subtitle: "buyer · seller · network",
        title: b2bConnectFallbackProfile.brandName
      }}
      headerTitle="Client Portal"
      homeHref="/app"
      logoutHref="/login"
      onLogout={async () => {
        await logoutB2bConnect("client");
        window.location.assign("/login");
      }}
      menuItems={[
        { icon: LayoutDashboard, isActive: true, title: "Dashboard", url: "/app" },
        { icon: Building2, title: "Business profile", url: "/app" },
        { icon: SearchCheck, title: "Discover", url: "/app" },
        { icon: Handshake, title: "Enquiries", url: "/app" }
      ]}
      subtitle="Your protected buyer and seller marketplace workspace."
      title="Business dashboard"
      user={{
        email: session.email,
        fallback: session.name.slice(0, 1).toUpperCase(),
        name: session.name
      }}
      userMenuItems={[
        { icon: UserRound, title: "Account" },
        { icon: LogOut, title: "Log out", url: "/login" }
      ]}
      versionLabel={`v ${__APP_VERSION__}`}
      workspaceItems={[
        {
          active: true,
          description: "Buyer and seller workspace.",
          icon: Building2,
          title: "Client Portal",
          url: "/app"
        }
      ]}
    >
      <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-5 lg:w-[calc(100%-3rem)]">
        {state.status === "error" ? (
          <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
            {state.error}
          </section>
        ) : (
          <>
            <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 p-7 text-white shadow-lg">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-100">
                {state.dashboard.accessLabel}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                {state.dashboard.welcomeMessage}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-violet-100">
                Your authenticated session is connected to the B2B Connect backend.
              </p>
            </section>
            <section className="grid gap-4 md:grid-cols-3">
              {state.dashboard.capabilities.map((capability, index) => {
                const Icon = capabilityIcons[index] ?? Building2;
                return (
                  <article className="rounded-xl border bg-card p-5 shadow-sm" key={capability}>
                    <Icon className="size-5 text-primary" />
                    <h2 className="mt-4 font-semibold">{capability}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Protected client capability ready for its module-owned workflow.
                    </p>
                  </article>
                );
              })}
            </section>
            <BusinessProfileWorkspace />
          </>
        )}
      </main>
    </AppLayout>
  );
}
