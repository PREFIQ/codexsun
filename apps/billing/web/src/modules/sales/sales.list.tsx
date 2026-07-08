import { StatusBadge } from "@codexsun/ui";
import type { Sale } from "./sales.types";

export function SalesList({ onSelect, sales }: { onSelect: (sale: Sale) => void; sales: Sale[] }) {
  return (
    <div className="sales-table" role="table">
      <div className="sales-row sales-row-head" role="row">
        <span>Invoice</span><span>Customer</span><span>Date</span><span>Amount</span><span>Status</span>
      </div>
      {sales.map((sale) => (
        <button className="sales-row w-full text-left" key={sale.id} onClick={() => onSelect(sale)} role="row" type="button">
          <span><strong>{sale.invoiceNumber}</strong><small>{sale.id}</small></span>
          <span>{sale.customerName}</span><span>{sale.issuedOn}</span><span>{sale.currencyCode} {sale.amount.toFixed(2)}</span>
          <span><StatusBadge tone={sale.status === "confirmed" ? "green" : sale.status === "cancelled" ? "red" : "neutral"}>{sale.status}</StatusBadge></span>
        </button>
      ))}
    </div>
  );
}
