import { useRouterState } from "@tanstack/react-router";
import { PageTitle } from "../../shared/document/PageTitle";
import { BillingLayout } from "../../shared/layout/BillingLayout";
import { PurchaseWorkspace } from "./purchase.workspace";

export function PurchasePage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <BillingLayout
      currentPath={pathname}
      headerTitle="Purchase"
      subtitle="List, review, edit, and print purchase bills from one workspace."
      title="Purchase Workspace"
    >
      <PageTitle title="Purchase" />
      <PurchaseWorkspace />
    </BillingLayout>
  );
}
