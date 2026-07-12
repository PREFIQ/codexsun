import type { Receipt } from "./receipt.types";
export function ReceiptPrint({ receipt }: { receipt: Receipt }) {
  return (
    <div className="receipt-print mx-auto max-w-[800px] border border-slate-300 bg-white p-8 text-slate-900 print:border-0">
      <div className="border-b border-slate-300 pb-4 text-center">
        <h1 className="text-2xl font-bold">RECEIPT VOUCHER</h1>
        <p className="text-sm">{receipt.receiptNumber}</p>
      </div>
      <div className="grid grid-cols-2 gap-6 border-b border-slate-300 py-5 text-sm">
        <p>
          <b>Received from</b>
          <br />
          {receipt.partyName}
        </p>
        <p>
          <b>Date</b>
          <br />
          {receipt.receiptDate}
        </p>
        <p>
          <b>Mode</b>
          <br />
          {receipt.receiptMode}
        </p>
        <p>
          <b>Reference</b>
          <br />
          {receipt.referenceNo || "-"}
        </p>
      </div>
      <div className="py-6">
        <div className="flex justify-between border-b border-slate-200 py-2">
          <span>Amount</span>
          <b>{money(receipt.amount)}</b>
        </div>
        <div className="flex justify-between border-b border-slate-200 py-2">
          <span>Allocated</span>
          <b>{money(receipt.allocatedAmount)}</b>
        </div>
        <div className="flex justify-between py-2 text-lg">
          <span>Total</span>
          <b>{money(receipt.totalAmount)}</b>
        </div>
      </div>
      <div className="mt-20 grid grid-cols-2 gap-8 border-t border-slate-300 pt-3 text-sm">
        <span>Received by</span>
        <span>Authorised signatory</span>
      </div>
    </div>
  );
}
function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}
