import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { WorkspaceProtectedIndicator } from "@codexsun/ui/workspace/protected-indicator";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { CityRecord } from "./city.types";
export function CityList({
  loading,
  onEdit,
  onForceDelete,
  onRestore,
  onSuspend,
  onView,
  records
}: {
  loading: boolean;
  onEdit: (r: CityRecord) => void;
  onForceDelete: (r: CityRecord) => void;
  onRestore: (r: CityRecord) => void;
  onSuspend: (r: CityRecord) => void;
  onView: (r: CityRecord) => void;
  records: CityRecord[];
}) {
  const columns: ColumnDef<CityRecord>[] = [
    { accessorKey: "name", header: "City" },
    { accessorKey: "districtName", header: "District" },
    { accessorKey: "stateName", header: "State" },
    { accessorKey: "countryName", header: "Country" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <WorkspaceStatusBadge
          label={row.original.status === "active" ? "Active" : "Inactive"}
          tone={row.original.status === "active" ? "success" : "neutral"}
        />
      )
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div
            className="flex justify-end"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {isProtectedCity(record) ? (
              <WorkspaceProtectedIndicator label="Protected city" />
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
      emptyState="No citys found."
      isLoading={loading}
      minWidth="860px"
      onRowClick={onView}
    />
  );
}
export function isProtectedCity(record: CityRecord) {
  return record.name.trim() === "-";
}
