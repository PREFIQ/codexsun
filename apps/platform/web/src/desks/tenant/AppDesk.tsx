import { useEffect, useState } from "react";
import { CreditCardIcon, Globe2Icon, LayoutDashboardIcon, ReceiptTextIcon, RocketIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ApplicationLayout, Button, Card, Label, RadioGroup, RadioGroupItem, StatusBadge } from "@codexsun/ui";
import type { SidemenuItem } from "@codexsun/ui/blocks/menu/sidemenu/sub/sidemenu-section";
import { AuthGate } from "../../shared/auth/AuthGate";
import { appMenuFor, appWorkspaceItems, defaultLandingApp, enabledAppIds, type PlatformAppId } from "../../app/app-registry";
import { getTenantRuntime } from "../../modules/tenant/tenant.services";

type AppPage =
  | "application.overview"
  | "application.landing"
  | "application.profile"
  | "application.settings"
  | "billing.overview"
  | "billing.sales"
  | "billing.settings"
  | "core.country";
const LANDING_APP_STORAGE_KEY = "codexsun.tenant.landing-app.live";

export function AppDesk() {
  const [page, setPage] = useState<AppPage>(() => pageFromUrl(readPublishedLandingApp()));
  const [publishedLandingApp, setPublishedLandingApp] = useState<PlatformAppId | null>(() => readPublishedLandingApp());
  const [shouldResolveLandingPath, setShouldResolveLandingPath] = useState(() => isAppRootPath());
  const runtimeQuery = useQuery({
    queryFn: getTenantRuntime,
    queryKey: ["tenant", "runtime"]
  });

  const runtime = runtimeQuery.data;
  const moduleKeys = runtime?.tenant?.enabledModuleKeys ?? ["platform.application"];
  const enabledApps = enabledAppIds(moduleKeys);
  const runtimeLandingApp = runtime?.defaultLandingApp ?? defaultLandingApp(runtime?.tenant?.defaultLandingApp, moduleKeys);
  const landingApp = publishedLandingApp && enabledApps.includes(publishedLandingApp) ? publishedLandingApp : runtimeLandingApp;
  const activeApp = appFromPage(page, landingApp, enabledApps);
  const safePage = (page.startsWith("billing") || page.startsWith("core")) && !enabledApps.includes("billing") ? pageForApp(landingApp) : page;

  useEffect(() => {
    if (publishedLandingApp && !enabledApps.includes(publishedLandingApp)) {
      setPublishedLandingApp(null);
      window.localStorage.removeItem(LANDING_APP_STORAGE_KEY);
    }
  }, [enabledApps, publishedLandingApp]);

  useEffect(() => {
    if (!shouldResolveLandingPath) return;
    if (!publishedLandingApp && runtimeQuery.isLoading) return;

    const landingPage = pageForApp(landingApp);
    setPage(landingPage);
    setShouldResolveLandingPath(false);
    window.history.replaceState({ page: landingPage }, "", `/app/${landingPage.replace(".", "/")}`);
  }, [landingApp, publishedLandingApp, runtimeQuery.isLoading, shouldResolveLandingPath]);

  function selectPage(nextPage: AppPage) {
    setPage(nextPage);
    window.history.pushState({ page: nextPage }, "", `/app/${nextPage.replace(".", "/")}`);
  }

  function publishLandingApp(nextLandingApp: PlatformAppId) {
    setPublishedLandingApp(nextLandingApp);
    window.localStorage.setItem(LANDING_APP_STORAGE_KEY, nextLandingApp);
  }

  const activeWorkspaceTitle = activeApp === "billing" ? "Billing" : "Application";
  const menuItems: SidemenuItem[] = [
    appMenuFor(activeApp, safePage, (nextPage) => selectPage(nextPage as AppPage))
  ];
  const workspaceItems = appWorkspaceItems(enabledApps, activeApp).map((item) => ({
    ...item,
    url: item.title === "Application" ? "/app/application/overview" : "/app/billing/overview"
  }));

  return (
    <AuthGate desk="tenant">
      <ApplicationLayout
        brand={{
          href: activeApp === "billing" ? "/app/billing/overview" : "/app/application/overview",
          subtitle: `${activeWorkspaceTitle.toLowerCase()} workspace`,
          title: activeWorkspaceTitle
        }}
        headerTitle={titleForPage(safePage)}
        menuItems={menuItems}
        subtitle={runtimeQuery.isLoading ? "Loading tenant app access." : `${enabledApps.length} app area${enabledApps.length === 1 ? "" : "s"} enabled.`}
        title={activeWorkspaceTitle}
        workspaceItems={workspaceItems}
      >
        <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-5 lg:w-[calc(100%-3rem)]">
          {safePage === "application.overview" ? <ApplicationOverview /> : null}
          {safePage === "application.landing" ? (
            <LandingDesk
              enabledApps={enabledApps}
              landingApp={landingApp}
              onPublish={publishLandingApp}
            />
          ) : null}
          {safePage === "application.profile" ? <ApplicationProfile /> : null}
          {safePage === "application.settings" ? <ApplicationSettings /> : null}
          {safePage === "billing.overview" ? <BillingOverview /> : null}
          {safePage === "billing.sales" ? <BillingSales /> : null}
          {safePage === "billing.settings" ? <BillingSettings /> : null}
          {safePage === "core.country" ? <CoreCountries /> : null}
        </main>
      </ApplicationLayout>
    </AuthGate>
  );
}

function pageFromUrl(landingApp: PlatformAppId | null): AppPage {
  const [, , app, child] = window.location.pathname.split("/");
  if (!app) return pageForApp(landingApp ?? "application");

  const key = `${app}.${child || "overview"}`;
  if (
    key === "application.overview" ||
    key === "application.landing" ||
    key === "application.profile" ||
    key === "application.settings" ||
    key === "billing.overview" ||
    key === "billing.desk" ||
    key === "billing.sales" ||
    key === "billing.settings" ||
    key === "core.country"
  ) {
    return key === "billing.desk" ? "billing.overview" : key;
  }
  return pageForApp(landingApp ?? "application");
}

function LandingDesk({
  enabledApps,
  landingApp,
  onPublish
}: {
  enabledApps: PlatformAppId[];
  landingApp: PlatformAppId;
  onPublish: (app: PlatformAppId) => void;
}) {
  const [draftLandingApp, setDraftLandingApp] = useState<PlatformAppId>(landingApp);
  const dirty = draftLandingApp !== landingApp;

  useEffect(() => {
    setDraftLandingApp(landingApp);
  }, [landingApp]);

  const choices = enabledApps.map((appId) => ({
    description:
      appId === "billing"
        ? "Sales, purchase, receipt, payment, report, master, common, and billing settings."
        : "Shared workspace, company setup, roles, and cross-app launch desk.",
    icon: appId === "billing" ? CreditCardIcon : LayoutDashboardIcon,
    iconClass: appId === "billing" ? "bg-emerald-600 text-white" : "bg-slate-950 text-white",
    id: appId,
    label: appId === "billing" ? "Billing" : "Application"
  })) satisfies Array<{
    description: string;
    icon: typeof LayoutDashboardIcon;
    iconClass: string;
    id: PlatformAppId;
    label: string;
  }>;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Landing Desk</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose which enabled app opens first for this workspace.</p>
        </div>
        <Button
          disabled={!dirty}
          icon={<RocketIcon />}
          onClick={() => onPublish(draftLandingApp)}
        >
          Publish live
        </Button>
      </div>

      <div className="rounded-md border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-normal">Default landing app</h2>
            <p className="mt-1 text-sm text-muted-foreground">Only enabled apps are available as landing choices.</p>
          </div>
          <StatusBadge tone={dirty ? "amber" : "green"}>
            {dirty ? "Draft not live" : "Live"}
          </StatusBadge>
        </div>

        <RadioGroup
          value={draftLandingApp}
          onValueChange={(value) => setDraftLandingApp(value as PlatformAppId)}
          className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {choices.map((choice) => {
            const Icon = choice.icon;
            const selected = draftLandingApp === choice.id;

            return (
              <Label
                key={choice.id}
                className={`flex min-h-[98px] cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors ${
                  selected ? "border-border bg-muted/70" : "bg-background hover:bg-muted/35"
                }`}
              >
                <RadioGroupItem value={choice.id} className="mt-1" />
                <span className={`grid size-10 shrink-0 place-items-center rounded-md ${choice.iconClass}`}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{choice.label}</span>
                  </span>
                  <span className="mt-2 block text-sm font-normal leading-5 text-muted-foreground">{choice.description}</span>
                </span>
              </Label>
            );
          })}
        </RadioGroup>
      </div>
    </section>
  );
}

function ApplicationOverview() {
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Application workspace overview for profile, settings, users, roles, and landing setup.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Landing Desk" description="Choose which enabled app opens first for this workspace.">
          <div className="flex items-center gap-3">
            <LayoutDashboardIcon className="size-5 text-muted-foreground" />
            <StatusBadge tone="green">Configured</StatusBadge>
          </div>
        </Card>
        <Card title="Platform Profile" description="Application identity and tenant workspace context.">
          <StatusBadge tone="green">Always enabled</StatusBadge>
        </Card>
        <Card title="Settings" description="Tenant-scoped application settings and access controls.">
          <StatusBadge tone="blue">Platform</StatusBadge>
        </Card>
      </div>
    </section>
  );
}

function ApplicationProfile() {
  return (
    <Card title="Application Profile" description="Platform identity, workspace access, and tenant context.">
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="green">Always enabled</StatusBadge>
      </div>
    </Card>
  );
}

function ApplicationSettings() {
  return (
    <Card title="Application Settings" description="Tenant-scoped platform settings.">
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="green">Platform</StatusBadge>
      </div>
    </Card>
  );
}

function BillingSales() {
  return (
    <Card title="Billing Sales" description="Billing sales entry point for this tenant.">
      <div className="flex items-center gap-3">
        <CreditCardIcon className="size-5 text-muted-foreground" />
        <StatusBadge tone="green">Enabled</StatusBadge>
      </div>
    </Card>
  );
}

function BillingOverview() {
  return (
    <section className="space-y-5">
      <div className="rounded-md border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-emerald-600 text-white">
            <ReceiptTextIcon className="size-6" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">Billing</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">Billing Desk</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sales, purchase, receipt, payment, report, master, common, and billing settings.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Sales" description="Create and review billing sales documents.">
          <div className="flex items-center gap-3">
            <CreditCardIcon className="size-5 text-muted-foreground" />
            <StatusBadge tone="green">Ready</StatusBadge>
          </div>
        </Card>
        <Card title="Core Masters" description="Manage countries and shared billing master data.">
          <div className="flex items-center gap-3">
            <Globe2Icon className="size-5 text-muted-foreground" />
            <StatusBadge tone="blue">Core</StatusBadge>
          </div>
        </Card>
        <Card title="Billing Settings" description="Configure billing module settings and document setup.">
          <StatusBadge tone="green">Enabled</StatusBadge>
        </Card>
      </div>
    </section>
  );
}

function BillingSettings() {
  return (
    <Card title="Billing Settings" description="Billing module settings and document setup.">
      <StatusBadge tone="green">Enabled</StatusBadge>
    </Card>
  );
}

function CoreCountries() {
  return (
    <Card title="Countries" description="Core country masters available inside Billing.">
      <div className="flex items-center gap-3">
        <Globe2Icon className="size-5 text-muted-foreground" />
        <StatusBadge tone="green">Core</StatusBadge>
      </div>
    </Card>
  );
}

function titleForPage(page: AppPage) {
  const labels: Record<AppPage, string> = {
    "application.overview": "Overview",
    "application.landing": "Landing Desk",
    "application.profile": "Application Profile",
    "application.settings": "Application Settings",
    "billing.overview": "Overview",
    "billing.sales": "Sales",
    "billing.settings": "Billing Settings",
    "core.country": "Countries"
  };
  return labels[page];
}

function appFromPage(page: AppPage, landingApp: PlatformAppId, enabledApps: PlatformAppId[]): PlatformAppId {
  if (page.startsWith("billing") || page.startsWith("core")) return enabledApps.includes("billing") ? "billing" : landingApp;
  return "application";
}

function pageForApp(app: PlatformAppId): AppPage {
  return app === "billing" ? "billing.overview" : "application.overview";
}

function isAppRootPath() {
  return window.location.pathname === "/app" || window.location.pathname === "/app/";
}

function readPublishedLandingApp(): PlatformAppId | null {
  try {
    const stored = window.localStorage.getItem(LANDING_APP_STORAGE_KEY);
    return stored === "application" || stored === "billing" ? stored : null;
  } catch {
    return null;
  }
}
