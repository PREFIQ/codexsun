import { useState } from "react";
import {
  AppWindowIcon,
  BoxesIcon,
  Building2Icon,
  CircleGaugeIcon,
  CreditCardIcon,
  DatabaseIcon,
  HardDriveIcon,
  KeyRoundIcon,
  ListChecksIcon,
  PaletteIcon,
  ClipboardListIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  TagsIcon,
  WorkflowIcon
} from "lucide-react";
import { StatusBadge } from "@codexsun/ui";
import { SuperLayout } from "@codexsun/ui/layouts/super-layout";
import type { SidemenuItem } from "@codexsun/ui/blocks/menu/sidemenu/sub/sidemenu-section";
import { DesignSystemGallery } from "../../modules/design-system";
import { TenantList } from "../../modules/tenant";
import { TenantDomainList } from "../../modules/tenant-domain";
import { PlanWorkspace } from "../../modules/plan";
import { SubscriptionWorkspace } from "../../modules/subscription";
import { AppRegistryWorkspace } from "../../modules/app-registry";
import { IndustryWorkspace } from "../../modules/industry";
import { EntitlementWorkspace } from "../../modules/entitlement";
import { PlanAccessWorkspace } from "../../modules/plan-access";
import { TenantAccessWorkspace } from "../../modules/tenant-access";
import { AccessControlWorkspace } from "../../modules/access-control";
import { PlatformActivityWorkspace } from "../../modules/platform-activity";
import { MasterDatabaseWorkspace } from "../../modules/master-database";
import { TenantDatabaseWorkspace } from "../../modules/tenant-database";
import { QueueManagementWorkspace } from "../../modules/queue-management";
import { StorageManagerWorkspace } from "../../modules/storage-manager";
import { PlatformRegistryWorkspace } from "../../modules/platform-registry";
import { WorkAutomationWorkspace } from "../../modules/work-automation";
import { useTenantsQuery } from "../../modules/tenant";
import { usePlansQuery } from "../../modules/plan";
import { useSubscriptionsQuery } from "../../modules/subscription";
import { usePlatformAppsQuery } from "../../modules/app-registry";
import { useTenantAccessQuery } from "../../modules/tenant-access";
import { usePlatformActivityQuery } from "../../modules/platform-activity";
import { useQueueRuntimeQuery } from "../../modules/queue-management";
import { AuthGate } from "../../shared/auth/AuthGate";

type SaPage = "overview" | "tenants" | "domains" | "plans" | "plan-access" | "subscriptions" | "apps" | "entitlements" | "tenant-access" | "industries" | "master-database" | "tenant-database" | "queue-management" | "storage-manager" | "platform-registry" | "work-automation" | "access" | "activity" | "design-system";

export function SaDesk() {
  const [page, setPage] = useState<SaPage>(pageFromUrl());

  function selectPage(nextPage: SaPage) {
    setPage(nextPage);
    window.history.pushState({ page: nextPage }, "", nextPage === "overview" ? "/sa" : `/sa/${nextPage}`);
  }

  const menuItems: SidemenuItem[] = [
    { title: "Overview", icon: CircleGaugeIcon, isActive: page === "overview", onSelect: () => selectPage("overview") },
    {
      title: "Project Manager",
      icon: ClipboardListIcon,
      isActive: page === "platform-registry" || page === "work-automation",
      items: [
        { title: "Platform Registry", isActive: page === "platform-registry", onSelect: () => selectPage("platform-registry") },
        { title: "Work Automation", isActive: page === "work-automation", onSelect: () => selectPage("work-automation") }
      ]
    },
    {
      title: "Tenant Setup",
      icon: Building2Icon,
      isActive: page === "tenants" || page === "domains" || page === "tenant-access",
      items: [
        { title: "Tenants", isActive: page === "tenants", onSelect: () => selectPage("tenants") },
        { title: "Domains", isActive: page === "domains", onSelect: () => selectPage("domains") },
        { title: "Tenant Access", isActive: page === "tenant-access", onSelect: () => selectPage("tenant-access") }
      ]
    },
    {
      title: "Commercial",
      icon: CreditCardIcon,
      isActive: page === "plans" || page === "plan-access" || page === "subscriptions",
      items: [
        { title: "Plans", isActive: page === "plans", onSelect: () => selectPage("plans") },
        { title: "Plan Access", isActive: page === "plan-access", onSelect: () => selectPage("plan-access") },
        { title: "Subscriptions", isActive: page === "subscriptions", onSelect: () => selectPage("subscriptions") }
      ]
    },
    {
      title: "Catalog",
      icon: AppWindowIcon,
      isActive: page === "apps" || page === "industries",
      items: [
        { title: "Apps", isActive: page === "apps", onSelect: () => selectPage("apps") },
        { title: "Industries", isActive: page === "industries", onSelect: () => selectPage("industries") }
      ]
    },
    {
      title: "Governance",
      icon: ShieldCheckIcon,
      isActive: page === "entitlements" || page === "access" || page === "activity",
      items: [
        { title: "Entitlements", isActive: page === "entitlements", onSelect: () => selectPage("entitlements") },
        { title: "Access Control", isActive: page === "access", onSelect: () => selectPage("access") },
        { title: "Activity", isActive: page === "activity", onSelect: () => selectPage("activity") }
      ]
    },
    {
      title: "Database",
      icon: DatabaseIcon,
      isActive: page === "master-database" || page === "tenant-database" || page === "queue-management" || page === "storage-manager",
      items: [
        { title: "Master Database", isActive: page === "master-database", onSelect: () => selectPage("master-database") },
        { title: "Tenant Databases", isActive: page === "tenant-database", onSelect: () => selectPage("tenant-database") },
        { title: "Queue Management", isActive: page === "queue-management", onSelect: () => selectPage("queue-management") },
        { title: "Storage Manager", isActive: page === "storage-manager", onSelect: () => selectPage("storage-manager") }
      ]
    },
    {
      title: "Design System",
      icon: PaletteIcon,
      isActive: page === "design-system",
      items: [{ title: "Components", isActive: page === "design-system", onSelect: () => selectPage("design-system") }]
    }
  ];

  return (
    <AuthGate desk="sa">
      <SuperLayout menuItems={menuItems} versionLabel={`v ${__APP_VERSION__}`}>
        {page === "overview" ? <SaOverview onNavigate={selectPage} /> : null}
        {page === "tenants" ? <TenantList onBack={() => selectPage("overview")} /> : null}
        {page === "domains" ? <TenantDomainList /> : null}
        {page === "plans" ? <PlanWorkspace /> : null}
        {page === "plan-access" ? <PlanAccessWorkspace /> : null}
        {page === "subscriptions" ? <SubscriptionWorkspace /> : null}
        {page === "apps" ? <AppRegistryWorkspace /> : null}
        {page === "entitlements" ? <EntitlementWorkspace /> : null}
        {page === "tenant-access" ? <TenantAccessWorkspace /> : null}
        {page === "industries" ? <IndustryWorkspace /> : null}
        {page === "master-database" ? <MasterDatabaseWorkspace /> : null}
        {page === "tenant-database" ? <TenantDatabaseWorkspace /> : null}
        {page === "queue-management" ? <QueueManagementWorkspace /> : null}
        {page === "storage-manager" ? <StorageManagerWorkspace /> : null}
        {page === "platform-registry" ? <PlatformRegistryWorkspace /> : null}
        {page === "work-automation" ? <WorkAutomationWorkspace /> : null}
        {page === "access" ? <AccessControlWorkspace /> : null}
        {page === "activity" ? <PlatformActivityWorkspace /> : null}
        {page === "design-system" ? <DesignSystemGallery /> : null}
      </SuperLayout>
    </AuthGate>
  );
}

function pageFromUrl(): SaPage {
  const page = window.location.pathname.split("/")[2];
  if (page === "project-manager") return "platform-registry";
  return page === "tenants" || page === "domains" || page === "plans" || page === "plan-access" || page === "subscriptions" || page === "apps" || page === "entitlements" || page === "tenant-access" || page === "industries" || page === "master-database" || page === "tenant-database" || page === "queue-management" || page === "storage-manager" || page === "platform-registry" || page === "work-automation" || page === "access" || page === "activity" || page === "design-system" ? page : "overview";
}

function SaOverview({ onNavigate }: { onNavigate: (page: SaPage) => void }) {
  const tenants = useTenantsQuery();
  const plans = usePlansQuery();
  const subscriptions = useSubscriptionsQuery();
  const apps = usePlatformAppsQuery();
  const tenantAccess = useTenantAccessQuery();
  const activity = usePlatformActivityQuery();
  const queue = useQueueRuntimeQuery();
  const activeTenantAccess = (tenantAccess.data ?? []).filter((item) => item.enabledModuleKeys.length > 0).length;

  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-5 lg:w-[calc(100%-3rem)]">
      <section className="rounded-md border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">Super Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">Platform Dashboard</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              Tenant setup, plans, access, subscriptions, governance, and recent platform activity.
            </p>
          </div>
          <StatusBadge tone="green">Ready</StatusBadge>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        <DeskCard title="Tenants" value={String(tenants.data?.length ?? 0)} icon={Building2Icon} onClick={() => onNavigate("tenants")} />
        <DeskCard title="Active access" value={String(activeTenantAccess)} icon={ListChecksIcon} onClick={() => onNavigate("tenant-access")} />
        <DeskCard title="Plans" value={String(plans.data?.length ?? 0)} icon={TagsIcon} onClick={() => onNavigate("plan-access")} />
        <DeskCard title="Subscriptions" value={String(subscriptions.data?.length ?? 0)} icon={ReceiptTextIcon} onClick={() => onNavigate("subscriptions")} />
        <DeskCard title="Apps" value={String(apps.data?.length ?? 0)} icon={AppWindowIcon} onClick={() => onNavigate("apps")} />
        <DeskCard title="Activity" value={String(activity.data?.length ?? 0)} icon={KeyRoundIcon} onClick={() => onNavigate("activity")} />
        <DeskCard title="Database" value="2" icon={DatabaseIcon} onClick={() => onNavigate("master-database")} />
        <DeskCard title="Queue Jobs" value={String((queue.data?.pending ?? 0) + (queue.data?.running ?? 0))} icon={WorkflowIcon} onClick={() => onNavigate("queue-management")} />
        <DeskCard title="Storage" value="files" icon={HardDriveIcon} onClick={() => onNavigate("storage-manager")} />
        <DeskCard title="Platform Registry" value="tree" icon={BoxesIcon} onClick={() => onNavigate("platform-registry")} />
        <DeskCard title="Work Automation" value="flow" icon={ClipboardListIcon} onClick={() => onNavigate("work-automation")} />
      </div>
      <section className="rounded-md border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-normal">Recent Activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">Latest platform changes from plan access, subscriptions, entitlements, and access control.</p>
          </div>
          <button type="button" className="rounded-md border px-3 py-2 text-sm hover:bg-muted/40" onClick={() => onNavigate("activity")}>Open activity</button>
        </div>
        <div className="mt-4 divide-y rounded-md border">
          {(activity.data ?? []).slice(0, 5).map((item) => (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm" key={item.uuid}>
              <div>
                <div className="font-medium">{item.action}</div>
                <div className="text-muted-foreground">{item.recordLabel}</div>
              </div>
              <StatusBadge tone="blue">{item.moduleKey}</StatusBadge>
            </div>
          ))}
          {(activity.data ?? []).length === 0 ? <div className="px-4 py-6 text-sm text-muted-foreground">No activity found.</div> : null}
        </div>
      </section>
    </main>
  );
}

function DeskCard({ icon: Icon, onClick, title, value }: { icon: typeof CircleGaugeIcon; onClick: () => void; title: string; value: string }) {
  return (
    <button type="button" onClick={onClick} className="rounded-md border bg-card p-5 text-left shadow-sm hover:bg-muted/30">
      <Icon className="size-5 text-muted-foreground" />
      <div className="mt-5 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{title}</div>
    </button>
  );
}

