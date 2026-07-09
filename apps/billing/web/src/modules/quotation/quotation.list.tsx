import { WorkspaceStatusBadge, WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel } from "@codexsun/ui/workspace";
import { formatDate, formatMoney } from "./quotation.services";
import type { Quotation } from "./quotation.types";

export function QuotationList({ loading, onOpen, quotations }: { loading: boolean; onOpen: (quotation: Quotation) => void; quotations: Quotation[] }) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-muted/45">
            <tr>
              <WorkspaceTableHeaderCell>Quotation</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Date</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Customer</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Amount</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {quotations.map((quotation) => (
              <tr className="cursor-pointer border-b border-border/70 last:border-0 hover:bg-muted/35" key={quotation.id} onClick={() => onOpen(quotation)}>
                <td className="px-4 py-2.5 font-semibold">{quotation.quotationNumber}</td>
                <td className="px-4 py-2.5">{formatDate(quotation.date)}</td>
                <td className="px-4 py-2.5">{quotation.customerName}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(quotation.amount)}</td>
                <td className="px-4 py-2.5"><WorkspaceStatusBadge label={quotation.status} tone={quotation.status === "confirmed" ? "success" : quotation.status === "cancelled" ? "danger" : "warning"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!quotations.length && !loading ? <WorkspaceTableEmptyState>No quotations found.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}
