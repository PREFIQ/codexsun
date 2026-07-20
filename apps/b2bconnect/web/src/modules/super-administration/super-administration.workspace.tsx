import { AppLayout, GlobalLoader } from "@codexsun/ui";
import {
  Activity,
  Crown,
  Database,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ServerCog,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { b2bConnectFallbackProfile } from "../../config/deployment";
import { logoutB2bConnect, type B2bConnectSession } from "../authentication";
import { useSuperAdministrationBusinessProfiles } from "../business-profile";
import { NetworkBlueprintWorkspace } from "../network-blueprint";
import { useB2bConnectSuperAdministrationDashboard } from "./super-administration.hooks";

const superAdministrationIcons = [ServerCog, KeyRound, Activity] as const;

export function B2bConnectSuperAdministrationWorkspace({
  session
}: {
  session: B2bConnectSession;
}) {
  const state = useB2bConnectSuperAdministrationDashboard();
  const profiles = useSuperAdministrationBusinessProfiles();
  if (state.status === "loading") return <GlobalLoader />;

  return (
    <AppLayout
      brand={{
        href: "/sa",
        subtitle: "super administration",
        title: `${b2bConnectFallbackProfile.brandName} Control`
      }}
      headerTitle="Super Administration"
      homeHref="/sa"
      logoutHref="/sa/login"
      onLogout={async () => {
        await logoutB2bConnect("super_admin");
        window.location.assign("/sa/login");
      }}
      menuItems={[
        { icon: LayoutDashboard, isActive: true, title: "Control dashboard", url: "/sa" },
        { icon: KeyRound, title: "Access governance", url: "/sa" },
        { icon: Database, title: "Deployment", url: "/sa" },
        { icon: Activity, title: "Platform health", url: "/sa" }
      ]}
      subtitle="Deployment access, governance, and system oversight."
      title="Control dashboard"
      user={{
        email: session.email,
        fallback: session.name.slice(0, 1).toUpperCase(),
        name: session.name
      }}
      userMenuItems={[
        { icon: UserRound, title: "Account" },
        { icon: LogOut, title: "Log out", url: "/sa/login" }
      ]}
      versionLabel={`v ${__APP_VERSION__}`}
      workspaceItems={[
        {
          active: true,
          description: "B2B deployment and access control.",
          icon: Crown,
          title: "Super Administration",
          url: "/sa"
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
            <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-800 p-7 text-white shadow-lg">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-200">
                {state.dashboard.accessLabel}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                {state.dashboard.welcomeMessage}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-violet-100">
                Your super-administrator session is role-checked on every protected API call.
              </p>
            </section>
            <section className="grid gap-4 md:grid-cols-3">
              {state.dashboard.capabilities.map((capability, index) => {
                const Icon = superAdministrationIcons[index] ?? ShieldCheck;
                return (
                  <article className="rounded-xl border bg-card p-5 shadow-sm" key={capability}>
                    <Icon className="size-5 text-primary" />
                    <h2 className="mt-4 font-semibold">{capability}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Super-administrator capability isolated from other B2B desks.
                    </p>
                  </article>
                );
              })}
            </section>
            <section className="grid gap-4 md:grid-cols-4">
              {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                <article className="rounded-xl border bg-card p-4 shadow-sm" key={status}>
                  <p className="text-xs uppercase text-muted-foreground">{status} profiles</p>
                  <strong className="mt-2 block text-3xl">
                    {status === "all"
                      ? profiles.items.length
                      : profiles.items.filter((profile) => profile.status === status).length}
                  </strong>
                </article>
              ))}
            </section>
            <NetworkBlueprintWorkspace />
          </>
        )}
      </main>
    </AppLayout>
  );
}
