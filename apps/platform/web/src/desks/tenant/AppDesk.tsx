import { useEffect, useState } from "react";
import {
  Building2Icon,
  ClipboardListIcon,
  CreditCardIcon,
  FileTextIcon,
  IndianRupeeIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  ReceiptIndianRupeeIcon,
  ReceiptTextIcon,
  RocketIcon,
  Settings2Icon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  UserRoundIcon,
  WalletCardsIcon
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ApplicationLayout, Button, Card, Label, RadioGroup, RadioGroupItem, StatusBadge } from "@codexsun/ui";
import { AuthGate } from "../../shared/auth/AuthGate";
import { appMenuItemsFor, appWorkspaceItems, defaultLandingApp, enabledAppIds, type PlatformAppId } from "../../app/app-registry";
import { getTenantRuntime } from "../../modules/tenant/tenant.services";
import { LocationWorkspace, type LocationKind } from "../../modules/location";
import { CommonMasterWorkspace } from "../../modules/common-master";
import { commonMasterDefinitions } from "../../modules/common/registry";
import { BillingEntriesWorkspace } from "../../modules/entries";
import { AccountsWorkspace } from "../../modules/accounts";
import { getToken } from "../../shared/api/platform-api";

type AppPage =
  | "application.overview"
  | "application.landing"
  | "application.profile"
  | "application.settings"
  | "billing.overview"
  | "billing.quotation"
  | "billing.sales"
  | "billing.settings"
  | "accounts.overview"
  | "accounts.ledgers"
  | "accounts.vouchers"
  | "accounts.reports"
  | "accounts.settings"
  | "core.common.location.countries"
  | "core.common.location.states"
  | "core.common.location.districts"
  | "core.common.location.cities"
  | "core.common.location.pincodes"
  | `core.common.${"contacts" | "others" | "products" | "workorder"}.${string}`;
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
  const switchableApps = uniqueApps(enabledApps);
  const runtimeLandingApp = runtime?.defaultLandingApp ?? defaultLandingApp(runtime?.tenant?.defaultLandingApp, moduleKeys);
  const landingApp = publishedLandingApp && enabledApps.includes(publishedLandingApp) ? publishedLandingApp : runtimeLandingApp;
  const activeApp = appFromPage(page, landingApp, switchableApps);
  const safePage =
    ((page.startsWith("billing") || page.startsWith("core")) && !switchableApps.includes("billing")) ||
    (page.startsWith("accounts") && !switchableApps.includes("accounts"))
      ? pageForApp(landingApp)
      : page;

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
    window.history.pushState({ page: nextPage }, "", `/app/${nextPage.replaceAll(".", "/")}`);
  }

  function publishLandingApp(nextLandingApp: PlatformAppId) {
    setPublishedLandingApp(nextLandingApp);
    window.localStorage.setItem(LANDING_APP_STORAGE_KEY, nextLandingApp);
  }

  const activeWorkspaceTitle = activeApp === "billing" ? "Billing" : activeApp === "accounts" ? "Accounts" : "Application";
  const menuItems = appMenuItemsFor(activeApp, safePage, (nextPage) => selectPage(nextPage as AppPage));
  const workspaceItems = appWorkspaceItems(switchableApps, activeApp).map((item) => ({
    ...item,
    url: item.title === "Application" ? "/app/application/overview" : item.title === "Billing" ? "/app/billing/overview" : "/app/accounts/overview"
  }));

  return (
    <AuthGate desk="tenant">
      <ApplicationLayout
        brand={{
          href: activeApp === "billing" ? "/app/billing/overview" : activeApp === "accounts" ? "/app/accounts/overview" : "/app/application/overview",
          subtitle: `${activeWorkspaceTitle.toLowerCase()} workspace`,
          title: activeWorkspaceTitle
        }}
        headerTitle={titleForPage(safePage)}
        menuItems={menuItems}
        subtitle={null}
        title={null}
        workspaceItems={workspaceItems}
      >
        <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-4 lg:w-[calc(100%-3rem)] lg:py-5">
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
          {safePage === "billing.quotation" ? <BillingEntriesWorkspace kind="quotation" /> : null}
          {safePage === "billing.sales" ? <BillingSales /> : null}
          {safePage === "billing.settings" ? <BillingSettings /> : null}
          {safePage === "accounts.overview" ? <AccountsWorkspace page="overview" /> : null}
          {safePage === "accounts.ledgers" ? <AccountsWorkspace page="ledgers" /> : null}
          {safePage === "accounts.vouchers" ? <AccountsWorkspace page="vouchers" /> : null}
          {safePage === "accounts.reports" ? <AccountsWorkspace page="reports" /> : null}
          {safePage === "accounts.settings" ? <AccountsSettings /> : null}
          {isCoreLocationPage(safePage) ? <LocationWorkspace kind={locationKindFromPage(safePage)} /> : null}
          {isCommonMasterPage(safePage) ? <CommonMasterWorkspace definition={definitionFromPage(safePage)} /> : null}
        </main>
      </ApplicationLayout>
    </AuthGate>
  );
}

function uniqueApps(apps: PlatformAppId[]) {
  return Array.from(new Set(["application" as PlatformAppId, ...apps]));
}

function pageFromUrl(landingApp: PlatformAppId | null): AppPage {
  const [, , app, ...children] = window.location.pathname.split("/");
  if (!app) return pageForApp(landingApp ?? "application");

  const key = `${app}.${children.filter(Boolean).join(".") || "overview"}`;
  if (
    key === "application.overview" ||
    key === "application.landing" ||
    key === "application.profile" ||
    key === "application.settings" ||
    key === "billing.overview" ||
    key === "billing.quotation" ||
    key === "billing.desk" ||
    key === "billing.sales" ||
    key === "billing.settings" ||
    key === "accounts.overview" ||
    key === "accounts.ledgers" ||
    key === "accounts.vouchers" ||
    key === "accounts.reports" ||
    key === "accounts.settings" ||
    key === "core.common.location.countries" ||
    key === "core.common.location.states" ||
    key === "core.common.location.districts" ||
    key === "core.common.location.cities" ||
    key === "core.common.location.pincodes" ||
    commonMasterDefinitions.some((definition) => pageKeyForCommonMaster(definition.path) === key)
  ) {
    return (key === "billing.desk" ? "billing.overview" : key) as AppPage;
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
        : appId === "accounts"
          ? "Ledgers, vouchers, balances, reports, and Tally-ready accounting."
        : "Shared workspace, company setup, roles, and cross-app launch desk.",
    icon: appId === "billing" ? CreditCardIcon : appId === "accounts" ? LandmarkIcon : LayoutDashboardIcon,
    iconClass: appId === "billing" ? "bg-emerald-600 text-white" : appId === "accounts" ? "bg-blue-700 text-white" : "bg-slate-950 text-white",
    id: appId,
    label: appId === "billing" ? "Billing" : appId === "accounts" ? "Accounts" : "Application"
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
  const signedInLabel = signedInTenantLabel();

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-md border bg-card shadow-sm">
        <div className="relative min-h-36 p-5 md:p-6">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-indigo-100 via-sky-50 to-transparent md:block" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-md bg-slate-950 text-white shadow-sm">
                <LayoutDashboardIcon className="size-7" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase text-muted-foreground">Application</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-normal">Application Desk</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Tenant application workspace for landing setup, platform profile, settings, users, and access.
                </p>
              </div>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/90 px-4 py-2 text-sm font-medium shadow-sm">
              <UserRoundIcon className="size-4" />
              <span>Signed in as {signedInLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ApplicationDetailCard
          caption="Default workspace selection"
          icon={RocketIcon}
          iconClassName="bg-slate-950 text-white"
          statusTone="green"
          title="Landing Desk"
          value="Configured"
        />
        <ApplicationDetailCard
          caption="Tenant identity and context"
          icon={Building2Icon}
          iconClassName="bg-sky-600 text-white"
          statusTone="green"
          title="Platform Profile"
          value="Active"
        />
        <ApplicationDetailCard
          caption="Tenant-scoped controls"
          icon={Settings2Icon}
          iconClassName="bg-amber-500 text-white"
          statusTone="blue"
          title="Settings"
          value="Ready"
        />
        <ApplicationDetailCard
          caption="Application and billing desks"
          icon={ShieldCheckIcon}
          iconClassName="bg-emerald-600 text-white"
          statusTone="green"
          title="App Access"
          value="2 areas"
        />
      </div>

      <div className="rounded-md border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-normal">Application Menu</h2>
          <StatusBadge tone="green">Ready</StatusBadge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ApplicationShortcut
            description="Choose which enabled app opens first for this workspace."
            icon={LayoutDashboardIcon}
            title="Landing Desk"
          />
          <ApplicationShortcut
            description="Review application identity and tenant workspace context."
            icon={Building2Icon}
            title="Platform Profile"
          />
          <ApplicationShortcut
            description="Manage tenant-scoped application settings and access controls."
            icon={Settings2Icon}
            title="Settings"
          />
        </div>
      </div>
    </section>
  );
}

function ApplicationDetailCard({
  caption,
  icon: Icon,
  iconClassName,
  statusTone,
  title,
  value
}: {
  caption: string;
  icon: typeof LayoutDashboardIcon;
  iconClassName: string;
  statusTone: "blue" | "green";
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="mt-2 text-2xl font-semibold tracking-normal">{value}</div>
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-md ${iconClassName}`}>
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-7 flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{caption}</span>
        <StatusBadge tone={statusTone}>Enabled</StatusBadge>
      </div>
    </div>
  );
}

function ApplicationShortcut({ description, icon: Icon, title }: { description: string; icon: typeof LayoutDashboardIcon; title: string }) {
  return (
    <div className="flex min-h-28 items-start gap-3 rounded-md border bg-background p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-foreground">
        <Icon className="size-5" />
      </span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
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
  return <BillingEntriesWorkspace kind="sales" />;
}

function BillingOverview() {
  const signedInLabel = signedInTenantLabel();

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-md border bg-card shadow-sm">
        <div className="relative min-h-36 p-5 md:p-6">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-emerald-100 via-teal-50 to-transparent md:block" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-md bg-emerald-600 text-white shadow-sm">
                <ReceiptTextIcon className="size-7" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase text-muted-foreground">Billing</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-normal">Billing Desk</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Sales, purchase, receipt, payment, report, master, common, and billing settings.
                </p>
              </div>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/90 px-4 py-2 text-sm font-medium shadow-sm">
              <UserRoundIcon className="size-4" />
              <span>Signed in as {signedInLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BillingEntryCard
          icon={ReceiptIndianRupeeIcon}
          iconClassName="bg-emerald-600 text-white"
          title="Total Sales"
          value="₹16,872.00"
          yearValue="₹16,872.00"
          monthValue="₹0.00"
        />
        <BillingEntryCard
          icon={ShoppingBagIcon}
          iconClassName="bg-sky-600 text-white"
          title="Total Purchase"
          value="₹0.00"
          yearValue="₹0.00"
          monthValue="₹0.00"
        />
        <BillingEntryCard
          icon={FileTextIcon}
          iconClassName="bg-amber-500 text-white"
          title="Receipts"
          value="₹200.00"
          yearValue="₹200.00"
          monthValue="₹0.00"
        />
        <BillingEntryCard
          icon={WalletCardsIcon}
          iconClassName="bg-rose-600 text-white"
          title="Payments"
          value="₹0.00"
          yearValue="₹0.00"
          monthValue="₹0.00"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_32rem]">
        <div className="rounded-md border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-normal">Entry Shortcuts</h2>
            <StatusBadge tone="green">Ready</StatusBadge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <BillingShortcut title="Sales Entry" description="Create and review billing sales documents." icon={CreditCardIcon} />
            <BillingShortcut title="Purchase Entry" description="Track purchase-side billing entries." icon={ShoppingBagIcon} />
            <BillingShortcut title="Receipt Entry" description="Record collections and receipts." icon={ClipboardListIcon} />
            <BillingShortcut title="Payment Entry" description="Record outgoing payments." icon={IndianRupeeIcon} />
          </div>
        </div>
        <div className="rounded-md border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-normal">Billing Setup</h2>
          <div className="mt-4 space-y-3">
            <BillingSetupRow title="Core Masters" description="Countries and shared billing master data." tone="blue" />
            <BillingSetupRow title="Document Settings" description="Billing module settings and document setup." tone="green" />
            <BillingSetupRow title="Reports" description="Sales, purchase, receipt, and payment summaries." tone="amber" />
          </div>
        </div>
      </div>
    </section>
  );
}

function BillingEntryCard({
  icon: Icon,
  iconClassName,
  monthValue,
  title,
  value,
  yearValue
}: {
  icon: typeof ReceiptTextIcon;
  iconClassName: string;
  monthValue: string;
  title: string;
  value: string;
  yearValue: string;
}) {
  return (
    <div className="rounded-md border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="mt-2 text-2xl font-semibold tracking-normal">{value}</div>
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-md ${iconClassName}`}>
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-7 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">This year</span>
          <span className="font-semibold tabular-nums">{yearValue}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">This month</span>
          <span className="font-semibold tabular-nums">{monthValue}</span>
        </div>
      </div>
    </div>
  );
}

function BillingShortcut({ description, icon: Icon, title }: { description: string; icon: typeof CreditCardIcon; title: string }) {
  return (
    <div className="flex min-h-28 items-start gap-3 rounded-md border bg-background p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-foreground">
        <Icon className="size-5" />
      </span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function BillingSetupRow({ description, title, tone }: { description: string; title: string; tone: "amber" | "blue" | "green" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-4 py-3">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{description}</div>
      </div>
      <StatusBadge tone={tone}>{tone === "amber" ? "Soon" : "Enabled"}</StatusBadge>
    </div>
  );
}

function signedInTenantLabel() {
  const token = getToken("tenant");
  const email = token ? decodeTokenEmail(token) : "";
  return email ? email.split("@")[0] : "user";
}

function decodeTokenEmail(token: string) {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return "";
    const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))) as { email?: unknown };
    return typeof payload.email === "string" ? payload.email : "";
  } catch {
    return "";
  }
}

function BillingSettings() {
  return (
    <Card title="Billing Settings" description="Billing module settings and document setup.">
      <StatusBadge tone="green">Enabled</StatusBadge>
    </Card>
  );
}

function AccountsSettings() {
  return (
    <Card title="Accounts Settings" description="Financial year, posting policy, period locks, voucher numbering, and Tally sync settings.">
      <StatusBadge tone="green">Accounts enabled</StatusBadge>
    </Card>
  );
}

function isCoreLocationPage(page: AppPage): page is Extract<AppPage, `core.common.location.${string}`> {
  return page.startsWith("core.common.location.");
}

function locationKindFromPage(page: Extract<AppPage, `core.common.location.${string}`>): LocationKind {
  const plural = page.split(".").at(-1);
  if (plural === "countries") return "country";
  if (plural === "states") return "state";
  if (plural === "districts") return "district";
  if (plural === "cities") return "city";
  return "pincode";
}

function isCommonMasterPage(page: AppPage): page is Extract<AppPage, `core.common.${"contacts" | "others" | "products" | "workorder"}.${string}`> {
  return commonMasterDefinitions.some((definition) => pageKeyForCommonMaster(definition.path) === page);
}

function definitionFromPage(page: Extract<AppPage, `core.common.${"contacts" | "others" | "products" | "workorder"}.${string}`>) {
  const definition = commonMasterDefinitions.find((item) => pageKeyForCommonMaster(item.path) === page);
  if (!definition) throw new Error(`Unknown common master page: ${page}`);
  return definition;
}

function pageKeyForCommonMaster(path: string) {
  return path.replace(/^\/core\//, "core.").replaceAll("/", ".");
}

function titleForPage(page: AppPage) {
  const commonDefinition = commonMasterDefinitions.find((definition) => pageKeyForCommonMaster(definition.path) === page);
  if (commonDefinition) return commonDefinition.label;
  const labels: Partial<Record<AppPage, string>> = {
    "application.overview": "Overview",
    "application.landing": "Landing Desk",
    "application.profile": "Application Profile",
    "application.settings": "Application Settings",
    "billing.overview": "Overview",
    "billing.quotation": "Quotation",
    "billing.sales": "Sales",
    "billing.settings": "Billing Settings",
    "accounts.overview": "Overview",
    "accounts.ledgers": "Ledgers",
    "accounts.vouchers": "Vouchers",
    "accounts.reports": "Accounts Reports",
    "accounts.settings": "Accounts Settings",
    "core.common.location.cities": "Cities",
    "core.common.location.countries": "Countries",
    "core.common.location.districts": "Districts",
    "core.common.location.pincodes": "Pincodes",
    "core.common.location.states": "States"
  };
  return labels[page] ?? "Application";
}

function appFromPage(page: AppPage, landingApp: PlatformAppId, enabledApps: PlatformAppId[]): PlatformAppId {
  if (page.startsWith("billing") || page.startsWith("core")) return enabledApps.includes("billing") ? "billing" : landingApp;
  if (page.startsWith("accounts")) return enabledApps.includes("accounts") ? "accounts" : landingApp;
  return "application";
}

function pageForApp(app: PlatformAppId): AppPage {
  if (app === "accounts") return "accounts.overview";
  return app === "billing" ? "billing.overview" : "application.overview";
}

function isAppRootPath() {
  return window.location.pathname === "/app" || window.location.pathname === "/app/";
}

function readPublishedLandingApp(): PlatformAppId | null {
  try {
    const stored = window.localStorage.getItem(LANDING_APP_STORAGE_KEY);
    return stored === "application" || stored === "billing" || stored === "accounts" ? stored : null;
  } catch {
    return null;
  }
}
