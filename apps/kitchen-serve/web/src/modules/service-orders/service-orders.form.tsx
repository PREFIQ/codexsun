import { useMemo, useState } from "react";
import { Button, Input } from "@codexsun/ui";
import {
  CheckIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
  Trash2Icon
} from "lucide-react";
import type { ServiceOrderInput, ServiceOrderItemInput } from "./service-orders.types";

type Product = ServiceOrderItemInput & {
  category: string;
  emoji: string;
  id: string;
  description: string;
};
type CartItem = Product & { quantity: number };

const categories = [
  "All",
  "Breakfast",
  "Starters",
  "Main Course",
  "Breads",
  "Beverages",
  "Desserts"
];
const products: Product[] = [
  {
    id: "masala-dosa",
    itemName: "Masala Dosa",
    category: "Breakfast",
    emoji: "🥞",
    description: "Crisp dosa, potato masala & chutneys",
    kitchenStation: "South Indian",
    quantity: 1,
    unitPrice: 140
  },
  {
    id: "idli-sambar",
    itemName: "Idli Sambar",
    category: "Breakfast",
    emoji: "🍚",
    description: "Four soft idlis with sambar",
    kitchenStation: "South Indian",
    quantity: 1,
    unitPrice: 110
  },
  {
    id: "paneer-tikka",
    itemName: "Paneer Tikka",
    category: "Starters",
    emoji: "🍢",
    description: "Charred cottage cheese & peppers",
    kitchenStation: "Tandoor",
    quantity: 1,
    unitPrice: 280
  },
  {
    id: "chilli-chicken",
    itemName: "Chilli Chicken",
    category: "Starters",
    emoji: "🍗",
    description: "Indo-Chinese, peppers & spring onion",
    kitchenStation: "Wok",
    quantity: 1,
    unitPrice: 320
  },
  {
    id: "butter-chicken",
    itemName: "Butter Chicken",
    category: "Main Course",
    emoji: "🍛",
    description: "Creamy tomato gravy, tandoori chicken",
    kitchenStation: "Main Kitchen",
    quantity: 1,
    unitPrice: 390
  },
  {
    id: "paneer-butter",
    itemName: "Paneer Butter Masala",
    category: "Main Course",
    emoji: "🥘",
    description: "Paneer in rich tomato-cashew gravy",
    kitchenStation: "Main Kitchen",
    quantity: 1,
    unitPrice: 330
  },
  {
    id: "veg-biryani",
    itemName: "Vegetable Biryani",
    category: "Main Course",
    emoji: "🍲",
    description: "Aromatic basmati rice & seasonal vegetables",
    kitchenStation: "Main Kitchen",
    quantity: 1,
    unitPrice: 260
  },
  {
    id: "garlic-naan",
    itemName: "Garlic Naan",
    category: "Breads",
    emoji: "🫓",
    description: "Tandoor-baked with garlic butter",
    kitchenStation: "Tandoor",
    quantity: 1,
    unitPrice: 75
  },
  {
    id: "lime-soda",
    itemName: "Fresh Lime Soda",
    category: "Beverages",
    emoji: "🥤",
    description: "Sweet, salted or mixed",
    kitchenStation: "Beverage",
    quantity: 1,
    unitPrice: 90
  },
  {
    id: "filter-coffee",
    itemName: "Filter Coffee",
    category: "Beverages",
    emoji: "☕",
    description: "South Indian house blend",
    kitchenStation: "Beverage",
    quantity: 1,
    unitPrice: 80
  },
  {
    id: "gulab-jamun",
    itemName: "Gulab Jamun",
    category: "Desserts",
    emoji: "🍮",
    description: "Warm dumplings in cardamom syrup",
    kitchenStation: "Dessert",
    quantity: 1,
    unitPrice: 120
  },
  {
    id: "kulfi",
    itemName: "Pistachio Kulfi",
    category: "Desserts",
    emoji: "🍨",
    description: "Traditional dense Indian ice cream",
    kitchenStation: "Dessert",
    quantity: 1,
    unitPrice: 150
  }
];

export function ServiceOrdersForm({
  busy,
  onSave
}: {
  busy: boolean;
  onSave: (input: ServiceOrderInput) => void;
}) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [tableLabel, setTable] = useState("");
  const [waiterName, setWaiter] = useState("");
  const [guestName, setGuest] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const visible = useMemo(
    () =>
      products.filter(
        (product) =>
          (category === "All" || product.category === category) &&
          `${product.itemName} ${product.description}`.toLowerCase().includes(search.toLowerCase())
      ),
    [category, search]
  );
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  function add(product: Product) {
    setCart((items) =>
      items.some((item) => item.id === product.id)
        ? items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [...items, { ...product, quantity: 1 }]
    );
  }
  function quantity(id: string, change: number) {
    setCart((items) =>
      items
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + change } : item))
        .filter((item) => item.quantity > 0)
    );
  }
  function submit() {
    if (!tableLabel.trim() || !waiterName.trim() || !cart.length) return;
    onSave({
      tableLabel: tableLabel.trim(),
      waiterName: waiterName.trim(),
      ...(guestName.trim() ? { guestName: guestName.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      items: cart.map(({ itemName, kitchenStation, quantity, unitPrice }) => ({
        itemName,
        kitchenStation,
        quantity,
        unitPrice
      }))
    });
    setCart([]);
    setGuest("");
    setNotes("");
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4 dark:from-orange-950/20 dark:to-amber-950/20">
        <h2 className="text-xl font-semibold">New waiter order</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap items, confirm the table, and send directly to the kitchen in one step.
        </p>
      </div>
      <div className="grid min-h-[680px] xl:grid-cols-[180px_minmax(0,1fr)_390px]">
        <aside className="border-b p-4 xl:border-b-0 xl:border-r">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-col">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${category === item ? "bg-orange-600 text-white shadow-sm" : "hover:bg-muted"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </aside>
        <div className="p-4 sm:p-5">
          <div className="relative mb-5">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search menu"
              className="pl-9"
              placeholder="Search dishes or ingredients…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h3 className="font-semibold">{category} menu</h3>
              <p className="text-xs text-muted-foreground">{visible.length} items available</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {visible.map((product) => {
              const count = cart.find((item) => item.id === product.id)?.quantity;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => add(product)}
                  className="group relative overflow-hidden rounded-xl border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span className="grid size-14 place-items-center rounded-xl bg-orange-50 text-3xl dark:bg-orange-950/30">
                      {product.emoji}
                    </span>
                    {count ? (
                      <span className="grid size-7 place-items-center rounded-full bg-orange-600 text-xs font-bold text-white">
                        {count}
                      </span>
                    ) : (
                      <PlusIcon className="size-5 text-muted-foreground group-hover:text-orange-600" />
                    )}
                  </div>
                  <p className="font-semibold">{product.itemName}</p>
                  <p className="mt-1 min-h-8 text-xs leading-4 text-muted-foreground">
                    {product.description}
                  </p>
                  <p className="mt-3 font-semibold text-orange-700">₹{product.unitPrice}</p>
                </button>
              );
            })}
          </div>
        </div>
        <aside className="flex flex-col border-t bg-muted/20 xl:border-l xl:border-t-0">
          <div className="border-b p-5">
            <div className="flex items-center gap-2">
              <ShoppingBagIcon className="size-5 text-orange-600" />
              <h3 className="font-semibold">Current order</h3>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Input
                placeholder="Table / room *"
                value={tableLabel}
                onChange={(event) => setTable(event.target.value)}
              />
              <Input
                placeholder="Waiter name *"
                value={waiterName}
                onChange={(event) => setWaiter(event.target.value)}
              />
              <Input
                className="col-span-2"
                placeholder="Guest name (optional)"
                value={guestName}
                onChange={(event) => setGuest(event.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[340px] flex-1 overflow-y-auto p-4">
            {!cart.length ? (
              <div className="grid h-48 place-items-center text-center">
                <div>
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-2xl">
                    🍽️
                  </span>
                  <p className="mt-3 font-medium">The order is empty</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose a dish from the menu to begin.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="rounded-lg border bg-background p-3">
                    <div className="flex gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">₹{item.unitPrice} each</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.itemName}`}
                        onClick={() =>
                          setCart((items) => items.filter((entry) => entry.id !== item.id))
                        }
                      >
                        <Trash2Icon className="size-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-md border">
                        <button
                          type="button"
                          className="p-1.5"
                          onClick={() => quantity(item.id, -1)}
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="p-1.5"
                          onClick={() => quantity(item.id, 1)}
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </div>
                      <strong className="text-sm">₹{item.unitPrice * item.quantity}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-auto border-t bg-background p-5">
            <textarea
              aria-label="Order notes"
              className="mb-4 min-h-16 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Order notes, allergies, spice preference…"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order total</span>
              <strong className="text-2xl">₹{subtotal.toLocaleString("en-IN")}</strong>
            </div>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={busy || !tableLabel.trim() || !waiterName.trim() || !cart.length}
              onClick={submit}
            >
              <CheckIcon className="mr-2 size-4" />
              {busy ? "Sending to kitchen…" : "Send order to kitchen"}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              The kitchen desk receives this order automatically.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
