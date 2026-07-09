import { useRouterState } from "@tanstack/react-router";
import { PageTitle } from "../../shared/document/PageTitle";
import { BillingLayout } from "../../shared/layout/BillingLayout";
import { SalesWorkspace } from "./sales.workspace";

export function SalesPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <BillingLayout
      currentPath={pathname}
      headerTitle="Sales"
      subtitle="List, review, edit, and print billing sales records from one workspace."
      title="Sales Workspace"
    >
      <PageTitle title="Sales" />
      <SalesWorkspace />
    </BillingLayout>
  );
}
