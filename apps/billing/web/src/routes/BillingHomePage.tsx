import { Link } from "@tanstack/react-router";
import { Button, Card, StatusBadge } from "@codexsun/ui";
import { PageTitle } from "../shared/document/PageTitle";

export function BillingHomePage() {
  return (
    <main className="billing-shell">
      <PageTitle title="Billing" />
      <section className="billing-hero">
        <div>
          <StatusBadge tone="blue">Billing</StatusBadge>
          <h1>CODEXSUN Billing</h1>
          <p>Sales, invoices, collections, and billing workflows for upcoming CODEXSUN apps.</p>
        </div>
        <Button asChild>
          <Link to="/billing">Open sales</Link>
        </Button>
      </section>

      <section className="billing-grid">
        <Card className="billing-card">
          <span>First Module</span>
          <strong>Sales</strong>
          <p>A simple billing template for customer, invoice number, amount, and status.</p>
        </Card>
        <Card className="billing-card">
          <span>API</span>
          <strong>Billing API</strong>
          <p>Available locally at port 5550 with `/billing/sales` endpoints.</p>
        </Card>
      </section>
    </main>
  );
}
