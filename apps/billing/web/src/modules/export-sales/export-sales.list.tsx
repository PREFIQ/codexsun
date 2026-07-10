import { Eye, Printer } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel, WorkspaceTableSkeletonRows } from "@codexsun/ui/workspace/table";
import { cn } from "@codexsun/ui/lib/utils";
import { formatDate, formatMoney, totalExportSaleQuantity } from "./export-sales.services";
import type { ExportSale } from "./export-sales.types";

export function ExportSalesList({
  currentPage,
  entries,
  loading,
  onEdit,
  onPrint,
  onSetStatus,
  onView,
  rowsPerPage,
  visibleColumns,
}: {
  currentPage: number;
  entries: ExportSale[];
  loading: boolean;
  onEdit: (sale: ExportSale) => void;
  onPrint: (sale: ExportSale) => void;
  onSetStatus: (sale: ExportSale, status: "cancelled" | "confirmed") => void;
  onView: (sale: ExportSale) => void;
  rowsPerPage: number;
  visibleColumns: Record<string, boolean>;
}) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              {visibleColumns.invoice ? <WorkspaceTableHeaderCell>Invoice</WorkspaceTableHeaderCell> : null}
              {visibleColumns.date ? <WorkspaceTableHeaderCell>Date</WorkspaceTableHeaderCell> : null}
              {visibleColumns.customer ? <WorkspaceTableHeaderCell>Customer</WorkspaceTableHeaderCell> : null}
              {visibleColumns.items ? <WorkspaceTableHeaderCell>Items</WorkspaceTableHeaderCell> : null}
              {visibleColumns.subtotal ? <WorkspaceTableHeaderCell className="text-right">Subtotal</WorkspaceTableHeaderCell> : null}
              {visibleColumns.tax ? <WorkspaceTableHeaderCell className="text-right">Tax</WorkspaceTableHeaderCell> : null}
              {visibleColumns.total ? <WorkspaceTableHeaderCell className="text-right">Grand Total</WorkspaceTableHeaderCell> : null}
              {visibleColumns.status ? <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell> : null}
              <WorkspaceTableHeaderCell className="text-center">Print</WorkspaceTableHeaderCell>
              <WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {entries.map((sale, index) => (
              <tr key={sale.id} className={cn("border-b border-border/70 last:border-b-0", sale.status === "cancelled" && "bg-muted/20 text-muted-foreground")}>
                {visibleColumns.invoice ? <td className="px-4 py-2.5">
                  <button className="font-medium hover:underline" type="button" onClick={() => onView(sale)}>
                    {sale.invoiceNumber}
                  </button>
                </td> : null}
                {visibleColumns.date ? <td className="px-4 py-2.5 text-muted-foreground">{formatDate(sale.issuedOn)}</td> : null}
                {visibleColumns.customer ? <td className="px-4 py-2.5">
                  <div className="font-medium">{sale.customerName}</div>
                  <div className="text-xs text-muted-foreground">{sale.customerEmail}</div>
                </td> : null}
                {visibleColumns.items ? <td className="px-4 py-2.5 tabular-nums">{totalExportSaleQuantity(sale)}</td> : null}
                {visibleColumns.subtotal ? <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(sale.subtotal, sale.currencyCode)}</td> : null}
                {visibleColumns.tax ? <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(sale.taxAmount, sale.currencyCode)}</td> : null}
                {visibleColumns.total ? <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{formatMoney(sale.amount, sale.currencyCode)}</td> : null}
                {visibleColumns.status ? <td className="px-4 py-2.5">
                  <WorkspaceStatusBadge label={sale.status} tone={statusTone(sale.status)} />
                </td> : null}
                <td className="px-4 py-2.5 text-center">
                  <Button type="button" variant="outline" className="h-8 rounded-md" onClick={() => onPrint(sale)}>
                    <Printer className="size-4" />
                    Print
                  </Button>
                </td>
                <td className="px-4 py-1.5 text-right">
                  <WorkspaceRowActions
                    title={sale.invoiceNumber}
                    onEdit={() => onEdit(sale)}
                    onView={() => onView(sale)}
                    actions={[
                      {
                        id: "print",
                        icon: <Printer className="size-4" />,
                        label: "Open print",
                        onSelect: () => onPrint(sale),
                      },
                      {
                        id: sale.status === "confirmed" ? "cancel" : "confirm",
                        icon: sale.status === "confirmed" ? <Eye className="size-4" /> : <Eye className="size-4" />,
                        label: sale.status === "confirmed" ? "Mark cancelled" : "Mark confirmed",
                        onSelect: () => onSetStatus(sale, sale.status === "confirmed" ? "cancelled" : "confirmed"),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading ? <WorkspaceTableSkeletonRows columns={10} /> : null}
      {!loading && entries.length === 0 ? <WorkspaceTableEmptyState>No sales records found.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}

function statusTone(status: ExportSale["status"]) {
  if (status === "confirmed") return "success";
  if (status === "cancelled") return "danger";
  return "warning";
}
