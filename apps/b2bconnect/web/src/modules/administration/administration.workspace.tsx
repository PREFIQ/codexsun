import { AppLayout, GlobalLoader } from "@codexsun/ui";
import {
  BadgeCheck,
  Handshake,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  ShieldCheck,
  UserRound,
  UsersRound
} from "lucide-react";
import { b2bConnectFallbackProfile } from "../../config/deployment";
import { logoutB2bConnect, type B2bConnectSession } from "../authentication";
import {
  BusinessProfileReviewList,
  reviewBusinessProfile,
  useAdministrationBusinessProfiles
} from "../business-profile";
import { useState } from "react";
import { useB2bConnectAdministrationDashboard } from "./administration.hooks";

const administrationIcons = [UsersRound, ShieldCheck, MessageSquareWarning] as const;

export function B2bConnectAdministrationWorkspace({ session }: { session: B2bConnectSession }) {
  const state = useB2bConnectAdministrationDashboard();
  const profiles = useAdministrationBusinessProfiles();
  const [reviewingUuid, setReviewingUuid] = useState("");
  const [reviewError, setReviewError] = useState("");
  if (state.status === "loading") return <GlobalLoader />;

  return (
    <AppLayout
      brand={{
        href: "/admin",
        subtitle: "marketplace operations",
        title: `${b2bConnectFallbackProfile.brandName} Admin`
      }}
      headerTitle="Administration"
      homeHref="/admin"
      logoutHref="/admin/login"
      onLogout={async () => {
        await logoutB2bConnect("admin");
        window.location.assign("/admin/login");
      }}
      menuItems={[
        { icon: LayoutDashboard, isActive: true, title: "Dashboard", url: "/admin" },
        { icon: UsersRound, title: "Members", url: "/admin" },
        { icon: BadgeCheck, title: "Verification", url: "/admin" },
        { icon: Handshake, title: "Enquiry oversight", url: "/admin" }
      ]}
      subtitle="Moderation, verification, and marketplace support."
      title="Operations dashboard"
      user={{
        email: session.email,
        fallback: session.name.slice(0, 1).toUpperCase(),
        name: session.name
      }}
      userMenuItems={[
        { icon: UserRound, title: "Account" },
        { icon: LogOut, title: "Log out", url: "/admin/login" }
      ]}
      versionLabel={`v ${__APP_VERSION__}`}
      workspaceItems={[
        {
          active: true,
          description: "Marketplace operations and support.",
          icon: ShieldCheck,
          title: "Administration",
          url: "/admin"
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
            <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 p-7 text-white shadow-lg">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-100">
                {state.dashboard.accessLabel}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                {state.dashboard.welcomeMessage}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-orange-50">
                Your administrator role was validated by the B2B Connect API.
              </p>
            </section>
            <section className="grid gap-4 md:grid-cols-3">
              {state.dashboard.capabilities.map((capability, index) => {
                const Icon = administrationIcons[index] ?? ShieldCheck;
                return (
                  <article className="rounded-xl border bg-card p-5 shadow-sm" key={capability}>
                    <Icon className="size-5 text-primary" />
                    <h2 className="mt-4 font-semibold">{capability}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Administrator-only capability protected at the API boundary.
                    </p>
                  </article>
                );
              })}
            </section>
            <section className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                  Approval queue
                </p>
                <h2 className="mt-2 text-xl font-semibold">Business profile review</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Approve profiles for public discovery or return them with a clear note.
                </p>
              </div>
              <BusinessProfileReviewList
                loadingUuid={reviewingUuid}
                profiles={profiles.items}
                onReview={async (uuid, decision, note) => {
                  setReviewingUuid(uuid);
                  setReviewError("");
                  try {
                    await reviewBusinessProfile(uuid, decision, note);
                    profiles.refresh();
                  } catch (error) {
                    setReviewError(
                      error instanceof Error ? error.message : "Unable to review the profile."
                    );
                  } finally {
                    setReviewingUuid("");
                  }
                }}
              />
              {reviewError ? (
                <p
                  className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  {reviewError}
                </p>
              ) : null}
            </section>
          </>
        )}
      </main>
    </AppLayout>
  );
}
