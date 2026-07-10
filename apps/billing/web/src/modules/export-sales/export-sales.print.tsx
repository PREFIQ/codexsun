import { useMemo } from "react";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePrintSheet } from "@codexsun/ui/workspace/print";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { PageTitle } from "../../shared/document/PageTitle";
import { useExportSaleRecord } from "./export-sales.hooks";
import { formatDate, formatMoney } from "./export-sales.services";
import type { ExportSale } from "./export-sales.types";

export function ExportSalesPrintRoutePage() {
  const saleId = useMemo(() => new URLSearchParams(window.location.search).get("id"), []);
  const saleQuery = useExportSaleRecord(saleId, true);
  const sale = saleQuery.data;

  return (
    <WorkspacePage
      title={sale ? `${sale.invoiceNumber} print` : "Export sales print"}
      description="Printable invoice surface for the export sales workspace."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => window.history.back()}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => void saleQuery.refetch()}>
            <RefreshCw className={`size-4 ${saleQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      }
    >
      <PageTitle title={sale ? `${sale.invoiceNumber} Print` : "Export Sales Print"} />
      {sale ? <ExportSalesPrintDocument sale={sale} /> : <div className="rounded-md border border-border/70 bg-card/95 px-4 py-8 text-sm text-muted-foreground">{saleQuery.isLoading ? "Loading export sales print view..." : "Export sales print record was not found."}</div>}
    </WorkspacePage>
  );
}

export function ExportSalesPrintDocument({ sale }: { sale: ExportSale }) {
  return (
    <WorkspacePrintSheet>
      <article className="border border-slate-300 bg-white p-6 text-[10px] text-slate-900 shadow-sm">
        <header className="grid gap-4 border-b border-slate-300 pb-4 md:grid-cols-[1fr_auto]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">CODEXSUN Billing</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tax Invoice</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Export sales document prepared from the billing workspace with the same structured invoice rhythm used in the reference system.
            </p>
          </div>
          <div className="grid gap-2 self-start rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Status</div>
            <div className="flex justify-end">
              <WorkspaceStatusBadge label={sale.status} tone={sale.status === "confirmed" ? "success" : sale.status === "cancelled" ? "danger" : "warning"} />
            </div>
            <div className="text-sm font-semibold">{sale.invoiceNumber}</div>
            <div className="text-xs text-slate-500">{formatDate(sale.issuedOn)}</div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <AddressCard
            title="Bill to"
            lines={[sale.customerName, sale.customerEmail, sale.customerPhone, ...splitAddress(sale.billingAddress)]}
          />
          <AddressCard
            title="Ship to"
            lines={[sale.customerName, sale.customerPhone, ...splitAddress(sale.shippingAddress)]}
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-md border border-slate-300">
          <table className="w-full border-collapse text-left text-[10px]">
            <thead className="bg-slate-100 text-[9px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-3 py-3">Particulars</th>
                <th className="px-3 py-3">HSN</th>
                <th className="px-3 py-3 text-right">Qty</th>
                <th className="px-3 py-3 text-right">Rate</th>
                <th className="px-3 py-3 text-right">Tax %</th>
                <th className="px-3 py-3 text-right">Taxable</th>
                <th className="px-3 py-3 text-right">Tax</th>
                <th className="px-3 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-3 py-3">
                    <div className="font-medium">{item.productName || item.description}</div>
                    {item.description ? <div className="text-[9px] text-slate-500">{item.description}</div> : null}
                    <div className="text-[9px] text-slate-500">{item.unit}</div>
                  </td>
                  <td className="px-3 py-3 font-mono text-[9px]">{item.hsnCode}</td>
                  <td className="px-3 py-3 text-right">{item.quantity}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(item.rate, sale.currencyCode)}</td>
                  <td className="px-3 py-3 text-right">{item.taxRate}%</td>
                  <td className="px-3 py-3 text-right">{formatMoney(item.taxableAmount, sale.currencyCode)}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(item.taxAmount, sale.currencyCode)}</td>
                  <td className="px-3 py-3 text-right font-semibold">{formatMoney(item.lineTotal, sale.currencyCode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-[1fr_19rem]">
          <div className="rounded-md border border-slate-300 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Notes</div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{sale.notes || "No notes added for this invoice."}</p>
          </div>
          <div className="rounded-md border border-slate-300 px-4 py-4">
            <SummaryRow label="Subtotal" value={formatMoney(sale.subtotal, sale.currencyCode)} />
            <SummaryRow label="Tax" value={formatMoney(sale.taxAmount, sale.currencyCode)} />
            <SummaryRow label="Round off" value={formatMoney(sale.roundOff, sale.currencyCode)} />
            <SummaryRow label="Grand total" value={formatMoney(sale.amount, sale.currencyCode)} strong />
          </div>
        </section>

        <footer className="mt-8 grid gap-4 border-t border-slate-300 pt-4 md:grid-cols-[1fr_16rem]">
          <div className="text-[9px] leading-5 text-slate-500">
            Generated from the CODEXSUN billing export sales workspace. Review the record activity in the app before dispatching the invoice externally.
          </div>
          <div className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-right text-xs uppercase tracking-[0.2em] text-slate-500">
            Authorised Signatory
          </div>
        </footer>
      </article>
    </WorkspacePrintSheet>
  );
}

function AddressCard({ lines, title }: { lines: string[]; title: string }) {
  return (
    <div className="rounded-md border border-slate-300 px-4 py-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</div>
      <div className="mt-3 space-y-1 text-sm leading-6 text-slate-700">
        {lines.filter(Boolean).map((line) => (
          <div key={`${title}-${line}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function SummaryRow({ label, strong = false, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className={strong ? "grid grid-cols-[1fr_auto] gap-4 border-t border-slate-300 pt-3 font-semibold" : "grid grid-cols-[1fr_auto] gap-4 py-1"}>
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function splitAddress(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
