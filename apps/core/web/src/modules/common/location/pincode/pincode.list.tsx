import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { WorkspaceProtectedIndicator } from "@codexsun/ui/workspace/protected-indicator";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import type { PincodeRecord } from "./pincode.types";
export function PincodeList({
  loading,
  onEdit,
  onForceDelete,
  onRestore,
  onSuspend,
  onView,
  records
}: {
  loading: boolean;
  onEdit: (r: PincodeRecord) => void;
  onForceDelete: (r: PincodeRecord) => void;
  onRestore: (r: PincodeRecord) => void;
  onSuspend: (r: PincodeRecord) => void;
  onView: (r: PincodeRecord) => void;
  records: PincodeRecord[];
}) {
  const columns: ColumnDef<PincodeRecord>[] = [
    { accessorKey: "name", header: "Pincode" },
    { accessorKey: "cityName", header: "City" },
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
            {isProtectedPincode(record) ? (
              <WorkspaceProtectedIndicator label="Protected pincode" />
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
      emptyState="No pincodes found."
      isLoading={loading}
      minWidth="860px"
      onRowClick={onView}
    />
  );
}
export function isProtectedPincode(record: PincodeRecord) {
  return record.name.trim() === "-";
}
