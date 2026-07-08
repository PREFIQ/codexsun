import { Link } from "@tanstack/react-router";
import { ReceiptTextIcon, RefreshCwIcon } from "lucide-react";
import { Button, Card, StatusBadge } from "@codexsun/ui";
import { PageTitle } from "../../shared/document/PageTitle";
import { useSales } from "./sales.hooks";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2
});

export function SalesPage() {
  const sales = useSales();

  return (
    <main className="billing-shell">
      <PageTitle title="Sales" />
      <header className="billing-toolbar">
        <div>
          <StatusBadge tone="blue">Billing Module</StatusBadge>
          <h1>Sales</h1>
          <p>Simple sales records for the Billing app foundation.</p>
        </div>
        <div className="billing-actions">
          <Button asChild variant="outline">
            <Link to="/">Billing Home</Link>
          </Button>
          <Button onClick={() => void sales.refetch()} variant="outline">
            <RefreshCwIcon size={16} />
            Refresh
          </Button>
        </div>
      </header>

      <Card className="sales-panel">
        <div className="sales-panel-header">
          <div>
            <ReceiptTextIcon size={20} />
            <strong>Sales Records</strong>
          </div>
          <StatusBadge tone={sales.isError ? "red" : "green"}>{sales.isError ? "API offline" : "Ready"}</StatusBadge>
        </div>

        {sales.isLoading ? (
          <div className="sales-empty">Loading sales records...</div>
        ) : sales.isError ? (
          <div className="sales-empty">Billing API is not reachable. Start `@codexsun/billing-api` and refresh.</div>
        ) : (
          <div className="sales-table" role="table">
            <div className="sales-row sales-row-head" role="row">
              <span>Invoice</span>
              <span>Customer</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {sales.data?.map((sale) => (
              <div className="sales-row" key={sale.id} role="row">
                <span>
                  <strong>{sale.invoiceNumber}</strong>
                  <small>{sale.id}</small>
                </span>
                <span>{sale.customerName}</span>
                <span>{sale.issuedOn}</span>
                <span>
                  {sale.currencyCode} {currencyFormatter.format(sale.amount)}
                </span>
                <span>
                  <StatusBadge tone={sale.status === "confirmed" ? "green" : sale.status === "cancelled" ? "red" : "neutral"}>
                    {sale.status}
                  </StatusBadge>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
