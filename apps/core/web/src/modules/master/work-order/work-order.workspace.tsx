import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { cn } from "@codexsun/ui/lib/utils";
import { WorkOrderForm } from "./work-order.form";
import { useWorkOrders } from "./work-order.hooks";
import { WorkOrderList, isProtectedWorkOrder } from "./work-order.list";
import { createWorkOrder, forceDeleteWorkOrder, setWorkOrderActive, updateWorkOrder } from "./work-order.services";
import { workOrderDefinition } from "./work-order.definition";
import type { WorkOrderRecord, WorkOrderSavePayload } from "./work-order.types";

export function WorkOrderWorkspace() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [editing, setEditing] = useState<WorkOrderRecord | null | undefined>(undefined);
  const query = useWorkOrders(search);
  const save = useMutation({
    mutationFn: (payload: WorkOrderSavePayload) => editing ? updateWorkOrder(editing.id, payload) : createWorkOrder(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["core", "work-order", "list"] });
      toast.success("Work order saved");
      setEditing(undefined);
    },
    onError: (error) => toast.error("Unable to save work order", {
      description: error instanceof Error ? error.message : "Please try again."
    })
  });
  const rowAction = useMutation({
    mutationFn: ({ record, type }: { record: WorkOrderRecord; type: "delete" | "toggle" }) => type === "delete"
      ? forceDeleteWorkOrder(record.id)
      : setWorkOrderActive(record.id, !record.isActive),
    onSuccess: async (record, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["core", "work-order", "list"] });
      toast.success(variables.type === "delete" ? "Work order force deleted" : "Work order status updated", { description: record.name });
    },
    onError: (error) => toast.error("Unable to update work order", { description: error instanceof Error ? error.message : "Please try again." })
  });
  const rows = query.data ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [search]);

  if (editing !== undefined) {
    return (
      <WorkOrderForm
        error={save.error instanceof Error ? save.error.message : ""}
        existingRecords={rows}
        loading={save.isPending}
        record={editing}
        onBack={() => setEditing(undefined)}
        onSubmit={(payload) => save.mutate(payload)}
      />
    );
  }

  return (
    <WorkspacePage
      title={workOrderDefinition.label}
      description={workOrderDefinition.description}
      actions={<div className="flex gap-2">
        <Button className="h-9 rounded-md" variant="outline" onClick={() => void query.refetch()}><RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} />Refresh</Button>
        <Button className="h-9 rounded-md" onClick={() => setEditing(null)}><Plus className="size-4" />New</Button>
      </div>}
    >
      <WorkspaceFilters
        searchPlaceholder={workOrderDefinition.search}
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <WorkOrderList
        loading={query.isFetching && !query.data}
        records={pageRows}
        onEdit={(record) => { if (!isProtectedWorkOrder(record)) setEditing(record); }}
        onForceDelete={(record) => { if (window.confirm(`Force delete ${record.name}? This cannot be undone.`)) rowAction.mutate({ record, type: "delete" }); }}
        onToggle={(record) => rowAction.mutate({ record, type: "toggle" })}
      />
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, rows.length)}
        singularLabel={workOrderDefinition.singular}
        totalCount={rows.length}
        totalPages={totalPages}
        onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))}
        onPageChange={setPage}
        onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
        onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(1); }}
      />
    </WorkspacePage>
  );
}
