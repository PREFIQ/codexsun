import { ArrowLeft, Pencil, Plus, Printer } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceDetailTable, WorkspaceShowCard, WorkspaceShowLayout } from "@codexsun/ui/workspace/show";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePrintPreview } from "@codexsun/ui/workspace/print";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { formatDate, formatDateTime, formatMoney, totalPurchaseQuantity } from "./purchase.services";
import { PurchasePrintDocument } from "./purchase.print";
import type { Purchase } from "./purchase.types";

export function PurchaseShowPage({
  onBack,
  onEdit,
  onNew,
  onPrint,
  sale,
}: {
  onBack: () => void;
  onEdit: () => void;
  onNew: () => void;
  onPrint: () => void;
  sale: Purchase;
}) {
  return (
    <WorkspacePage
      title={sale.invoiceNumber}
      description="Review purchase bill details, totals, and the live print preview for this record."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onEdit}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onPrint}>
            <Printer className="size-4" />
            Print page
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={onNew}>
            <Plus className="size-4" />
            New purchase
          </Button>
        </div>
      }
    >
      <WorkspaceShowLayout className="items-start">
        <div className="space-y-4">
          <WorkspaceShowCard title="Invoice profile">
            <WorkspaceDetailTable
              rows={[
                ["Invoice", sale.invoiceNumber],
                ["Date", formatDate(sale.issuedOn)],
                ["Status", <WorkspaceStatusBadge key="status" label={sale.status} tone={sale.status === "confirmed" ? "success" : sale.status === "cancelled" ? "danger" : "warning"} />],
                ["Supplier", sale.customerName],
                ["Email", sale.customerEmail],
                ["Phone", sale.customerPhone],
                ["Currency", <span key="currency" className="font-mono text-xs">{sale.currencyCode}</span>],
                ["Created", formatDateTime(sale.createdAt)],
                ["Updated", formatDateTime(sale.updatedAt)],
              ]}
            />
          </WorkspaceShowCard>

          <WorkspaceShowCard title="Addresses">
            <WorkspaceDetailTable
              rows={[
                ["Billing address", <AddressBlock key="billing" value={sale.billingAddress} />],
                ["Shipping address", <AddressBlock key="shipping" value={sale.shippingAddress} />],
              ]}
            />
          </WorkspaceShowCard>

          <WorkspaceShowCard title="Line items">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Description</th>
                    <th className="px-4 py-3 text-left font-semibold">HSN</th>
                    <th className="px-4 py-3 text-right font-semibold">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold">Rate</th>
                    <th className="px-4 py-3 text-right font-semibold">Tax %</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item.id} className="border-t border-border/70">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.productName || item.description}</div>
                        {item.description ? <div className="text-xs text-muted-foreground">{item.description}</div> : null}
                        <div className="text-xs text-muted-foreground">{item.unit}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{item.hsnCode}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(item.rate, sale.currencyCode)}</td>
                      <td className="px-4 py-3 text-right">{item.taxRate}%</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatMoney(item.lineTotal, sale.currencyCode)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WorkspaceShowCard>
        </div>

        <div className="space-y-4">
          <WorkspaceShowCard title="Totals">
            <WorkspaceDetailTable
              rows={[
                ["Item count", sale.items.length],
                ["Quantity", totalPurchaseQuantity(sale)],
                ["Subtotal", formatMoney(sale.subtotal, sale.currencyCode)],
                ["Tax", formatMoney(sale.taxAmount, sale.currencyCode)],
                ["Round off", formatMoney(sale.roundOff, sale.currencyCode)],
                ["Grand total", <span key="amount" className="font-semibold">{formatMoney(sale.amount, sale.currencyCode)}</span>],
              ]}
            />
          </WorkspaceShowCard>

          <WorkspaceShowCard title="Notes">
            <div className="px-4 py-3 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
              {sale.notes || "No notes were added for this purchase record."}
            </div>
          </WorkspaceShowCard>

          <WorkspacePrintPreview label="Print Preview">
            <div className="origin-top scale-[0.42] sm:scale-[0.56] md:scale-[0.62] lg:scale-[0.48] xl:scale-[0.56]">
              <PurchasePrintDocument sale={sale} />
            </div>
          </WorkspacePrintPreview>
        </div>
      </WorkspaceShowLayout>
    </WorkspacePage>
  );
}

function AddressBlock({ value }: { value: string }) {
  return (
    <div className="whitespace-pre-wrap text-sm leading-6">
      {value || "Not set"}
    </div>
  );
}
