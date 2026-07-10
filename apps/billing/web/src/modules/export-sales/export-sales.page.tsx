import { useRouterState } from "@tanstack/react-router";
import { PageTitle } from "../../shared/document/PageTitle";
import { BillingLayout } from "../../shared/layout/BillingLayout";
import { ExportSalesWorkspace } from "./export-sales.workspace";

export function ExportSalesPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <BillingLayout
      currentPath={pathname}
      headerTitle="Export Sales"
      subtitle="List, review, edit, and print export sales records from one workspace."
      title="Export Sales Workspace"
    >
      <PageTitle title="Export Sales" />
      <ExportSalesWorkspace />
    </BillingLayout>
  );
}
