import { Link, useRouterState } from "@tanstack/react-router";
import { Button, Card, StatusBadge } from "@codexsun/ui";
import { PageTitle } from "../shared/document/PageTitle";
import { BillingLayout } from "../shared/layout/BillingLayout";

export function BillingHomePage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <BillingLayout
      currentPath={pathname}
      headerTitle="Billing"
      subtitle="Sales, invoices, collections, and print-ready billing workflows."
      title="Billing Desk"
    >
      <main className="billing-shell">
        <PageTitle title="Billing" />
        <section className="billing-hero">
          <div>
            <StatusBadge tone="blue">Billing</StatusBadge>
            <h1>CODEXSUN Billing</h1>
            <p>Sales, invoices, collections, and billing workflows for upcoming CODEXSUN apps.</p>
          </div>
          <Button asChild>
            <Link to="/billing/sales">Open sales</Link>
          </Button>
        </section>

        <section className="billing-grid">
          <Card className="billing-card">
            <span>Workspace</span>
            <strong>Sales</strong>
            <p>Full list, show, upsert, and print surfaces now live under the billing side menu.</p>
          </Card>
          <Card className="billing-card">
            <span>API</span>
            <strong>Billing API</strong>
            <p>Available locally at port 5550 with `/billing/sales` list and detail endpoints.</p>
          </Card>
        </section>
      </main>
    </BillingLayout>
  );
}
