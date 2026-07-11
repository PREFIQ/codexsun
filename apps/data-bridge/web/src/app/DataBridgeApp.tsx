import { AppLayout } from "@codexsun/ui";
import { useState } from "react";
import {
  CheckCheckIcon,
  DatabaseZapIcon,
  GitCompareArrowsIcon,
  KeyRoundIcon,
  ListChecksIcon,
  PlayCircleIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  WorkflowIcon
} from "lucide-react";
import { MigrationProjectsWorkspace } from "../modules/migration-projects";

export function DataBridgeApp() {
  const [page, setPage] = useState("overview");
  const menuItems = [
    { key: "overview", label: "Overview", icon: DatabaseZapIcon },
    { key: "migration-projects", label: "Migration Projects", icon: WorkflowIcon },
    { key: "connections", label: "Connections & Secrets", icon: KeyRoundIcon },
    { key: "discovery", label: "Discovery Snapshots", icon: ScanSearchIcon },
    { key: "schema-comparison", label: "Schema Comparison", icon: GitCompareArrowsIcon },
    { key: "mappings", label: "Mappings & Transforms", icon: ListChecksIcon },
    { key: "approvals", label: "Review & Approvals", icon: ShieldCheckIcon },
    { key: "execution-runs", label: "Execution Runs", icon: PlayCircleIcon },
    { key: "reconciliation", label: "Reconciliation & Audit", icon: CheckCheckIcon }
  ];
  return (
    <AppLayout
      brand={{
        href: "/data-bridge",
        subtitle: "controlled migration workspace",
        title: "Data Bridge"
      }}
      headerTitle={menuItems.find((item) => item.key === page)?.label ?? "Data Bridge"}
      homeHref="/data-bridge"
      logoutHref="/sa/login"
      menuItems={menuItems.map((item) => ({
        icon: item.icon,
        isActive: page === item.key,
        title: item.label,
        onSelect: () => setPage(item.key)
      }))}
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
      <MigrationProjectsWorkspace page={page} />
    </AppLayout>
  );
}
