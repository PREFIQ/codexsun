import { SalesList } from "./sales.list";
import { useSales } from "./sales.hooks";

export function SalesWorkspace() {
  const sales = useSales();
  if (sales.isLoading) return <p>Loading sales records...</p>;
  if (sales.isError) return <p>Sales records are unavailable.</p>;
  return <SalesList sales={sales.data ?? []} onSelect={() => undefined} />;
}
