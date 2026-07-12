import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { ProductForm } from "./product.form";
import { useProducts } from "./product.hooks";
import { ProductList } from "./product.list";
import {
  createProduct,
  forceDeleteProduct,
  setProductActive,
  updateProduct
} from "./product.services";
import { productDefinition, type ProductRecord, type ProductSavePayload } from "./product.types";
export function ProductWorkspace() {
  const client = useQueryClient(),
    [search, setSearch] = useState(""),
    [editing, setEditing] = useState<ProductRecord | null | undefined>(undefined),
    query = useProducts(search);
  const save = useMutation({
    mutationFn: (payload: ProductSavePayload) =>
      editing ? updateProduct(editing.id, payload) : createProduct(payload),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["core", "product", "list"] });
      toast.success("Product saved");
      setEditing(undefined);
    },
    onError: (error) => toast.error("Unable to save product", { description: error.message })
  });
  const action = useMutation({
    mutationFn: ({ record, type }: { record: ProductRecord; type: "delete" | "toggle" }) =>
      type === "delete"
        ? forceDeleteProduct(record.id)
        : setProductActive(record.id, !record.isActive),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["core", "product", "list"] });
    },
    onError: (error) => toast.error("Unable to update product", { description: error.message })
  });
  if (editing !== undefined)
    return (
      <ProductForm
        error={save.error?.message ?? ""}
        loading={save.isPending}
        record={editing}
        onBack={() => setEditing(undefined)}
        onSubmit={(payload) => save.mutate(payload)}
      />
    );
  return (
    <WorkspacePage
      title={productDefinition.label}
      description={productDefinition.description}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void query.refetch()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            New
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        searchPlaceholder={productDefinition.search}
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <ProductList
        loading={query.isFetching && !query.data}
        records={query.data ?? []}
        onEdit={setEditing}
        onForceDelete={(record) => {
          if (confirm(`Force delete ${record.name}?`)) action.mutate({ record, type: "delete" });
        }}
        onToggle={(record) => action.mutate({ record, type: "toggle" })}
      />
    </WorkspacePage>
  );
}
