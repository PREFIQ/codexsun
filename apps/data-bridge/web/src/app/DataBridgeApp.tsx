import { AppLayout } from "@codexsun/ui";
import { useState } from "react";
import {
  DatabaseZapIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  WandSparklesIcon,
  WorkflowIcon
} from "lucide-react";
import { OverviewWorkspace } from "../modules/overview";
import { MigrationManagerWorkspace } from "../modules/migration-manager";
import { DiscoverySnapshotsWorkspace } from "../modules/discovery-snapshots";
import { FieldMappingsWorkspace } from "../modules/mappings-transforms";
import { TransformsWorkspace } from "../modules/transforms";

export function DataBridgeApp() {
  const [page, setPage] = useState<
    "overview" | "migration-manager" | "discovery-snapshots" | "field-mappings" | "transforms"
  >("overview");
  return (
    <AppLayout
      brand={{
        href: "/data-bridge",
        subtitle: "controlled migration workspace",
        title: "Data Bridge"
      }}
      headerTitle={
        page === "overview"
          ? "Overview"
          : page === "migration-manager"
            ? "Migration Manager"
            : page === "discovery-snapshots"
              ? "Discovery Snapshots"
              : page === "field-mappings"
                ? "Field Mappings"
                : "Transforms"
      }
      homeHref="/data-bridge"
      logoutHref="/sa/login"
      menuItems={[
        {
          icon: LayoutDashboardIcon,
          isActive: page === "overview",
          onSelect: () => setPage("overview"),
          title: "Overview"
        },
        {
          icon: WorkflowIcon,
          isActive: page === "migration-manager",
          onSelect: () => setPage("migration-manager"),
          title: "Migration Manager"
        },
        {
          icon: ScanSearchIcon,
          isActive: page === "discovery-snapshots",
          onSelect: () => setPage("discovery-snapshots"),
          title: "Discovery Snapshots"
        },
        {
          icon: ListChecksIcon,
          isActive: page === "field-mappings",
          onSelect: () => setPage("field-mappings"),
          title: "Field Mappings"
        },
        {
          icon: WandSparklesIcon,
          isActive: page === "transforms",
          onSelect: () => setPage("transforms"),
          title: "Transforms"
        }
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
      {page === "overview" ? (
        <OverviewWorkspace />
      ) : page === "migration-manager" ? (
        <MigrationManagerWorkspace />
      ) : page === "discovery-snapshots" ? (
        <DiscoverySnapshotsWorkspace />
      ) : page === "field-mappings" ? (
        <FieldMappingsWorkspace />
      ) : (
        <TransformsWorkspace />
      )}
    </AppLayout>
  );
}
