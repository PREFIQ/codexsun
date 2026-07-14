import { lazy, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Building2Icon,
  ClipboardListIcon,
  CreditCardIcon,
  FileTextIcon,
  IndianRupeeIcon,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { listCompanies } from "@codexsun/core-web/modules/organisation/company";
import {
  defaultCompanyQueryKey,
  getDefaultCompany,
  saveDefaultCompany,
  type LandingAppOption
} from "@codexsun/core-web/modules/organisation/default-company";
import { listFinancialYears } from "@codexsun/core-web/modules/organisation/financial-year";
import { getToken, setTenantDbName, setTenantId } from "../../shared/api/platform-api";

function lazyWorkspace<Props>(loader: () => Promise<ComponentType<Props>>) {
  return lazy(async () => ({ default: await loader() }));
}

const AddressTypesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/contacts/address-types").then(
    (module) => module.AddressTypesWorkspace
  )
);
const BankNamesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/contacts/bank-names").then(
    (module) => module.BankNamesWorkspace
  )
);
const ContactGroupsWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/contacts/contact-groups").then(
    (module) => module.ContactGroupsWorkspace
  )
);
const ContactTypesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/contacts/contact-types").then(
    (module) => module.ContactTypesWorkspace
  )
);
const CityWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/location/city").then((module) => module.CityWorkspace)
);
const CountryWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/location/country").then(
    (module) => module.CountryWorkspace
  )
);
const DistrictWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/location/district").then(
    (module) => module.DistrictWorkspace
  )
);
const PincodeWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/location/pincode").then(
    (module) => module.PincodeWorkspace
  )
);
const StateWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/location/state").then((module) => module.StateWorkspace)
);
const LedgerGroupsWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/accounts/ledger-groups").then(
    (module) => module.LedgerGroupsWorkspace
  )
);
const LedgersWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/accounts/ledgers").then(
    (module) => module.LedgersWorkspace
  )
);
const CurrenciesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/others/currencies").then(
    (module) => module.CurrenciesWorkspace
  )
);
const MonthsWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/others/months").then((module) => module.MonthsWorkspace)
);
const PaymentTermsWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/others/payment-terms").then(
    (module) => module.PaymentTermsWorkspace
  )
);
const PrioritiesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/others/priorities").then(
    (module) => module.PrioritiesWorkspace
  )
);
const SalesTypesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/others/sales-types").then(
    (module) => module.SalesTypesWorkspace
  )
);
const BrandsWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/products/brands").then(
    (module) => module.BrandsWorkspace
  )
);
const ColoursWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/products/colours").then(
    (module) => module.ColoursWorkspace
  )
);
const HsnCodesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/products/hsn-codes").then(
    (module) => module.HsnCodesWorkspace
  )
);
const ProductCategoriesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/products/product-categories").then(
    (module) => module.ProductCategoriesWorkspace
  )
);
const ProductGroupsWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/products/product-groups").then(
    (module) => module.ProductGroupsWorkspace
  )
);
const ProductTypesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/products/product-types").then(
    (module) => module.ProductTypesWorkspace
  )
);
const SizesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/products/sizes").then((module) => module.SizesWorkspace)
);
const StylesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/products/styles").then(
    (module) => module.StylesWorkspace
  )
);
const TaxesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/products/taxes").then((module) => module.TaxesWorkspace)
);
const UnitsWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/products/units").then((module) => module.UnitsWorkspace)
);
const DestinationsWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/workorder/destinations").then(
    (module) => module.DestinationsWorkspace
  )
);
const StockRejectionTypesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/workorder/stock-rejection-types").then(
    (module) => module.StockRejectionTypesWorkspace
  )
);
const TransportsWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/workorder/transports").then(
    (module) => module.TransportsWorkspace
  )
);
const WarehousesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/workorder/warehouses").then(
    (module) => module.WarehousesWorkspace
  )
);
const WorkOrderTypesWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/common/workorder/work-order-types").then(
    (module) => module.WorkOrderTypesWorkspace
  )
);
const ContactWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/master/contact").then((module) => module.ContactWorkspace)
);
const ProductWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/master/product").then((module) => module.ProductWorkspace)
);
const WorkOrderWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/master/work-order").then((module) => module.WorkOrderWorkspace)
);
const CompanyWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/organisation/company").then(
    (module) => module.CompanyWorkspace
  )
);
const DefaultCompanyWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/organisation/default-company").then(
    (module) => module.DefaultCompanyWorkspace
  )
);
const FinancialYearWorkspace = lazyWorkspace(() =>
  import("@codexsun/core-web/modules/organisation/financial-year").then(
    (module) => module.FinancialYearWorkspace
  )
);
const QuotationWorkspace = lazyWorkspace(() =>
  import("@codexsun/billing-web/modules/quotation").then((module) => module.QuotationWorkspace)
);
const SalesWorkspace = lazyWorkspace(() =>
  import("@codexsun/billing-web/modules/sales").then((module) => module.SalesWorkspace)
);
const BillingSettingsWorkspace = lazyWorkspace(() =>
  import("@codexsun/billing-web").then((module) => module.BillingSettingsWorkspace)
);
const DocumentSettingsWorkspace = lazyWorkspace(() =>
  import("@codexsun/billing-web").then((module) => module.DocumentSettingsWorkspace)
);
const PurchaseWorkspace = lazyWorkspace(() =>
  import("../../modules/purchase/purchase.workspace").then((module) => module.PurchaseWorkspace)
);
const ExportSalesWorkspace = lazyWorkspace(() =>
  import("../../modules/export-sales/export-sales.workspace").then(
    (module) => module.ExportSalesWorkspace
  )
);
const PaymentWorkspace = lazyWorkspace(() =>
  import("../../modules/payment/payment.workspace").then((module) => module.PaymentWorkspace)
);
const ReceiptWorkspace = lazyWorkspace(() =>
  import("../../modules/receipt/receipt.workspace").then((module) => module.ReceiptWorkspace)
);

const TenantUserWorkspace = lazy(() =>
  import("../../modules/tenant-user").then((module) => ({ default: module.TenantUserWorkspace }))
);
const TenantRoleWorkspace = lazy(() =>
  import("../../modules/tenant-role").then((module) => ({ default: module.TenantRoleWorkspace }))
);
const TenantPermissionWorkspace = lazy(() =>
  import("../../modules/tenant-permission").then((module) => ({
    default: module.TenantPermissionWorkspace
  }))
);
const TenantUserRoleWorkspace = lazy(() =>
  import("../../modules/tenant-user-role").then((module) => ({
    default: module.TenantUserRoleWorkspace
  }))
);
const TenantRolePermissionWorkspace = lazy(() =>
  import("../../modules/tenant-role-permission").then((module) => ({
    default: module.TenantRolePermissionWorkspace
  }))
);

type AppPage =
  | "application.overview"
  | "application.landing"
  | "application.profile"
  | "application.settings"
  | "application.access.users"
  | "application.access.roles"
  | "application.access.permissions"
  | "application.access.user-roles"
  | "application.access.role-permissions"
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
  | "core.common.location.countries"
  | "core.common.location.states"
  | "core.common.location.districts"
  | "core.common.location.cities"
  | "core.common.location.pincodes"
  | "core.organisation.company"
  | "core.organisation.financial-year"
  | "core.organisation.default-company"
  | "core.master.contact"
  | "core.master.product"
  | "core.master.work-order"
  | `core.common.${"accounts" | "contacts" | "others" | "products" | "workorder"}.${string}`;
const LANDING_APP_STORAGE_KEY = "codexsun.tenant.landing-app.live";
const COMPANY_CONTEXT_STORAGE_KEY = "codexsun.tenant.company-id";
const ACCOUNTING_YEAR_CONTEXT_STORAGE_KEY = "codexsun.tenant.financial-year-id";

export function AppDesk() {
  const queryClient = useQueryClient();
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
  const financialYearsQuery = useQuery({
    enabled: Boolean(runtimeQuery.data?.tenant?.uuid),
    queryFn: listFinancialYears,
    queryKey: ["core", "organisation", "financial-years", runtimeQuery.data?.tenant?.uuid]
  });
  const defaultCompanyQuery = useQuery({
    enabled: Boolean(runtimeQuery.data?.tenant?.uuid),
    queryFn: getDefaultCompany,
    queryKey: [...defaultCompanyQueryKey, runtimeQuery.data?.tenant?.uuid]
  });
  const [companyContextId, setCompanyContextId] = useState<number | null>(null);
  const [financialYearContextId, setFinancialYearContextId] = useState<number | null>(null);
  const runtime = runtimeQuery.data;
  const moduleKeys = runtime?.tenant?.enabledModuleKeys ?? ["platform.application"];
  const enabledApps = enabledAppIds(moduleKeys);
  const switchableApps = uniqueApps(enabledApps);
  const runtimeLandingApp =
    runtime?.defaultLandingApp ?? defaultLandingApp(runtime?.tenant?.defaultLandingApp, moduleKeys);
  const activeDefaultCompany =
    defaultCompanyQuery.data?.status === "active" ? defaultCompanyQuery.data : null;
  const persistedLandingApp = activeDefaultCompany?.landingApp as PlatformAppId | undefined;
  const landingApp =
    publishedLandingApp && enabledApps.includes(publishedLandingApp)
      ? publishedLandingApp
      : persistedLandingApp && enabledApps.includes(persistedLandingApp)
        ? persistedLandingApp
        : runtimeLandingApp;
  const activeApp = appFromPage(page, landingApp, switchableApps);
  const safePage =
    (page.startsWith("billing") ||
      (page.startsWith("core") && !page.startsWith("core.organisation"))) &&
    !switchableApps.includes("billing")
      ? pageForApp(landingApp)
      : page;
  const activeCompanies = useMemo(
    () => (companiesQuery.data ?? []).filter((company) => company.isActive),
    [companiesQuery.data]
  );
  const selectedCompany =
    activeCompanies.find((company) => company.id === activeDefaultCompany?.companyId) ??
    activeCompanies[0] ??
    null;
  const activeFinancialYears = useMemo(
    () => (financialYearsQuery.data ?? []).filter((year) => year.status === "active"),
    [financialYearsQuery.data]
  );
  const selectedFinancialYear =
    activeFinancialYears.find((year) => year.id === activeDefaultCompany?.financialYearId) ??
    activeFinancialYears.find((year) => year.isCurrent) ??
    activeFinancialYears[0] ??
    null;
  const billingSettingsQuery = useQuery({
    enabled: enabledApps.includes("billing") && Boolean(companyContextId),
    queryFn: async () => {
      const module = await import("@codexsun/billing-web");
      return module.getBillingSettings();
    },
    queryKey: ["billing", "settings", companyContextId]
  });
  const accountingYear = selectedFinancialYear?.name ?? "Accounting year";
  const defaultSelectionMutation = useMutation({
    mutationFn: saveDefaultCompany,
    onSuccess: async (record) => {
      publishCompanyContext(record.companyId);
      publishAccountingYear(record.financialYearId);
      await queryClient.invalidateQueries({ queryKey: defaultCompanyQueryKey });
    }
  });

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
    if (!selectedCompany) {
      setCompanyContextId(null);
      return;
    }
    publishCompanyContext(selectedCompany.id);
    setCompanyContextId(selectedCompany.id);
  }, [selectedCompany]);

  useEffect(() => {
    if (!selectedFinancialYear) {
      setFinancialYearContextId(null);
      return;
    }
    publishAccountingYear(selectedFinancialYear.id);
    setFinancialYearContextId(selectedFinancialYear.id);
  }, [selectedFinancialYear]);

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

  function updateGlobalDefault(companyId: number, financialYearId: number) {
    defaultSelectionMutation.mutate({
      companyId,
      financialYearId,
      landingApp,
      status: "active"
    });
  }

  const activeWorkspaceTitle =
    activeApp === "billing"
      ? "Billing"
      : activeApp === "task-manager"
        ? "Task Manager"
        : "Application";
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
            : "task-manager.overview"
      ),
    url:
      item.title === "Application"
        ? "/app/application/overview"
        : item.title === "Billing"
          ? "/app/billing/overview"
          : "/app/task-manager/overview"
  }));

  const contextError =
    !companiesQuery.isLoading && runtime?.tenant && !selectedCompany
      ? new Error("No active company is available for this tenant.")
      : !financialYearsQuery.isLoading && runtime?.tenant && !selectedFinancialYear
        ? new Error("No active financial year is available for this tenant.")
        : null;

  const bootstrapLoading =
    runtimeQuery.isLoading ||
    companiesQuery.isLoading ||
    financialYearsQuery.isLoading ||
    defaultCompanyQuery.isLoading ||
    (!companyContextId && !contextError) ||
    (!financialYearContextId && !contextError) ||
    (enabledApps.includes("billing") && billingSettingsQuery.isLoading);
  const bootstrapError =
    runtimeQuery.error ??
    companiesQuery.error ??
    financialYearsQuery.error ??
    defaultCompanyQuery.error ??
    billingSettingsQuery.error ??
    contextError;

  if (bootstrapLoading || bootstrapError) {
    return (
      <AuthGate desk="tenant">
        <TenantBootstrapScreen error={bootstrapError} />
      </AuthGate>
    );
  }

  return (
    <AuthGate desk="tenant">
      <ApplicationLayout
        brand={{
          href:
            activeApp === "billing"
              ? "/app/billing/overview"
              : activeApp === "task-manager"
                ? "/app/task-manager/overview"
                : "/app/application/overview",
          options: activeCompanies.map((company) => ({
            id: String(company.id),
            subtitle: accountingYear,
            title: company.name
          })),
          optionsLabel: "Company",
          onOptionSelect: (id) => {
            if (!selectedFinancialYear) return;
            updateGlobalDefault(Number(id), selectedFinancialYear.id);
          },
          onSecondaryOptionSelect: (id) => {
            if (!selectedCompany) return;
            updateGlobalDefault(selectedCompany.id, Number(id));
          },
          ...(selectedCompany ? { selectedOptionId: String(selectedCompany.id) } : {}),
          ...(selectedFinancialYear
            ? { selectedSecondaryOptionId: String(selectedFinancialYear.id) }
            : {}),
          secondaryOptions: activeFinancialYears.map((year) => ({
            id: String(year.id),
            title: year.name
          })),
          secondaryOptionsLabel: "Financial year",
          subtitle: selectedFinancialYear
            ? selectedFinancialYear.name
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
          {safePage === "application.access.users" ? <TenantUserWorkspace /> : null}
          {safePage === "application.access.roles" ? <TenantRoleWorkspace /> : null}
          {safePage === "application.access.permissions" ? <TenantPermissionWorkspace /> : null}
          {safePage === "application.access.user-roles" ? <TenantUserRoleWorkspace /> : null}
          {safePage === "application.access.role-permissions" ? (
            <TenantRolePermissionWorkspace />
          ) : null}
          {safePage === "billing.overview" ? <BillingOverview /> : null}
          {safePage === "billing.quotation" ? <QuotationWorkspace /> : null}
          {safePage === "billing.sales" ? <BillingSales /> : null}
          {safePage === "billing.purchase" ? <PurchaseWorkspace /> : null}
          {safePage === "billing.export-sales" ? <ExportSalesWorkspace /> : null}
          {safePage === "billing.payment" ? <PaymentWorkspace /> : null}
          {safePage === "billing.receipt" ? <ReceiptWorkspace /> : null}
          {safePage === "billing.settings" ? <BillingSettingsWorkspace /> : null}
          {safePage === "billing.document-settings" ? <DocumentSettingsWorkspace /> : null}
          {safePage === "core.organisation.company" ? <CompanyWorkspace /> : null}
          {safePage === "core.organisation.financial-year" ? <FinancialYearWorkspace /> : null}
          {safePage === "core.organisation.default-company" ? (
            <DefaultCompanyWorkspace
              landingApps={landingAppOptions(switchableApps)}
              onSaved={() => {
                void defaultCompanyQuery.refetch();
                void financialYearsQuery.refetch();
              }}
            />
          ) : null}
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

function TenantBootstrapScreen({ error }: { error: unknown }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-6 shadow-sm">
        <div className="text-base font-semibold">
          {error ? "Application setup could not be loaded" : "Preparing your workspace"}
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Loading enabled apps, Default Company, financial year, and company settings..."}
        </p>
      </div>
    </main>
  );
}

function publishCompanyContext(id: number) {
  window.localStorage.setItem(COMPANY_CONTEXT_STORAGE_KEY, String(id));
  window.dispatchEvent(new CustomEvent("codexsun:company-change", { detail: { id } }));
}
function publishAccountingYear(id: number) {
  window.localStorage.setItem(ACCOUNTING_YEAR_CONTEXT_STORAGE_KEY, String(id));
  window.dispatchEvent(new CustomEvent("codexsun:accounting-year-change", { detail: { id } }));
}

function landingAppOptions(apps: PlatformAppId[]): LandingAppOption[] {
  return apps.map((app) => ({
    label:
      app === "application"
        ? "Application"
        : app.replaceAll("-", " ").replace(/^./, (c) => c.toUpperCase()),
    value: app
  }));
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
    key === "application.access.users" ||
    key === "application.access.roles" ||
    key === "application.access.permissions" ||
    key === "application.access.user-roles" ||
    key === "application.access.role-permissions" ||
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
    key === "core.common.location.countries" ||
    key === "core.common.location.states" ||
    key === "core.common.location.districts" ||
    key === "core.common.location.cities" ||
    key === "core.common.location.pincodes" ||
    key === "core.organisation.company" ||
    key === "core.organisation.financial-year" ||
    key === "core.organisation.default-company" ||
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
        : "Shared workspace, company setup, roles, and cross-app launch desk.",
    icon:
      appId === "billing"
        ? CreditCardIcon
        : appId === "task-manager"
          ? ListChecksIcon
          : LayoutDashboardIcon,
    iconClass:
      appId === "billing"
        ? "bg-emerald-600 text-white"
        : appId === "task-manager"
          ? "bg-violet-600 text-white"
          : "bg-slate-950 text-white",
    id: appId,
    label:
      appId === "billing" ? "Billing" : appId === "task-manager" ? "Task Manager" : "Application"
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

function renderOwnedLocationPage(page: AppPage) {
  if (page === "core.common.location.countries") return <CountryWorkspace />;
  if (page === "core.common.location.states") return <StateWorkspace />;
  if (page === "core.common.location.districts") return <DistrictWorkspace />;
  if (page === "core.common.location.cities") return <CityWorkspace />;
  if (page === "core.common.location.pincodes") return <PincodeWorkspace />;
  return null;
}

function renderOwnedCommonMasterPage(page: AppPage) {
  if (page === "core.common.accounts.ledger-groups") return <LedgerGroupsWorkspace />;
  if (page === "core.common.accounts.ledgers") return <LedgersWorkspace />;
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
    "application.access.users": "Users",
    "application.access.roles": "Roles",
    "application.access.permissions": "Permissions",
    "application.access.user-roles": "User Roles",
    "application.access.role-permissions": "Role Permissions",
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
    "core.common.location.cities": "Cities",
    "core.common.location.countries": "Countries",
    "core.common.location.districts": "Districts",
    "core.common.location.pincodes": "Pincodes",
    "core.common.location.states": "States",
    "core.common.contacts.address-types": "Address Types",
    "core.common.contacts.bank-names": "Bank Names",
    "core.common.contacts.contact-groups": "Contact Groups",
    "core.common.contacts.contact-types": "Contact Types",
    "core.common.accounts.ledger-groups": "Ledger Groups",
    "core.common.accounts.ledgers": "Ledgers",
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
    "core.organisation.financial-year": "Financial Years",
    "core.organisation.default-company": "Default Company",
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
  "core.common.accounts.ledger-groups",
  "core.common.accounts.ledgers",
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
  if (page.startsWith("task-manager"))
    return enabledApps.includes("task-manager") ? "task-manager" : landingApp;
  return "application";
}

function pageForApp(app: PlatformAppId): AppPage {
  if (app === "task-manager") return "task-manager.overview";
  return app === "billing" ? "billing.overview" : "application.overview";
}

function isAppRootPath() {
  return window.location.pathname === "/app" || window.location.pathname === "/app/";
}

function readPublishedLandingApp(): PlatformAppId | null {
  try {
    const stored = window.localStorage.getItem(LANDING_APP_STORAGE_KEY);
    return stored === "application" || stored === "billing" || stored === "task-manager"
      ? stored
      : null;
  } catch {
    return null;
  }
}
