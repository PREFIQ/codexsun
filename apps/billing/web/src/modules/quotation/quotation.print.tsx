import { WorkspacePrintSheet } from "@codexsun/ui/workspace/print";
import { formatDate, formatMoney } from "./quotation.services";
import type { Quotation } from "./quotation.types";

export type QuotationPrintCopy = "duplicate" | "office-copy" | "original";

export function QuotationPrintDocument({
  copy,
  quotation,
}: {
  copy: QuotationPrintCopy;
  quotation: Quotation;
}) {
  const pages = chunkItems(quotation.items, 12);

  return (
    <WorkspacePrintSheet>
      {pages.map((items, pageIndex) => (
        <QuotationPrintPage
          key={`quotation-print-page-${pageIndex}`}
          copy={copy}
          items={items}
          isLastPage={pageIndex === pages.length - 1}
          isMultiPage={pages.length > 1}
          pageIndex={pageIndex}
          pageCount={pages.length}
          quotation={quotation}
        />
      ))}
    </WorkspacePrintSheet>
  );
}

const quotationPrintHeadings = ["S.no", "Particulars", "HSN", "PO", "DC", "Qty", "Rate", "Taxable", "GST %", "GST TAX", "Total"];

function QuotationPrintPage({
  copy,
  items,
  isLastPage,
  isMultiPage,
  pageIndex,
  pageCount,
  quotation,
}: {
  copy: QuotationPrintCopy;
  items: Array<{ item: Quotation["items"][number]; index: number }>;
  isLastPage: boolean;
  isMultiPage: boolean;
  pageIndex: number;
  pageCount: number;
  quotation: Quotation;
}) {
  const splitTax = quotation.taxType === "cgst-sgst";
  const blankRows = Math.max(0, 12 - items.length);

  return (
    <article className={`bg-white px-3 py-3 text-[10px] text-black ${pageIndex > 0 ? "break-before-page" : ""}`}>
      <div className="border border-slate-300">
        <header className="border-b border-slate-300 px-3 py-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <span />
            <h1 className="text-center text-[11px] font-semibold tracking-wide">QUOTATION</h1>
            <span className="text-right text-[9px]">{printCopyLabel(copy)}{isMultiPage ? ` - Page ${pageIndex + 1} of ${pageCount}` : ""}</span>
          </div>
        </header>

        <section className="grid min-h-[11.5rem] grid-cols-[8rem_1fr] border-b border-slate-300">
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
              <div className="text-[1.95rem] font-semibold tracking-tight">CODEXSUN</div>
              <div className="mt-2 text-[11px] leading-5">
                <div>address1, ADDRESS 2</div>
                <div>Tiruppur, Tiruppur-Dist, Tamil Nadu, India - 641602</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid border-b border-slate-300 text-[10px] sm:grid-cols-2">
          <div className="px-2 py-2">
            <div className="font-medium">Buyer (Bill to)</div>
            <div className="mt-1 font-semibold">M/s. {quotation.customerName}</div>
            <div className="mt-1 whitespace-pre-wrap">{quotation.billingAddress || "Address not set"}</div>
            <div className="mt-1 grid grid-cols-[7rem_1fr] gap-x-2">
              <span>GSTIN/UIN</span><span>:</span><span>State Name</span><span>:</span>
            </div>
          </div>
          <div className="space-y-1 border-t border-slate-300 px-2 py-2 sm:border-l sm:border-slate-300 sm:border-t-0">
            <PrintPair label="Quotation No:">{quotation.quotationNumber}</PrintPair>
            <PrintPair label="Date:">{formatDate(quotation.date)}</PrintPair>
            <PrintPair label="Work Order:">{quotation.workOrderNo || "-"}</PrintPair>
          </div>
        </section>

        <section>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-slate-300">
                {quotationPrintHeadings.map((heading) => <th key={heading} className="border-r border-slate-300 px-2 py-2 text-center font-semibold last:border-r-0">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {pageIndex > 0 ? <tr><td className="border-b border-slate-300 px-2 py-1 text-left font-semibold" colSpan={quotationPrintHeadings.length}>Carry forward from previous page</td></tr> : null}
              {items.map(({ item, index }) => (
                <QuotationPrintItemRow key={item.id} item={item} index={index} />
              ))}
              {Array.from({ length: blankRows }).map((_, index) => <QuotationPrintBlankRow key={`blank-${pageIndex}-${index}`} />)}
              {isLastPage ? <QuotationPrintTotalRow quotation={quotation} /> : <tr><td className="border-t border-slate-300 px-2 py-2 text-right font-semibold" colSpan={quotationPrintHeadings.length}>To be continued...</td></tr>}
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
                <div className="mt-5"><div className="font-medium">Amount (in words)</div><div className="mt-1">{amountInWords(quotation.amount)}</div></div>
              </div>
              <div className="text-[9px]">
                <PrintTotal label="Taxable Value" value={money(quotation.subtotal)} />
                {splitTax ? <><PrintTotal label="Total CGST" value={money(quotation.taxAmount / 2)} /><PrintTotal label="Total SGST" value={money(quotation.taxAmount / 2)} /></> : <PrintTotal label="Total IGST" value={money(quotation.taxAmount)} />}
                <PrintTotal label="Total GST" value={money(quotation.taxAmount)} />
                <PrintTotal label="Round Off" value={money(quotation.roundOff)} />
                <PrintTotal label="GRAND TOTAL" strong value={money(quotation.amount)} />
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

function QuotationPrintItemRow({ item, index }: { item: Quotation["items"][number]; index: number }) {
  return <tr className="align-top">
    <td className="border-r border-slate-200 px-2 py-2 text-center">{index + 1}</td>
    <td className="border-r border-slate-200 px-2 py-2"><div className="font-medium">{item.productName}</div><div>{[item.description, item.colour ? `Colour : ${item.colour}` : "", item.size ? `Size : ${item.size}` : ""].filter(Boolean).join(" - ")}</div></td>
    <td className="border-r border-slate-200 px-2 py-2 text-center">{item.hsnCode || "-"}</td>
    <td className="border-r border-slate-200 px-2 py-2 text-center">{item.poNo || "-"}</td>
    <td className="border-r border-slate-200 px-2 py-2 text-center">{item.dcNo || "-"}</td>
    <td className="border-r border-slate-200 px-2 py-2 text-center">{item.quantity}</td>
    <td className="border-r border-slate-200 px-2 py-2 text-right">{money(item.rate)}</td>
    <td className="border-r border-slate-200 px-2 py-2 text-right">{money(item.taxableAmount)}</td>
    <td className="border-r border-slate-200 px-2 py-2 text-center">{item.taxRate}%</td>
    <td className="border-r border-slate-200 px-2 py-2 text-right">{money(item.taxAmount)}</td>
    <td className="px-2 py-2 text-right">{money(item.lineTotal)}</td>
  </tr>;
}

function QuotationPrintBlankRow() {
  return <tr className="h-8">{quotationPrintHeadings.map((heading, index) => <td key={heading} className={index === quotationPrintHeadings.length - 1 ? "" : "border-r border-slate-200"} />)}</tr>;
}

function QuotationPrintTotalRow({ quotation }: { quotation: Quotation }) {
  return <tr className="border-t border-slate-300 font-semibold">
    <td className="border-r border-slate-200 px-2 py-2 text-right" colSpan={5}>Total</td>
    <td className="border-r border-slate-200 px-2 py-2 text-center">{quotation.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</td>
    <td className="border-r border-slate-200 px-2 py-2" />
    <td className="border-r border-slate-200 px-2 py-2 text-right">{money(quotation.subtotal)}</td>
    <td className="border-r border-slate-200 px-2 py-2" />
    <td className="border-r border-slate-200 px-2 py-2 text-right">{money(quotation.taxAmount)}</td>
    <td className="px-2 py-2 text-right">{money(quotation.amount)}</td>
  </tr>;
}

function chunkItems(items: Quotation["items"], size: number) {
  const pages: Array<Array<{ item: Quotation["items"][number]; index: number }>> = [];
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

function printCopyLabel(copy: QuotationPrintCopy) {
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
