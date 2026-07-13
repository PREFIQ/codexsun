import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { WorkspaceProtectedIndicator } from "@codexsun/ui/workspace/protected-indicator";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { StateRecord } from "./state.types";

export function StateList({
  loading,
  onEdit,
  onForceDelete,
  onRestore,
  onSuspend,
  onView,
  records
}: {
  loading: boolean;
  onEdit: (record: StateRecord) => void;
  onForceDelete: (record: StateRecord) => void;
  onRestore: (record: StateRecord) => void;
  onSuspend: (record: StateRecord) => void;
  onView: (record: StateRecord) => void;
  records: StateRecord[];
}) {
  const columns: ColumnDef<StateRecord>[] = [
    { accessorKey: "name", header: "State" },
    { accessorKey: "code", header: "State code" },
    { accessorKey: "countryName", header: "Country" },
    { accessorKey: "sortOrder", header: "Sort order" },
    {
      accessorKey: "status",
      cell: ({ row }) => (
        <WorkspaceStatusBadge
          label={row.original.status === "active" ? "Active" : "Inactive"}
          tone={row.original.status === "active" ? "success" : "neutral"}
        />
      ),
      header: "Status"
    },
    {
      id: "actions",
      enableSorting: false,
      header: "Actions",
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div
            className="flex justify-end"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {isProtectedState(record) ? (
              <WorkspaceProtectedIndicator label="Protected state" />
            ) : (
              <WorkspaceRowActions
                actions={[
                  {
                    id: "force-delete",
                    icon: <Trash2 className="size-4" />,
                    label: "Force delete",
                    onSelect: () => onForceDelete(record),
                    tone: "destructive"
                  }
                ]}
                deleteLabel="Suspend"
                isSuspended={record.status === "inactive"}
                onDelete={() => onSuspend(record)}
                onEdit={() => onEdit(record)}
                onRestore={() => onRestore(record)}
                onView={() => onView(record)}
                title={record.name}
              />
            )}
          </div>
        );
      }
    }
  ];
  return (
    <WorkspaceTable
      columns={columns}
      data={records}
      emptyState="No states found."
      isLoading={loading}
      minWidth="860px"
      onRowClick={onView}
    />
  );
}

export function isProtectedState(record: StateRecord) {
  return record.code.trim().toUpperCase() === "UNKNOWN" || record.name.trim() === "-";
}
