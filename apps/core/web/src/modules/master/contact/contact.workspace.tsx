import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { ContactForm } from "./contact.form";
import { useContacts } from "./contact.hooks";
import { ContactList } from "./contact.list";
import {
  createContact,
  forceDeleteContact,
  setContactActive,
  updateContact
} from "./contact.services";
import { contactDefinition, type ContactRecord, type ContactSavePayload } from "./contact.types";
export function ContactWorkspace() {
  const client = useQueryClient(),
    [search, setSearch] = useState(""),
    [editing, setEditing] = useState<ContactRecord | null | undefined>(undefined),
    query = useContacts(search),
    records = query.data ?? [];
  const save = useMutation({
    mutationFn: (payload: ContactSavePayload) =>
      editing ? updateContact(editing.id, payload) : createContact(payload),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["core", "contact", "list"] });
      toast.success("Contact saved");
      setEditing(undefined);
    },
    onError: (error) => toast.error("Unable to save contact", { description: error.message })
  });
  const action = useMutation({
    mutationFn: ({ record, type }: { record: ContactRecord; type: "delete" | "toggle" }) =>
      type === "delete"
        ? forceDeleteContact(record.id)
        : setContactActive(record.id, !record.isActive),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["core", "contact", "list"] });
    },
    onError: (error) => toast.error("Unable to update contact", { description: error.message })
  });
  if (editing !== undefined)
    return (
      <ContactForm
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
      title={contactDefinition.label}
      description={contactDefinition.description}
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
        searchPlaceholder={contactDefinition.search}
        searchValue={search}
        onSearchValueChange={setSearch}
      />
      <ContactList
        loading={query.isFetching && !query.data}
        records={records}
        onEdit={setEditing}
        onForceDelete={(record) => {
          if (confirm(`Force delete ${record.name}?`)) action.mutate({ record, type: "delete" });
        }}
        onToggle={(record) => action.mutate({ record, type: "toggle" })}
      />
    </WorkspacePage>
  );
}
