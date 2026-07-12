import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { CompanyForm } from "./company.form";
import { useCompanies } from "./company.hooks";
import { CompanyList } from "./company.list";
import { createCompany, updateCompany } from "./company.services";
import { companyDefinition, type CompanyRecord, type CompanySavePayload } from "./company.types";
export function CompanyWorkspace() {
  const client = useQueryClient(),
    [search, setSearch] = useState(""),
    [editing, setEditing] = useState<CompanyRecord | null | undefined>(undefined),
    query = useCompanies(search),
    records = query.data ?? [];
  const save = useMutation({
    mutationFn: (payload: CompanySavePayload) =>
      editing ? updateCompany(editing.id, payload) : createCompany(payload),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["core", "company", "list"] });
      toast.success("Company saved");
      setEditing(undefined);
    },
    onError: (error) => toast.error("Unable to save company", { description: error.message })
  });
  if (editing !== undefined)
    return (
      <CompanyForm
        error={save.error?.message ?? ""}
        loading={save.isPending}
        record={editing}
        records={records}
        onBack={() => setEditing(undefined)}
        onSubmit={(payload) => save.mutate(payload)}
      />
    );
  return (
    <WorkspacePage
      title={companyDefinition.label}
      description={companyDefinition.description}
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
        searchPlaceholder={companyDefinition.search}
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <CompanyList
        loading={query.isFetching && !query.data}
        records={records}
        onEdit={setEditing}
      />
    </WorkspacePage>
  );
}
