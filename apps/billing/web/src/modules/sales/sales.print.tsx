import { useState } from "react";
import { WorkspacePrintSheet } from "@codexsun/ui/workspace/print";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { PageTitle } from "../../shared/document/PageTitle";
import { useSaleRecord } from "./sales.hooks";
import { formatDate, formatMoney } from "./sales.services";
import type { Sale } from "./sales.types";

export type SalePrintCopy = "duplicate" | "office-copy" | "original";

export function SalesPrintRoutePage() {
  const saleId = new URLSearchParams(window.location.search).get("id");
  const saleQuery = useSaleRecord(saleId, true);
  const [printCopies, setPrintCopies] = useState<readonly SalePrintCopy[]>(["original"]);
  const sale = saleQuery.data;
  function togglePrintCopy(copy: SalePrintCopy) {
    setPrintCopies((current) => !current.includes(copy) ? [...current, copy] : current.length === 1 ? current : current.filter((value) => value !== copy));
  }
  return (
    <WorkspacePage className="billing-document-print-page" title={sale ? `${sale.saleNumber} print` : "Sales print"} description="Printable sales document." actions={<div className="flex gap-2 print:hidden"><Button type="button" variant="outline" onClick={() => window.history.back()}><ArrowLeft className="size-4" />Back</Button><Button type="button" variant="outline" onClick={() => void saleQuery.refetch()}><RefreshCw className={saleQuery.isFetching ? "size-4 animate-spin" : "size-4"} />Refresh</Button><Button type="button" onClick={() => window.print()}><Printer className="size-4" />Print</Button></div>}>
      <div className="print:hidden"><PageTitle title="Sales Print" /></div>
      {sale ? <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_15rem]"><div className="min-w-0 overflow-x-auto"><div className="grid min-w-fit justify-center gap-6">{printCopies.map((copy) => <div key={copy}><SalePrintDocument copy={copy} sale={sale} /></div>)}</div></div><Card className="h-fit rounded-md border-border/70 shadow-sm print:hidden xl:sticky xl:top-4 xl:mt-4"><CardHeader className="border-b border-border/70 px-4 py-3"><CardTitle className="text-sm">Print copies</CardTitle></CardHeader><CardContent className="space-y-1 p-2">{printCopyOptions.map((option) => <label key={option.value} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><input type="checkbox" className="size-4 accent-primary" checked={printCopies.includes(option.value)} onChange={() => togglePrintCopy(option.value)} /><span>{option.label}</span></label>)}</CardContent></Card></section> : <div className="px-4 py-8 text-sm text-muted-foreground">{saleQuery.isLoading ? "Loading sale print view..." : "Sale print record was not found."}</div>}
    </WorkspacePage>
  );
}

const printCopyOptions: Array<{ label: string; value: SalePrintCopy }> = [
  { label: "Original", value: "original" },
  { label: "Duplicate", value: "duplicate" },
  { label: "Office Copy", value: "office-copy" },
];

export function SalePrintDocument({
  copy,
  sale,
}: {
  copy: SalePrintCopy;
  sale: Sale;
}) {
  const pages = chunkItems(sale.items, 12);

  return (
    <WorkspacePrintSheet className="billing-print-document">
      {pages.map((items, pageIndex) => (
        <SalePrintPage
          key={`sale-print-page-${pageIndex}`}
          copy={copy}
          items={items}
          isLastPage={pageIndex === pages.length - 1}
          isMultiPage={pages.length > 1}
          pageIndex={pageIndex}
          pageCount={pages.length}
          sale={sale}
        />
      ))}
    </WorkspacePrintSheet>
  );
}

const salePrintHeadings = ["S.no", "Particulars", "HSN", "Qty", "Rate", "Taxable", "GST %", "CGST", "SGST", "Total"];

function SalePrintPage({
  copy,
  items,
  isLastPage,
  isMultiPage,
  pageIndex,
  pageCount,
  sale,
}: {
  copy: SalePrintCopy;
  items: Array<{ item: Sale["items"][number]; index: number }>;
  isLastPage: boolean;
  isMultiPage: boolean;
  pageIndex: number;
  pageCount: number;
  sale: Sale;
}) {
  const splitTax = sale.taxType === "cgst-sgst";
  const blankRows = Math.max(0, 12 - items.length);

  return (
    <article className={`bg-white px-3 py-3 text-[10px] text-black ${pageIndex > 0 ? "break-before-page" : ""}`}>
      <div className="border border-slate-300">
        <header className="border-b border-slate-300 px-3 py-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <span />
            <h1 className="text-center text-[11px] font-semibold tracking-wide">TAX INVOICE</h1>
            <span className="text-right text-[9px]">{printCopyLabel(copy)}{isMultiPage ? ` - Page ${pageIndex + 1} of ${pageCount}` : ""}</span>
          </div>
        </header>

        <section className="grid min-h-[8.75rem] grid-cols-[8rem_1fr] border-b border-slate-300">
          <div className="flex items-center justify-center p-4">
            <div className="grid size-[5.5rem] place-items-center rounded-[1rem] border-[3px] border-slate-700 text-slate-700">
              <div className="relative size-[3.6rem]">
                <span className="absolute left-0 top-1 h-[6px] w-full rounded bg-current" />
                <span className="absolute left-0 top-1/2 h-[6px] w-full -translate-y-1/2 rounded bg-current" />
                <span className="absolute left-0 bottom-1 h-[6px] w-full rounded bg-current" />
                <span className="absolute left-1 top-0 h-full w-[6px] rounded bg-current" />
                <span className="absolute right-1 top-0 h-full w-[6px] rounded bg-current" />
              </div>
            </div>
          </div>
          <div className="grid place-items-center px-6 py-5 text-center">
            <div>
              <div className="font-serif text-[1.95rem] font-bold tracking-tight">CODEXSUN</div>
              <div className="mt-1 text-[10px] leading-4">
                <div>address1, ADDRESS 2</div>
                <div>Tiruppur, Tiruppur-Dist, Tamil Nadu, India - 641602</div>
                <div className="font-semibold">GSTIN/UIN: -</div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-1 border-b border-slate-300 px-2 py-2 text-[10px]">
          <PrintPair label="Invoice No:">{sale.invoiceNumber || sale.saleNumber}</PrintPair>
          <PrintPair label="Date:">{formatDate(sale.issuedOn)}</PrintPair>
          <PrintPair label="Work Order:">{sale.workOrderNo || "-"}</PrintPair>
        </section>

        <section className="grid border-b border-slate-300 text-[10px] sm:grid-cols-2">
          <div className="min-h-[7.75rem] px-2 py-2">
            <div className="font-medium">Buyer (Bill to)</div>
            <div className="mt-1 font-semibold">M/s. {sale.customerName}</div>
            <div className="mt-1 whitespace-pre-wrap">{sale.billingAddress || "Address not set"}</div>
            <div className="mt-1 grid grid-cols-[7rem_1fr] gap-x-2">
              <span>GSTIN/UIN</span><span>:</span><span>State Name</span><span>:</span>
            </div>
          </div>
          <div className="min-h-[7.75rem] border-t border-slate-300 px-2 py-2 sm:border-l sm:border-t-0 sm:border-slate-300">
            <div className="font-medium">Buyer (Ship to)</div>
            <div className="mt-1 font-semibold">M/s. {sale.customerName}</div>
            <div className="mt-1 whitespace-pre-wrap">{sale.shippingAddress || sale.billingAddress || "Address not set"}</div>
            <div className="mt-1 grid grid-cols-[7rem_1fr] gap-x-2">
              <span>GSTIN/UIN</span><span>:</span><span>State Name</span><span>:</span>
            </div>
          </div>
        </section>

        <section>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-slate-300">
                {salePrintHeadings.map((heading) => <th key={heading} className="border-r border-slate-300 px-2 py-2 text-center font-semibold last:border-r-0">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {pageIndex > 0 ? <tr><td className="border-b border-slate-300 px-2 py-1 text-left font-semibold" colSpan={salePrintHeadings.length}>Carry forward from previous page</td></tr> : null}
              {items.map(({ item, index }) => (
                <SalePrintItemRow key={item.id} item={item} index={index} />
              ))}
              {Array.from({ length: blankRows }).map((_, index) => <SalePrintBlankRow key={`blank-${pageIndex}-${index}`} />)}
              {isLastPage ? <SalePrintTotalRow sale={sale} /> : <tr><td className="border-t border-slate-300 px-2 py-2 text-right font-semibold" colSpan={salePrintHeadings.length}>To be continued...</td></tr>}
            </tbody>
          </table>
        </section>

        {isLastPage ? (
          <>
            <section className="grid border-t border-slate-300 md:grid-cols-[1fr_12rem]">
              <div className="border-b border-slate-300 px-2 py-2 text-[9px] leading-4 md:border-b-0 md:border-r md:border-slate-300">
                <div className="font-medium">E&amp;OE</div>
                <div className="mt-1">We hereby certify that our registration under the GST Act 2017 is in force on the date on which sale of goods specified in this invoice is made by us and the sale is effected in the regular course of business.</div>
                <div className="mt-1 font-semibold">* Goods once sold will not be taken back unless agreed in writing.</div>
                <div className="mt-5"><div className="font-medium">Amount (in words)</div><div className="mt-1">{amountInWords(sale.amount)}</div></div>
              </div>
              <div className="text-[9px]">
                <PrintTotal label="Taxable Value" value={money(sale.subtotal)} />
                {splitTax ? <><PrintTotal label="Total CGST" value={money(sale.taxAmount / 2)} /><PrintTotal label="Total SGST" value={money(sale.taxAmount / 2)} /></> : <PrintTotal label="Total IGST" value={money(sale.taxAmount)} />}
                <PrintTotal label="Total GST" value={money(sale.taxAmount)} />
                <PrintTotal label="Round Off" value={money(sale.roundOff)} />
                <PrintTotal label="GRAND TOTAL" strong value={money(sale.amount)} />
              </div>
            </section>
            <section className="grid min-h-[6rem] border-t border-slate-300 md:grid-cols-[1fr_18rem]">
              <div className="flex items-end border-b border-slate-300 px-2 py-2 text-[9px] md:border-b-0 md:border-r md:border-slate-300"><div className="mt-4">Receiver Sign</div></div>
              <div className="grid grid-rows-[1fr_auto] px-2 py-2 text-[9px]"><div className="font-semibold">For CODEXSUN</div><div className="font-semibold">Authorised Signatory</div></div>
            </section>
            <footer className="border-t border-slate-300 px-2 py-1 text-[9px]">Subject to Tiruppur Jurisdiction</footer>
          </>
        ) : null}
      </div>
    </article>
  );
}

function SalePrintItemRow({ item, index }: { item: Sale["items"][number]; index: number }) {
  return <tr className="align-top">
    <td className="border-r border-slate-200 px-2 py-2 text-center">{index + 1}</td>
    <td className="border-r border-slate-200 px-2 py-2"><div className="font-medium">{item.productName}</div><div>{[item.description, item.colour ? `Colour : ${item.colour}` : "", item.size ? `Size : ${item.size}` : ""].filter(Boolean).join(" - ")}</div></td>
    <td className="border-r border-slate-200 px-2 py-2 text-center">{item.hsnCode || "-"}</td>
    <td className="border-r border-slate-200 px-2 py-2 text-center">{item.quantity}</td>
    <td className="border-r border-slate-200 px-2 py-2 text-right">{money(item.rate)}</td>
    <td className="border-r border-slate-200 px-2 py-2 text-right">{money(item.taxableAmount)}</td>
    <td className="border-r border-slate-200 px-2 py-2 text-center">{item.taxRate}%</td>
    <td className="border-r border-slate-200 px-2 py-2 text-right">{money(item.cgstAmount)}</td>
    <td className="border-r border-slate-200 px-2 py-2 text-right">{money(item.sgstAmount)}</td>
    <td className="px-2 py-2 text-right">{money(item.lineTotal)}</td>
  </tr>;
}

function SalePrintBlankRow() {
  return <tr className="h-8">{salePrintHeadings.map((heading, index) => <td key={heading} className={index === salePrintHeadings.length - 1 ? "" : "border-r border-slate-200"} />)}</tr>;
}

function SalePrintTotalRow({ sale }: { sale: Sale }) {
  return <tr className="border-t border-slate-300 font-semibold">
    <td className="border-r border-slate-200 px-2 py-2 text-right" colSpan={3}>Total</td>
    <td className="border-r border-slate-200 px-2 py-2 text-center">{sale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</td>
    <td className="border-r border-slate-200 px-2 py-2" />
    <td className="border-r border-slate-200 px-2 py-2 text-right">{money(sale.subtotal)}</td>
    <td className="border-r border-slate-200 px-2 py-2" />
    <td className="border-r border-slate-200 px-2 py-2 text-right">{money(sale.taxAmount / 2)}</td>
    <td className="border-r border-slate-200 px-2 py-2 text-right">{money(sale.taxAmount / 2)}</td>
    <td className="px-2 py-2 text-right">{money(sale.amount)}</td>
  </tr>;
}

function chunkItems(items: Sale["items"], size: number) {
  const pages: Array<Array<{ item: Sale["items"][number]; index: number }>> = [];
  for (let index = 0; index < items.length; index += size) pages.push(items.slice(index, index + size).map((item, offset) => ({ item, index: index + offset })));
  return pages.length > 0 ? pages : [[]];
}

function PrintPair({ children, label }: { children: string; label: string }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] gap-x-2">
      <span>{label}</span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}

function PrintTotal({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className={`grid grid-cols-[1fr_auto] gap-x-3 border-b border-slate-300 px-2 py-1.5 ${strong ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function printCopyLabel(copy: SalePrintCopy) {
  if (copy === "duplicate") return "Duplicate";
  if (copy === "office-copy") return "Office Copy";
  return "Original";
}

function money(value: number) {
  return formatMoney(value).replace("₹", "").trim();
}

function amountInWords(value: number) {
  const amount = Math.round(Number(value || 0));
  if (!amount) return "Zero Rupees Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const chunk = (num: number): string => {
    if (num < 20) return ones[num] || "";
    if (num < 100) return [tens[Math.floor(num / 10)] || "", ones[num % 10] || ""].filter(Boolean).join(" ");
    return [ones[Math.floor(num / 100)] || "", "Hundred", chunk(num % 100)].filter(Boolean).join(" ");
  };
  const parts: string[] = [];
  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const hundred = amount % 1000;
  if (crore) parts.push(`${chunk(crore)} Crore`);
  if (lakh) parts.push(`${chunk(lakh)} Lakh`);
  if (thousand) parts.push(`${chunk(thousand)} Thousand`);
  if (hundred) parts.push(chunk(hundred));
  return `${parts.join(" ")} Rupees Only`;
}
