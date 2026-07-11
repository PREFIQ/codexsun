import { useState } from "react";
import { Button, Input } from "@codexsun/ui";
import type { ServiceOrderInput } from "./service-orders.types";
export function ServiceOrdersForm({
  busy,
  onSave
}: {
  busy: boolean;
  onSave: (input: ServiceOrderInput) => void;
}) {
  const [tableLabel, setTable] = useState("");
  const [waiterName, setWaiter] = useState("");
  const [itemName, setItem] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setPrice] = useState("0");
  const [kitchenStation, setStation] = useState("Main Kitchen");
  return (
    <section className="rounded-md border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Take new order</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Capture the table and first item. Additional-item editing follows in the order detail
        workflow.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Input
          placeholder="Table (required)"
          value={tableLabel}
          onChange={(event) => setTable(event.target.value)}
        />
        <Input
          placeholder="Waiter (required)"
          value={waiterName}
          onChange={(event) => setWaiter(event.target.value)}
        />
        <Input
          placeholder="Menu item (required)"
          value={itemName}
          onChange={(event) => setItem(event.target.value)}
        />
        <Input
          placeholder="Quantity"
          type="number"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <Input
          placeholder="Unit price"
          type="number"
          value={unitPrice}
          onChange={(event) => setPrice(event.target.value)}
        />
        <Input
          placeholder="Kitchen station"
          value={kitchenStation}
          onChange={(event) => setStation(event.target.value)}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          disabled={busy || !tableLabel.trim() || !waiterName.trim() || !itemName.trim()}
          onClick={() =>
            onSave({
              tableLabel,
              waiterName,
              items: [
                {
                  itemName,
                  kitchenStation,
                  quantity: Number(quantity),
                  unitPrice: Number(unitPrice)
                }
              ]
            })
          }
        >
          Create order
        </Button>
      </div>
    </section>
  );
}
