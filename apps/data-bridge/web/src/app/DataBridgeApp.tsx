import { AppLayout } from "@codexsun/ui";
import { useState } from "react";
import { DatabaseZapIcon, LayoutDashboardIcon, ScanSearchIcon, ShieldCheckIcon, WorkflowIcon } from "lucide-react";
import { OverviewWorkspace } from "../modules/overview";
import { MigrationManagerWorkspace } from "../modules/migration-manager";
import { DiscoverySnapshotsWorkspace } from "../modules/discovery-snapshots";

export function DataBridgeApp() {
  const [page, setPage] = useState<"overview" | "migration-manager" | "discovery-snapshots">("overview");
  return (
    <AppLayout
      brand={{
        href: "/data-bridge",
        subtitle: "controlled migration workspace",
        title: "Data Bridge"
      }}
      headerTitle={page === "overview" ? "Overview" : page === "migration-manager" ? "Migration Manager" : "Discovery Snapshots"}
      homeHref="/data-bridge"
      logoutHref="/sa/login"
      menuItems={[
        { icon: LayoutDashboardIcon, isActive: page === "overview", onSelect: () => setPage("overview"), title: "Overview" },
        { icon: WorkflowIcon, isActive: page === "migration-manager", onSelect: () => setPage("migration-manager"), title: "Migration Manager" },
        { icon: ScanSearchIcon, isActive: page === "discovery-snapshots", onSelect: () => setPage("discovery-snapshots"), title: "Discovery Snapshots" }
      ]}
      subtitle={null}
      title={null}
      versionLabel={`v ${__APP_VERSION__}`}
      user={{ email: "Configured in environment", fallback: "D", name: "Data Bridge Operator" }}
      workspaceItems={[
        {
          title: "Platform",
          description: "Master database, tenants, domains, and controls.",
          icon: ShieldCheckIcon,
          url: "/sa"
        },
        {
          title: "Data Bridge",
          description: "Schema comparison and controlled data migration.",
          icon: DatabaseZapIcon,
          active: true,
          url: "/data-bridge"
        }
      ]}
    >
      {page === "overview" ? <OverviewWorkspace /> : page === "migration-manager" ? <MigrationManagerWorkspace /> : <DiscoverySnapshotsWorkspace />}
    </AppLayout>
  );
}
