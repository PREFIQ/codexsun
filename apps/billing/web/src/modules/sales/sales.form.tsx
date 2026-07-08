import { Button, Input } from "@codexsun/ui";
import type { SaleSavePayload } from "./sales.types";

export function SalesForm({ onSubmit, value }: { onSubmit: (value: SaleSavePayload) => void; value: SaleSavePayload }) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(value); }}>
      <div className="grid gap-3 md:grid-cols-2">
        <Input aria-label="Invoice number" required value={value.invoiceNumber} readOnly />
        <Input aria-label="Customer name" required value={value.customerName} readOnly />
        <Input aria-label="Amount" required type="number" value={value.amount} readOnly />
        <Input aria-label="Currency code" required value={value.currencyCode} readOnly />
      </div>
      <Button className="mt-4" type="submit">Save sale</Button>
    </form>
  );
}
