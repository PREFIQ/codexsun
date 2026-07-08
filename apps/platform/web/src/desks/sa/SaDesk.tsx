import { useState } from "react";
import { Building2Icon, CircleGaugeIcon, DatabaseIcon, ShieldCheckIcon, UsersRoundIcon } from "lucide-react";
import { Card, StatusBadge } from "@codexsun/ui";
import { SuperLayout } from "@codexsun/ui/layouts/super-layout";
import type { SidemenuItem } from "@codexsun/ui/blocks/menu/sidemenu/sub/sidemenu-section";
import { TenantList } from "../../modules/tenant";
import { AuthGate } from "../../shared/auth/AuthGate";

type SaPage = "overview" | "tenants" | "database" | "access";

export function SaDesk() {
  const [page, setPage] = useState<SaPage>(pageFromUrl());

  function selectPage(nextPage: SaPage) {
    setPage(nextPage);
    window.history.pushState({ page: nextPage }, "", nextPage === "overview" ? "/sa" : `/sa/${nextPage}`);
  }

  const menuItems: SidemenuItem[] = [
    {
      title: "Platform",
      icon: ShieldCheckIcon,
      isActive: page === "overview",
      onSelect: () => selectPage("overview"),
      items: [
        { title: "Overview", isActive: page === "overview", onSelect: () => selectPage("overview") },
        { title: "Tenants", isActive: page === "tenants", onSelect: () => selectPage("tenants") },
        { title: "Database", isActive: page === "database", onSelect: () => selectPage("database") },
        { title: "Access", isActive: page === "access", onSelect: () => selectPage("access") }
      ]
    }
  ];

  return (
    <AuthGate desk="sa">
      <SuperLayout menuItems={menuItems} versionLabel={`v ${__APP_VERSION__}`}>
        {page === "overview" ? <SaOverview onNavigate={selectPage} /> : null}
        {page === "tenants" ? <TenantList onBack={() => selectPage("overview")} /> : null}
        {page === "database" ? <FoundationPanel title="Database Foundation" badge="Configured" icon={DatabaseIcon} /> : null}
        {page === "access" ? <FoundationPanel title="Access Foundation" badge="Configured" icon={UsersRoundIcon} /> : null}
      </SuperLayout>
    </AuthGate>
  );
}

function pageFromUrl(): SaPage {
  const page = window.location.pathname.split("/")[2];
  return page === "tenants" || page === "database" || page === "access" ? page : "overview";
}

function SaOverview({ onNavigate }: { onNavigate: (page: SaPage) => void }) {
  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-5 lg:w-[calc(100%-3rem)]">
      <section className="rounded-md border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">Super Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">Platform Foundation</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              Tenant registry, database context, access boundaries, and activation controls start here.
            </p>
          </div>
          <StatusBadge tone="green">Ready</StatusBadge>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        <DeskCard title="Tenants" value="Manage" icon={Building2Icon} onClick={() => onNavigate("tenants")} />
        <DeskCard title="Database Context" value="Root dist" icon={DatabaseIcon} onClick={() => onNavigate("database")} />
        <DeskCard title="Access" value="SA/Admin/App" icon={ShieldCheckIcon} onClick={() => onNavigate("access")} />
      </div>
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

function FoundationPanel({ badge, icon: Icon, title }: { badge: string; icon: typeof CircleGaugeIcon; title: string }) {
  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] py-5 lg:w-[calc(100%-3rem)]">
      <Card title={title} description="Platform foundation area.">
        <div className="flex items-center gap-3">
          <Icon className="size-5 text-muted-foreground" />
          <StatusBadge tone="green">{badge}</StatusBadge>
        </div>
      </Card>
    </main>
  );
}
