import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button, SuperLayout } from "@codexsun/ui";
import { AuthGate } from "../components/AuthGate";
import { logout } from "../api";
import { ConsoleHome } from "./sa/ConsoleHome";
import { TenantList } from "./sa/TenantList";
import { ModuleActivation } from "./sa/ModuleActivation";
import { AuditViewer } from "./sa/AuditViewer";
import { MigrationStatus } from "./sa/MigrationStatus";
import { HealthView } from "./sa/HealthView";
import { UserList } from "./sa/UserList";
import { RoleList } from "./sa/RoleList";
import { PermissionMatrix } from "./sa/PermissionMatrix";
import { SessionList } from "./sa/SessionList";
import { PlatformSettings } from "./sa/PlatformSettings";
import { FeatureFlags } from "./sa/FeatureFlags";
import { WorkbenchPage } from "./sa/WorkbenchPage";

type SaPage = "home" | "tenants" | "modules" | "audit" | "migrations" | "health" | "users" | "roles" | "permissions" | "sessions" | "settings" | "features" | "workbench";

export function SaDesk() {
  const navigate = useNavigate();
  const [page, setPage] = useState<SaPage>("home");

  async function handleLogout() {
    await logout("sa");
    await navigate({ to: "/sa/login" });
  }

  const navItems: Array<{ page: SaPage; label: string }> = [
    { page: "home", label: "Console" },
    { page: "tenants", label: "Tenants" },
    { page: "modules", label: "Modules" },
    { page: "audit", label: "Audit" },
    { page: "migrations", label: "Migrations" },
    { page: "health", label: "Health" },
    { page: "settings", label: "Settings" },
    { page: "features", label: "Features" },
    { page: "users", label: "Users" },
    { page: "roles", label: "Roles" },
    { page: "permissions", label: "Permissions" },
    { page: "sessions", label: "Sessions" },
    { page: "workbench", label: "Workbench" },
  ];

  return (
    <AuthGate desk="sa">
      <SuperLayout
        actions={
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem" }}>
            {navItems.map((item) => (
              <Button
                key={item.page}
                onClick={() => setPage(item.page)}
                variant={page === item.page ? "default" : "ghost"}
                size="sm"
              >
                {item.label}
              </Button>
            ))}
            <Button onClick={handleLogout} variant="secondary" size="sm">Log out</Button>
          </div>
        }
      >
        {page === "home" && <ConsoleHome onNavigate={(p) => setPage(p as SaPage)} />}
        {page === "tenants" && <TenantList onBack={() => setPage("home")} />}
        {page === "modules" && <ModuleActivation onBack={() => setPage("home")} />}
        {page === "audit" && <AuditViewer onBack={() => setPage("home")} />}
        {page === "migrations" && <MigrationStatus onBack={() => setPage("home")} />}
        {page === "health" && <HealthView onBack={() => setPage("home")} />}
        {page === "users" && <UserList onBack={() => setPage("home")} />}
        {page === "roles" && <RoleList onBack={() => setPage("home")} />}
        {page === "permissions" && <PermissionMatrix onBack={() => setPage("home")} />}
        {page === "sessions" && <SessionList onBack={() => setPage("home")} />}
        {page === "settings" && <PlatformSettings onBack={() => setPage("home")} />}
        {page === "features" && <FeatureFlags onBack={() => setPage("home")} />}
        {page === "workbench" && <WorkbenchPage onBack={() => setPage("home")} />}
      </SuperLayout>
    </AuthGate>
  );
}
