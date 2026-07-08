import { useState } from "react";
import { Building2Icon, Settings2Icon } from "lucide-react";
import { ApplicationLayout, Button, Card, StatusBadge } from "@codexsun/ui";
import type { SidemenuItem } from "@codexsun/ui/blocks/menu/sidemenu/sub/sidemenu-section";
import { AuthGate } from "../../shared/auth/AuthGate";

type AppPage = "overview" | "tenant" | "settings";

export function AppDesk() {
  const [page, setPage] = useState<AppPage>(pageFromUrl());

  function selectPage(nextPage: AppPage) {
    setPage(nextPage);
    window.history.pushState({ page: nextPage }, "", nextPage === "overview" ? "/app" : `/app/${nextPage}`);
  }

  const menuItems: SidemenuItem[] = [
    {
      title: "Tenant",
      icon: Building2Icon,
      isActive: true,
      items: [
        { title: "Overview", isActive: page === "overview", onSelect: () => selectPage("overview") },
        { title: "Tenant Profile", isActive: page === "tenant", onSelect: () => selectPage("tenant") },
        { title: "Settings", isActive: page === "settings", onSelect: () => selectPage("settings") }
      ]
    }
  ];

  return (
    <AuthGate desk="tenant">
      <ApplicationLayout
        brand={{ href: "/app", subtitle: "tenant workspace", title: "Tenant Workspace" }}
        headerTitle={page === "overview" ? "Tenant Overview" : page === "tenant" ? "Tenant Profile" : "Tenant Settings"}
        menuItems={menuItems}
        workspaceItems={[
          { title: "Tenant", description: "Profile, database context, and settings.", icon: Building2Icon, active: true, url: "/app" },
          { title: "Settings", description: "Tenant scoped runtime settings.", icon: Settings2Icon, url: "/app/settings" }
        ]}
      >
        <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-5 lg:w-[calc(100%-3rem)]">
          {page === "overview" ? <TenantOverview onNavigate={selectPage} /> : null}
          {page === "tenant" ? <TenantProfile /> : null}
          {page === "settings" ? <TenantSettings /> : null}
        </main>
      </ApplicationLayout>
    </AuthGate>
  );
}

function pageFromUrl(): AppPage {
  const page = window.location.pathname.split("/")[2];
  return page === "tenant" || page === "settings" ? page : "overview";
}

function TenantOverview({ onNavigate }: { onNavigate: (page: AppPage) => void }) {
  return (
    <>
      <section className="rounded-md border bg-card p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-muted-foreground">Tenant Workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Tenant Workspace</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Tenant context, settings, and enabled application modules appear here after tenant selection.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Tenant Context" description="No tenant profile is loaded in this browser session.">
          <StatusBadge tone="amber">Not selected</StatusBadge>
        </Card>
        <Card title="Tenant Profile" description="Open the tenant-dedicated profile page.">
          <Button className="mt-1" onClick={() => onNavigate("tenant")}>
            Open
          </Button>
        </Card>
      </div>
    </>
  );
}

function TenantProfile() {
  return (
    <Card title="Tenant Profile" description="Tenant identity will be shown after a tenant is selected.">
      <p className="text-sm text-muted-foreground">No tenant profile is available for the current session.</p>
    </Card>
  );
}

function TenantSettings() {
  return (
    <Card title="Tenant Settings" description="Tenant-scoped settings will be shown after a tenant is selected.">
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="amber">Not selected</StatusBadge>
      </div>
    </Card>
  );
}
