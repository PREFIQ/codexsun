import { useState } from "react";
import {
  AppWindowIcon,
  Building2Icon,
  CircleGaugeIcon,
  CreditCardIcon,
  DatabaseIcon,
  ListChecksIcon,
  PaletteIcon,
  ClipboardListIcon,
  ShieldCheckIcon
} from "lucide-react";
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
import { TaskManagerWorkspace } from "../../modules/task-manager/task-manager.workspace";
import {
  AppOperationsStrip,
  AppOrchestrationWorkspace,
  useAppOperationsQuery,
  type OrchestratedAppId
} from "../../modules/app-orchestration";
import { AuthGate } from "../../shared/auth/AuthGate";

type SaPage =
  | "overview"
  | "app-operations"
  | "task-manager"
  | "tenants"
  | "domains"
  | "plans"
  | "plan-access"
  | "subscriptions"
  | "apps"
  | "entitlements"
  | "tenant-access"
  | "industries"
  | "master-database"
  | "tenant-database"
  | "queue-management"
  | "storage-manager"
  | "platform-registry"
  | "work-automation"
  | "workflow"
  | "access"
  | "activity"
  | "design-system";

export function SaDesk() {
  const [page, setPage] = useState<SaPage>(pageFromUrl());
  const [selectedAppId, setSelectedAppId] = useState<OrchestratedAppId>(() => appIdFromUrl());

  function selectPage(nextPage: SaPage) {
    setPage(nextPage);
    window.history.pushState(
      { page: nextPage },
      "",
      nextPage === "overview" ? "/sa" : `/sa/${nextPage}`
    );
  }

  function openAppOperations(appId: OrchestratedAppId) {
    setSelectedAppId(appId);
    setPage("app-operations");
    window.history.pushState(
      { page: "app-operations", appId },
      "",
      `/sa/app-operations?app=${appId}`
    );
  }

  const menuItems: SidemenuItem[] = [
    {
      title: "Overview",
      icon: CircleGaugeIcon,
      isActive: page === "overview",
      onSelect: () => selectPage("overview")
    },
    {
      title: "Task Manager",
      icon: ListChecksIcon,
      isActive: page === "task-manager",
      onSelect: () => selectPage("task-manager")
    },
    {
      title: "Project Manager",
      icon: ClipboardListIcon,
      isActive: page === "platform-registry" || page === "work-automation" || page === "workflow",
      items: [
        {
          title: "Platform Registry",
          isActive: page === "platform-registry",
          onSelect: () => selectPage("platform-registry")
        },
        {
          title: "Work Automation",
          isActive: page === "work-automation",
          onSelect: () => selectPage("work-automation")
        },
        { title: "Workflow", isActive: page === "workflow", onSelect: () => selectPage("workflow") }
      ]
    },
    {
      title: "Tenant Setup",
      icon: Building2Icon,
      isActive: page === "tenants" || page === "domains" || page === "tenant-access",
      items: [
        { title: "Tenants", isActive: page === "tenants", onSelect: () => selectPage("tenants") },
        { title: "Domains", isActive: page === "domains", onSelect: () => selectPage("domains") },
        {
          title: "Tenant Access",
          isActive: page === "tenant-access",
          onSelect: () => selectPage("tenant-access")
        }
      ]
    },
    {
      title: "Commercial",
      icon: CreditCardIcon,
      isActive: page === "plans" || page === "plan-access" || page === "subscriptions",
      items: [
        { title: "Plans", isActive: page === "plans", onSelect: () => selectPage("plans") },
        {
          title: "Plan Access",
          isActive: page === "plan-access",
          onSelect: () => selectPage("plan-access")
        },
        {
          title: "Subscriptions",
          isActive: page === "subscriptions",
          onSelect: () => selectPage("subscriptions")
        }
      ]
    },
    {
      title: "Catalog",
      icon: AppWindowIcon,
      isActive: page === "apps" || page === "industries",
      items: [
        { title: "Apps", isActive: page === "apps", onSelect: () => selectPage("apps") },
        {
          title: "Industries",
          isActive: page === "industries",
          onSelect: () => selectPage("industries")
        }
      ]
    },
    {
      title: "Governance",
      icon: ShieldCheckIcon,
      isActive: page === "entitlements" || page === "access" || page === "activity",
      items: [
        {
          title: "Entitlements",
          isActive: page === "entitlements",
          onSelect: () => selectPage("entitlements")
        },
        {
          title: "Access Control",
          isActive: page === "access",
          onSelect: () => selectPage("access")
        },
        { title: "Activity", isActive: page === "activity", onSelect: () => selectPage("activity") }
      ]
    },
    {
      title: "Database",
      icon: DatabaseIcon,
      isActive:
        page === "master-database" ||
        page === "tenant-database" ||
        page === "queue-management" ||
        page === "storage-manager",
      items: [
        {
          title: "Master Database",
          isActive: page === "master-database",
          onSelect: () => selectPage("master-database")
        },
        {
          title: "Tenant Databases",
          isActive: page === "tenant-database",
          onSelect: () => selectPage("tenant-database")
        },
        {
          title: "Queue Management",
          isActive: page === "queue-management",
          onSelect: () => selectPage("queue-management")
        },
        {
          title: "Storage Manager",
          isActive: page === "storage-manager",
          onSelect: () => selectPage("storage-manager")
        }
      ]
    },
    {
      title: "Design System",
      icon: PaletteIcon,
      isActive: page === "design-system",
      items: [
        {
          title: "Components",
          isActive: page === "design-system",
          onSelect: () => selectPage("design-system")
        }
      ]
    }
  ];

  return (
    <AuthGate desk="sa">
      <SuperLayout
        menuItems={menuItems}
        versionLabel={`v ${__APP_VERSION__}`}
        workspace={page === "task-manager" ? "task-manager" : "platform"}
      >
        {page === "overview" ? <SaOverview onOpenApp={openAppOperations} /> : null}
        {page === "app-operations" ? (
          <AppOrchestrationWorkspace appId={selectedAppId} onBack={() => selectPage("overview")} />
        ) : null}
        {page === "task-manager" ? <TaskManagerWorkspace /> : null}
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
        {page === "workflow" ? <WorkAutomationWorkspace initialView="timeline" /> : null}
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
  return page === "app-operations" ||
    page === "task-manager" ||
    page === "tenants" ||
    page === "domains" ||
    page === "plans" ||
    page === "plan-access" ||
    page === "subscriptions" ||
    page === "apps" ||
    page === "entitlements" ||
    page === "tenant-access" ||
    page === "industries" ||
    page === "master-database" ||
    page === "tenant-database" ||
    page === "queue-management" ||
    page === "storage-manager" ||
    page === "platform-registry" ||
    page === "work-automation" ||
    page === "workflow" ||
    page === "access" ||
    page === "activity" ||
    page === "design-system"
    ? page
    : "overview";
}

function appIdFromUrl(): OrchestratedAppId {
  const value = new URLSearchParams(window.location.search).get("app");
  return value === "core" ||
    value === "billing" ||
    value === "accounts" ||
    value === "data-bridge" ||
    value === "kitchen-serve"
    ? value
    : "platform";
}

function SaOverview({ onOpenApp }: { onOpenApp: (appId: OrchestratedAppId) => void }) {
  const apps = useAppOperationsQuery();
  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-4 py-5 lg:w-[calc(100%-3rem)]">
      <section className="rounded-md border bg-card px-5 py-4 shadow-sm">
        <p className="text-sm font-semibold uppercase text-muted-foreground">
          Repository Operations
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Apps</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live service state and maintenance access for every runnable app in this repository.
        </p>
      </section>
      {apps.error ? (
        <section className="rounded-md border border-destructive/40 bg-card p-4 text-sm text-destructive">
          {apps.error.message}
        </section>
      ) : null}
      <AppOperationsStrip apps={apps.data ?? []} onSelect={onOpenApp} />
    </main>
  );
}
