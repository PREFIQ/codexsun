import { useEffect, useMemo, useState } from "react";
import {
  Building2Icon,
  ClipboardListIcon,
  CreditCardIcon,
  FileTextIcon,
  IndianRupeeIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
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
import {
  ApplicationLayout,
  Button,
  Card,
  Label,
  RadioGroup,
  RadioGroupItem,
  StatusBadge
} from "@codexsun/ui";
import { AuthGate } from "../../shared/auth/AuthGate";
import {
  appMenuItemsFor,
  appWorkspaceItems,
  defaultLandingApp,
  enabledAppIds,
  type PlatformAppId
} from "../../app/app-registry";
import { getTenantRuntime } from "../../modules/tenant/tenant.services";
import { AddressTypesWorkspace } from "@codexsun/core-web/modules/common/contacts/address-types";
import { BankNamesWorkspace } from "@codexsun/core-web/modules/common/contacts/bank-names";
import { ContactGroupsWorkspace } from "@codexsun/core-web/modules/common/contacts/contact-groups";
import { ContactTypesWorkspace } from "@codexsun/core-web/modules/common/contacts/contact-types";
import { CityWorkspace } from "@codexsun/core-web/modules/common/location/city";
import { CountryWorkspace } from "@codexsun/core-web/modules/common/location/country";
import { DistrictWorkspace } from "@codexsun/core-web/modules/common/location/district";
import { PincodeWorkspace } from "@codexsun/core-web/modules/common/location/pincode";
import { StateWorkspace } from "@codexsun/core-web/modules/common/location/state";
import { CurrenciesWorkspace } from "@codexsun/core-web/modules/common/others/currencies";
import { MonthsWorkspace } from "@codexsun/core-web/modules/common/others/months";
import { PaymentTermsWorkspace } from "@codexsun/core-web/modules/common/others/payment-terms";
import { PrioritiesWorkspace } from "@codexsun/core-web/modules/common/others/priorities";
import { SalesTypesWorkspace } from "@codexsun/core-web/modules/common/others/sales-types";
import { BrandsWorkspace } from "@codexsun/core-web/modules/common/products/brands";
import { ColoursWorkspace } from "@codexsun/core-web/modules/common/products/colours";
import { HsnCodesWorkspace } from "@codexsun/core-web/modules/common/products/hsn-codes";
import { ProductCategoriesWorkspace } from "@codexsun/core-web/modules/common/products/product-categories";
import { ProductGroupsWorkspace } from "@codexsun/core-web/modules/common/products/product-groups";
import { ProductTypesWorkspace } from "@codexsun/core-web/modules/common/products/product-types";
import { SizesWorkspace } from "@codexsun/core-web/modules/common/products/sizes";
import { StylesWorkspace } from "@codexsun/core-web/modules/common/products/styles";
import { TaxesWorkspace } from "@codexsun/core-web/modules/common/products/taxes";
import { UnitsWorkspace } from "@codexsun/core-web/modules/common/products/units";
import { DestinationsWorkspace } from "@codexsun/core-web/modules/common/workorder/destinations";
import { StockRejectionTypesWorkspace } from "@codexsun/core-web/modules/common/workorder/stock-rejection-types";
import { TransportsWorkspace } from "@codexsun/core-web/modules/common/workorder/transports";
import { WarehousesWorkspace } from "@codexsun/core-web/modules/common/workorder/warehouses";
import { WorkOrderTypesWorkspace } from "@codexsun/core-web/modules/common/workorder/work-order-types";
import { ContactWorkspace } from "@codexsun/core-web/modules/master/contact";
import { ProductWorkspace } from "@codexsun/core-web/modules/master/product";
import { WorkOrderWorkspace } from "@codexsun/core-web/modules/master/work-order";
import { CompanyWorkspace, listCompanies } from "@codexsun/core-web/modules/organisation/company";
import { QuotationWorkspace } from "../../modules/quotation/quotation.workspace";
import { SalesWorkspace } from "../../modules/sales/sales.workspace";
import { PurchaseWorkspace } from "../../modules/purchase/purchase.workspace";
import { ExportSalesWorkspace } from "../../modules/export-sales/export-sales.workspace";
import { PaymentWorkspace } from "../../modules/payment/payment.workspace";
import { ReceiptWorkspace } from "../../modules/receipt/receipt.workspace";
import {
  AccountsSettingsWorkspace,
  AccountsWorkspace,
  getAccountsSettings
} from "../../modules/accounts";
import {
  BillingSettingsWorkspace,
  DocumentSettingsWorkspace
} from "../../modules/billing-settings";
import { getToken, setTenantDbName, setTenantId } from "../../shared/api/platform-api";

type AppPage =
  | "application.overview"
  | "application.landing"
  | "application.profile"
  | "application.settings"
  | "billing.overview"
  | "billing.quotation"
  | "billing.sales"
  | "billing.purchase"
  | "billing.export-sales"
  | "billing.payment"
  | "billing.receipt"
  | "billing.settings"
  | "billing.document-settings"
  | "task-manager.overview"
  | "task-manager.todos"
  | "accounts.overview"
  | "accounts.groups"
  | "accounts.ledgers"
  | "accounts.opening-balances"
  | "accounts.vouchers"
  | "accounts.sales-postings"
  | "accounts.receipts-payments"
  | "accounts.reports"
  | "accounts.trial-balance"
  | "accounts.ledger-statement"
  | "accounts.balance-sheet"
  | "accounts.profit-loss"
  | "accounts.settings"
  | "accounts.posting-rules"
  | "accounts.financial-year"
  | "accounts.voucher-numbering"
  | "accounts.tally-integration"
  | "core.common.location.countries"
  | "core.common.location.states"
  | "core.common.location.districts"
  | "core.common.location.cities"
  | "core.common.location.pincodes"
  | "core.organisation.company"
  | "core.master.contact"
  | "core.master.product"
  | "core.master.work-order"
  | `core.common.${"contacts" | "others" | "products" | "workorder"}.${string}`;
const LANDING_APP_STORAGE_KEY = "codexsun.tenant.landing-app.live";
const COMPANY_CONTEXT_STORAGE_KEY = "codexsun.tenant.company-id";

export function AppDesk() {
  const [page, setPage] = useState<AppPage>(() => pageFromUrl(readPublishedLandingApp()));
  const [publishedLandingApp, setPublishedLandingApp] = useState<PlatformAppId | null>(() =>
    readPublishedLandingApp()
  );
  const [shouldResolveLandingPath, setShouldResolveLandingPath] = useState(() => isAppRootPath());
  const runtimeQuery = useQuery({
    queryFn: getTenantRuntime,
    queryKey: ["tenant", "runtime"]
  });
  const companiesQuery = useQuery({
    enabled: Boolean(runtimeQuery.data?.tenant?.uuid),
    queryFn: () => listCompanies(),
    queryKey: ["core", "organisation", "companies", runtimeQuery.data?.tenant?.uuid]
  });
  const accountingSettingsQuery = useQuery({
    enabled: Boolean(runtimeQuery.data?.tenant?.uuid),
    queryFn: getAccountsSettings,
    queryKey: ["accounts", "settings", runtimeQuery.data?.tenant?.uuid]
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => readSelectedCompanyId());

  const runtime = runtimeQuery.data;
  const moduleKeys = runtime?.tenant?.enabledModuleKeys ?? ["platform.application"];
  const enabledApps = enabledAppIds(moduleKeys);
  const switchableApps = uniqueApps(enabledApps);
  const runtimeLandingApp =
    runtime?.defaultLandingApp ?? defaultLandingApp(runtime?.tenant?.defaultLandingApp, moduleKeys);
  const landingApp =
    publishedLandingApp && enabledApps.includes(publishedLandingApp)
      ? publishedLandingApp
      : runtimeLandingApp;
  const activeApp = appFromPage(page, landingApp, switchableApps);
  const safePage =
    ((page.startsWith("billing") ||
      (page.startsWith("core") && !page.startsWith("core.organisation"))) &&
      !switchableApps.includes("billing")) ||
    (page.startsWith("accounts") && !switchableApps.includes("accounts"))
      ? pageForApp(landingApp)
      : page;
  const activeCompanies = useMemo(
    () => (companiesQuery.data ?? []).filter((company) => company.isActive),
    [companiesQuery.data]
  );
  const selectedCompany =
    activeCompanies.find((company) => String(company.id) === selectedCompanyId) ??
    activeCompanies[0] ??
    null;
  const accountingYear = financialYearLabel(accountingSettingsQuery.data?.financialYear);

  useEffect(() => {
    if (publishedLandingApp && !enabledApps.includes(publishedLandingApp)) {
      setPublishedLandingApp(null);
      window.localStorage.removeItem(LANDING_APP_STORAGE_KEY);
    }
  }, [enabledApps, publishedLandingApp]);

  useEffect(() => {
    if (runtime?.tenant) {
      setTenantId(runtime.tenant.uuid);
      setTenantDbName(runtime.tenant.dbName);
    }
  }, [runtime?.tenant]);

  useEffect(() => {
    if (!selectedCompany || String(selectedCompany.id) === selectedCompanyId) return;
    setSelectedCompanyId(String(selectedCompany.id));
    window.localStorage.setItem(COMPANY_CONTEXT_STORAGE_KEY, String(selectedCompany.id));
  }, [selectedCompany, selectedCompanyId]);

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

  const activeWorkspaceTitle =
    activeApp === "billing" ? "Billing" : activeApp === "accounts" ? "Accounts" : "Application";
  const menuItems = appMenuItemsFor(activeApp, safePage, (nextPage) =>
    selectPage(nextPage as AppPage)
  );
  const workspaceItems = appWorkspaceItems(switchableApps, activeApp).map((item) => ({
    ...item,
    onSelect: () =>
      selectPage(
        item.title === "Application"
          ? "application.overview"
          : item.title === "Billing"
            ? "billing.overview"
            : "accounts.overview"
      ),
    url:
      item.title === "Application"
        ? "/app/application/overview"
        : item.title === "Billing"
          ? "/app/billing/overview"
          : "/app/accounts/overview"
  }));

  return (
    <AuthGate desk="tenant">
      <ApplicationLayout
        brand={{
          href:
            activeApp === "billing"
              ? "/app/billing/overview"
              : activeApp === "accounts"
                ? "/app/accounts/overview"
                : "/app/application/overview",
          options: activeCompanies.map((company) => ({
            id: String(company.id),
            subtitle: `${company.code} · ${accountingYear}`,
            title: company.name
          })),
          onOptionSelect: (id) => {
            setSelectedCompanyId(id);
            window.localStorage.setItem(COMPANY_CONTEXT_STORAGE_KEY, id);
          },
          ...(selectedCompany ? { selectedOptionId: String(selectedCompany.id) } : {}),
          subtitle: selectedCompany
            ? accountingYear
            : `${activeWorkspaceTitle.toLowerCase()} workspace`,
          title: selectedCompany?.name ?? activeWorkspaceTitle
        }}
        headerTitle={titleForPage(safePage)}
        menuItems={menuItems}
        subtitle={null}
        title={null}
        versionLabel={`v ${__APP_VERSION__}`}
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
          {safePage === "billing.quotation" ? <QuotationWorkspace /> : null}
          {safePage === "billing.sales" ? <BillingSales /> : null}
          {safePage === "billing.purchase" ? <PurchaseWorkspace /> : null}
          {safePage === "billing.export-sales" ? <ExportSalesWorkspace /> : null}
          {safePage === "billing.payment" ? <PaymentWorkspace /> : null}
          {safePage === "billing.receipt" ? <ReceiptWorkspace /> : null}
          {safePage === "billing.settings" ? <BillingSettingsWorkspace /> : null}
          {safePage === "billing.document-settings" ? <DocumentSettingsWorkspace /> : null}
          {isAccountsPage(safePage) &&
          safePage !== "accounts.settings" &&
          !isAccountsSettingsPage(safePage) ? (
            <AccountsWorkspace page={accountsWorkspacePage(safePage)} />
          ) : null}
          {isAccountsSettingsPage(safePage) ? <AccountsSettings page={safePage} /> : null}
          {safePage === "core.organisation.company" ? <CompanyWorkspace /> : null}
          {renderOwnedLocationPage(safePage)}
          {renderOwnedCommonMasterPage(safePage)}
          {safePage === "core.master.contact" ? <ContactWorkspace key={safePage} /> : null}
          {safePage === "core.master.product" ? <ProductWorkspace key={safePage} /> : null}
          {safePage === "core.master.work-order" ? <WorkOrderWorkspace key={safePage} /> : null}
        </main>
      </ApplicationLayout>
    </AuthGate>
  );
}

function readSelectedCompanyId() {
  try {
    return window.localStorage.getItem(COMPANY_CONTEXT_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function financialYearLabel(value: { endDate: string; startDate: string } | undefined) {
  if (!value?.startDate || !value.endDate) return "Accounting year";
  const startYear = value.startDate.slice(0, 4);
  const endYear = value.endDate.slice(2, 4);
  return /^\d{4}$/.test(startYear) && /^\d{2}$/.test(endYear)
    ? `FY ${startYear}-${endYear}`
    : `${value.startDate} to ${value.endDate}`;
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
    key === "billing.purchase" ||
    key === "billing.export-sales" ||
    key === "billing.payment" ||
    key === "billing.receipt" ||
    key === "billing.settings" ||
    key === "billing.document-settings" ||
    key === "accounts.overview" ||
    key === "accounts.groups" ||
    key === "accounts.ledgers" ||
    key === "accounts.opening-balances" ||
    key === "accounts.vouchers" ||
    key === "accounts.sales-postings" ||
    key === "accounts.receipts-payments" ||
    key === "accounts.reports" ||
    key === "accounts.trial-balance" ||
    key === "accounts.ledger-statement" ||
    key === "accounts.balance-sheet" ||
    key === "accounts.profit-loss" ||
    key === "accounts.settings" ||
    key === "accounts.posting-rules" ||
    key === "accounts.financial-year" ||
    key === "accounts.voucher-numbering" ||
    key === "accounts.tally-integration" ||
    key === "core.common.location.countries" ||
    key === "core.common.location.states" ||
    key === "core.common.location.districts" ||
    key === "core.common.location.cities" ||
    key === "core.common.location.pincodes" ||
    key === "core.organisation.company" ||
    key === "core.master.contact" ||
    key === "core.master.product" ||
    key === "core.master.work-order" ||
    isCommonMasterPage(key)
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
    icon:
      appId === "billing"
        ? CreditCardIcon
        : appId === "accounts"
          ? LandmarkIcon
          : appId === "task-manager"
            ? ListChecksIcon
            : LayoutDashboardIcon,
    iconClass:
      appId === "billing"
        ? "bg-emerald-600 text-white"
        : appId === "accounts"
          ? "bg-blue-700 text-white"
          : appId === "task-manager"
            ? "bg-violet-600 text-white"
            : "bg-slate-950 text-white",
    id: appId,
    label:
      appId === "billing"
        ? "Billing"
        : appId === "accounts"
          ? "Accounts"
          : appId === "task-manager"
            ? "Task Manager"
            : "Application"
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
          <p className="mt-2 text-sm text-muted-foreground">
            Choose which enabled app opens first for this workspace.
          </p>
        </div>
        <Button disabled={!dirty} icon={<RocketIcon />} onClick={() => onPublish(draftLandingApp)}>
          Publish live
        </Button>
      </div>

      <div className="rounded-md border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-normal">Default landing app</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Only enabled apps are available as landing choices.
            </p>
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
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-md ${choice.iconClass}`}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{choice.label}</span>
                  </span>
                  <span className="mt-2 block text-sm font-normal leading-5 text-muted-foreground">
                    {choice.description}
                  </span>
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
                  Tenant application workspace for landing setup, platform profile, settings, users,
                  and access.
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

function ApplicationShortcut({
  description,
  icon: Icon,
  title
}: {
  description: string;
  icon: typeof LayoutDashboardIcon;
  title: string;
}) {
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
    <Card
      title="Application Profile"
      description="Platform identity, workspace access, and tenant context."
    >
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
  return <SalesWorkspace />;
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
            <BillingShortcut
              title="Sales Entry"
              description="Create and review billing sales documents."
              icon={CreditCardIcon}
            />
            <BillingShortcut
              title="Purchase Entry"
              description="Track purchase-side billing entries."
              icon={ShoppingBagIcon}
            />
            <BillingShortcut
              title="Receipt Entry"
              description="Record collections and receipts."
              icon={ClipboardListIcon}
            />
            <BillingShortcut
              title="Payment Entry"
              description="Record outgoing payments."
              icon={IndianRupeeIcon}
            />
          </div>
        </div>
        <div className="rounded-md border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-normal">Billing Setup</h2>
          <div className="mt-4 space-y-3">
            <BillingSetupRow
              title="Core Masters"
              description="Countries and shared billing master data."
              tone="blue"
            />
            <BillingSetupRow
              title="Document Settings"
              description="Billing module settings and document setup."
              tone="green"
            />
            <BillingSetupRow
              title="Reports"
              description="Sales, purchase, receipt, and payment summaries."
              tone="amber"
            />
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

function BillingShortcut({
  description,
  icon: Icon,
  title
}: {
  description: string;
  icon: typeof CreditCardIcon;
  title: string;
}) {
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

function BillingSetupRow({
  description,
  title,
  tone
}: {
  description: string;
  title: string;
  tone: "amber" | "blue" | "green";
}) {
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
    const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))) as {
      email?: unknown;
    };
    return typeof payload.email === "string" ? payload.email : "";
  } catch {
    return "";
  }
}

function AccountsSettings({
  page = "accounts.settings"
}: {
  page?: Extract<AppPage, `accounts.${string}`>;
}) {
  const title = titleForPage(page);
  const description = accountsSettingsDescription(page);
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border bg-card p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground">Accounts</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <StatusBadge tone="green">Accounts enabled</StatusBadge>
      </div>
      <AccountsSettingsWorkspace page={page} />
    </section>
  );
}

function isAccountsSettingsPage(page: AppPage): page is Extract<AppPage, `accounts.${string}`> {
  return (
    page === "accounts.settings" ||
    page === "accounts.posting-rules" ||
    page === "accounts.financial-year" ||
    page === "accounts.voucher-numbering" ||
    page === "accounts.tally-integration"
  );
}

function isAccountsPage(page: AppPage): page is Extract<AppPage, `accounts.${string}`> {
  return page.startsWith("accounts.");
}

function accountsWorkspacePage(
  page: Extract<AppPage, `accounts.${string}`>
): "overview" | "ledgers" | "vouchers" | "reports" {
  if (
    page === "accounts.groups" ||
    page === "accounts.ledgers" ||
    page === "accounts.opening-balances"
  )
    return "ledgers";
  if (
    page === "accounts.vouchers" ||
    page === "accounts.sales-postings" ||
    page === "accounts.receipts-payments"
  )
    return "vouchers";
  if (
    page === "accounts.reports" ||
    page === "accounts.trial-balance" ||
    page === "accounts.ledger-statement" ||
    page === "accounts.balance-sheet" ||
    page === "accounts.profit-loss"
  )
    return "reports";
  return "overview";
}

function accountsSettingsDescription(page: Extract<AppPage, `accounts.${string}`>) {
  const descriptions: Partial<Record<Extract<AppPage, `accounts.${string}`>, string>> = {
    "accounts.financial-year": "Financial year, period locks, and accounting period controls.",
    "accounts.posting-rules":
      "Backend billing-to-accounts posting rules for save, update, delete, and reversal flows.",
    "accounts.settings":
      "Financial year, posting policy, period locks, voucher numbering, and Tally sync settings.",
    "accounts.tally-integration":
      "Tally-ready ledger names, voucher export mapping, and next integration settings.",
    "accounts.voucher-numbering":
      "Voucher numbering series for sales, journal, receipt, payment, debit note, and credit note entries."
  };
  return descriptions[page] ?? "Accounts configuration.";
}

function renderOwnedLocationPage(page: AppPage) {
  if (page === "core.common.location.countries") return <CountryWorkspace />;
  if (page === "core.common.location.states") return <StateWorkspace />;
  if (page === "core.common.location.districts") return <DistrictWorkspace />;
  if (page === "core.common.location.cities") return <CityWorkspace />;
  if (page === "core.common.location.pincodes") return <PincodeWorkspace />;
  return null;
}

function renderOwnedCommonMasterPage(page: AppPage) {
  if (page === "core.common.contacts.contact-groups") return <ContactGroupsWorkspace />;
  if (page === "core.common.contacts.contact-types") return <ContactTypesWorkspace />;
  if (page === "core.common.contacts.address-types") return <AddressTypesWorkspace />;
  if (page === "core.common.contacts.bank-names") return <BankNamesWorkspace />;
  if (page === "core.common.products.product-groups") return <ProductGroupsWorkspace />;
  if (page === "core.common.products.product-categories") return <ProductCategoriesWorkspace />;
  if (page === "core.common.products.product-types") return <ProductTypesWorkspace />;
  if (page === "core.common.products.units") return <UnitsWorkspace />;
  if (page === "core.common.products.hsn-codes") return <HsnCodesWorkspace />;
  if (page === "core.common.products.taxes") return <TaxesWorkspace />;
  if (page === "core.common.products.brands") return <BrandsWorkspace />;
  if (page === "core.common.products.colours") return <ColoursWorkspace />;
  if (page === "core.common.products.sizes") return <SizesWorkspace />;
  if (page === "core.common.products.styles") return <StylesWorkspace />;
  if (page === "core.common.workorder.work-order-types") return <WorkOrderTypesWorkspace />;
  if (page === "core.common.workorder.transports") return <TransportsWorkspace />;
  if (page === "core.common.workorder.warehouses") return <WarehousesWorkspace />;
  if (page === "core.common.workorder.destinations") return <DestinationsWorkspace />;
  if (page === "core.common.workorder.stock-rejection-types")
    return <StockRejectionTypesWorkspace />;
  if (page === "core.common.others.currencies") return <CurrenciesWorkspace />;
  if (page === "core.common.others.priorities") return <PrioritiesWorkspace />;
  if (page === "core.common.others.payment-terms") return <PaymentTermsWorkspace />;
  if (page === "core.common.others.sales-types") return <SalesTypesWorkspace />;
  if (page === "core.common.others.months") return <MonthsWorkspace />;
  return null;
}

function titleForPage(page: AppPage) {
  const labels: Partial<Record<AppPage, string>> = {
    "application.overview": "Overview",
    "application.landing": "Landing Desk",
    "application.profile": "Application Profile",
    "application.settings": "Application Settings",
    "billing.overview": "Overview",
    "billing.quotation": "Quotation",
    "billing.sales": "Sales",
    "billing.purchase": "Purchase",
    "billing.export-sales": "Export Sales",
    "billing.payment": "Payment",
    "billing.receipt": "Receipt",
    "billing.settings": "Billing Settings",
    "billing.document-settings": "Document Settings",
    "task-manager.overview": "Task Manager",
    "task-manager.todos": "Todo",
    "accounts.overview": "Overview",
    "accounts.groups": "Account Groups",
    "accounts.ledgers": "Ledgers",
    "accounts.opening-balances": "Opening Balances",
    "accounts.vouchers": "Vouchers",
    "accounts.sales-postings": "Billing Postings",
    "accounts.receipts-payments": "Receipts & Payments",
    "accounts.reports": "Accounts Reports",
    "accounts.trial-balance": "Trial Balance",
    "accounts.ledger-statement": "Ledger Statement",
    "accounts.balance-sheet": "Balance Sheet",
    "accounts.profit-loss": "Profit & Loss",
    "accounts.settings": "Accounts Settings",
    "accounts.posting-rules": "Posting Rules",
    "accounts.financial-year": "Financial Year",
    "accounts.voucher-numbering": "Voucher Numbering",
    "accounts.tally-integration": "Tally Integration",
    "core.common.location.cities": "Cities",
    "core.common.location.countries": "Countries",
    "core.common.location.districts": "Districts",
    "core.common.location.pincodes": "Pincodes",
    "core.common.location.states": "States",
    "core.common.contacts.address-types": "Address Types",
    "core.common.contacts.bank-names": "Bank Names",
    "core.common.contacts.contact-groups": "Contact Groups",
    "core.common.contacts.contact-types": "Contact Types",
    "core.common.others.currencies": "Currencies",
    "core.common.others.months": "Months",
    "core.common.others.payment-terms": "Payment Terms",
    "core.common.others.priorities": "Priorities",
    "core.common.others.sales-types": "Sales Types",
    "core.common.products.brands": "Brands",
    "core.common.products.colours": "Colours",
    "core.common.products.hsn-codes": "HSN Codes",
    "core.common.products.product-categories": "Product Categories",
    "core.common.products.product-groups": "Product Groups",
    "core.common.products.product-types": "Product Types",
    "core.common.products.sizes": "Sizes",
    "core.common.products.styles": "Styles",
    "core.common.products.taxes": "Taxes",
    "core.common.products.units": "Units",
    "core.common.workorder.destinations": "Destinations",
    "core.common.workorder.stock-rejection-types": "Stock Rejection Types",
    "core.common.workorder.transports": "Transports",
    "core.common.workorder.warehouses": "Warehouses",
    "core.common.workorder.work-order-types": "Work Order Types",
    "core.organisation.company": "Company",
    "core.master.contact": "Contact",
    "core.master.product": "Product",
    "core.master.work-order": "Work Order"
  };
  return labels[page] ?? "Application";
}

function isCommonMasterPage(page: string): page is AppPage {
  return COMMON_MASTER_PAGES.has(page);
}

const COMMON_MASTER_PAGES = new Set<string>([
  "core.common.contacts.address-types",
  "core.common.contacts.bank-names",
  "core.common.contacts.contact-groups",
  "core.common.contacts.contact-types",
  "core.common.others.currencies",
  "core.common.others.months",
  "core.common.others.payment-terms",
  "core.common.others.priorities",
  "core.common.others.sales-types",
  "core.common.products.brands",
  "core.common.products.colours",
  "core.common.products.hsn-codes",
  "core.common.products.product-categories",
  "core.common.products.product-groups",
  "core.common.products.product-types",
  "core.common.products.sizes",
  "core.common.products.styles",
  "core.common.products.taxes",
  "core.common.products.units",
  "core.common.workorder.destinations",
  "core.common.workorder.stock-rejection-types",
  "core.common.workorder.transports",
  "core.common.workorder.warehouses",
  "core.common.workorder.work-order-types"
]);

function appFromPage(
  page: AppPage,
  landingApp: PlatformAppId,
  enabledApps: PlatformAppId[]
): PlatformAppId {
  if (page.startsWith("core.organisation")) return "application";
  if (page.startsWith("billing") || page.startsWith("core"))
    return enabledApps.includes("billing") ? "billing" : landingApp;
  if (page.startsWith("accounts"))
    return enabledApps.includes("accounts") ? "accounts" : landingApp;
  if (page.startsWith("task-manager"))
    return enabledApps.includes("task-manager") ? "task-manager" : landingApp;
  return "application";
}

function pageForApp(app: PlatformAppId): AppPage {
  if (app === "accounts") return "accounts.overview";
  if (app === "task-manager") return "task-manager.overview";
  return app === "billing" ? "billing.overview" : "application.overview";
}

function isAppRootPath() {
  return window.location.pathname === "/app" || window.location.pathname === "/app/";
}

function readPublishedLandingApp(): PlatformAppId | null {
  try {
    const stored = window.localStorage.getItem(LANDING_APP_STORAGE_KEY);
    return stored === "application" ||
      stored === "billing" ||
      stored === "accounts" ||
      stored === "task-manager"
      ? stored
      : null;
  } catch {
    return null;
  }
}
