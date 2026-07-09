import { useMemo, useState } from "react";
import { ArrowLeftIcon, ArchiveRestoreIcon, BanIcon, BoxesIcon, GitBranchIcon, Layers3Icon, PlusIcon, RefreshCwIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@codexsun/ui";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel } from "@codexsun/ui/workspace/table";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceFormBanner, WorkspaceFormField, WorkspaceFormGrid } from "@codexsun/ui/workspace/upsert";
import { usePlatformRegistryMutations, usePlatformRegistryQuery } from "./platform-registry.hooks";
import type { ProjectManagerRegistryGroupNode, ProjectManagerRegistryModuleNode, ProjectManagerRegistryPlatformNode } from "../project-manager/project-manager.types";

type EditMode = "group" | "module" | "platform";
type EditForm = { active?: boolean; description: string; groupId?: string; id?: string; key: string; moduleType?: "area" | "module" | "page"; name: string; parentGroupId?: string; parentModuleId?: string; platformId?: string; routePath?: string; sortOrder: string; status: string };
type RegistrySavePayload = { active?: boolean; description: string; groupId?: string; id?: string; key: string; moduleType?: "area" | "module" | "page"; name: string; parentGroupId?: string; parentModuleId?: string; platformId?: string; routePath?: string; sortOrder: number; status: string };

export function PlatformRegistryWorkspace() {
  const registry = usePlatformRegistryQuery();
  const mutations = usePlatformRegistryMutations();
  const [platformId, setPlatformId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [editMode, setEditMode] = useState<EditMode>("platform");
  const [form, setForm] = useState<EditForm | null>(null);
  const [error, setError] = useState("");
  const platforms = registry.data?.platforms ?? [];
  const selectedPlatform = platforms.find((platform) => platform.id === platformId) ?? null;
  const groups = selectedPlatform?.groups ?? [];
  const groupOptions = flattenGroups(groups);
  const selectedGroup = groupOptions.find((group) => group.id === groupId) ?? null;
  const modules = selectedGroup?.modules ?? [];
  const moduleOptions = flattenModules(modules);
  const selectedModule = moduleOptions.find((module) => module.id === moduleId) ?? null;
  const childModules = selectedModule?.children ?? [];
  const busy = registry.isFetching || mutations.savePlatform.isPending || mutations.saveGroup.isPending || mutations.saveModule.isPending || mutations.setActive.isPending;
  const metrics = useMemo(() => registry.data?.summary, [registry.data]);

  function openPlatform(platform?: ProjectManagerRegistryPlatformNode) {
    setPlatformId(platform?.id ?? "");
    setGroupId("");
    setModuleId("");
    setForm(null);
  }

  function editPlatform(platform?: ProjectManagerRegistryPlatformNode) {
    setEditMode("platform");
    setForm(platform ? formFromPlatform(platform) : { description: "", key: "", name: "", sortOrder: "0", status: "active" });
  }

  function editGroup(group?: ProjectManagerRegistryGroupNode) {
    setEditMode("group");
    setForm(group ? formFromGroup(group) : { description: "", key: "", name: "", parentGroupId: "", platformId: selectedPlatform?.id ?? "", sortOrder: "0", status: "active" });
  }

  function editModule(module?: ProjectManagerRegistryModuleNode) {
    setEditMode("module");
    setForm(module ? formFromModule(module) : { description: "", groupId: selectedGroup?.id ?? "", key: "", moduleType: "module", name: "", parentModuleId: "", routePath: "", sortOrder: "0", status: "active" });
  }

  function save() {
    if (!form?.key.trim() || !form.name.trim()) {
      setError("Key and name are required.");
      return;
    }
    setError("");
    const payload = payloadFromForm(form);
    const action = editMode === "platform"
      ? mutations.savePlatform.mutateAsync(payload)
      : editMode === "group"
        ? mutations.saveGroup.mutateAsync(payload as RegistrySavePayload & { platformId: string })
        : mutations.saveModule.mutateAsync(payload as RegistrySavePayload & { groupId: string });
    action
      .then((record) => {
        toast.success("Registry saved", { description: record.name });
        setForm(null);
      })
      .catch((value) => setError(value instanceof Error ? value.message : "Save failed."));
  }

  return (
    <WorkspacePage
      title="Platform Registry"
      description={selectedPlatform ? `Viewing ${selectedPlatform.name} module groups and module registry.` : "Platform registry list for super-admins, admin, and tenant."}
      technicalName="page.platform-registry"
      actions={
        <div className="flex flex-wrap justify-end gap-2">
          {selectedPlatform ? <Button disabled={busy} variant="outline" onClick={() => openPlatform()}><ArrowLeftIcon className="size-4" />Platforms</Button> : null}
          <Button disabled={busy} variant="outline" onClick={() => void registry.refetch()}><RefreshCwIcon className="size-4" />Refresh</Button>
          <Button disabled={busy} onClick={() => (selectedPlatform ? editGroup() : editPlatform())}><PlusIcon className="size-4" />{selectedPlatform ? "Group" : "Platform"}</Button>
          {selectedPlatform && selectedGroup ? <Button disabled={busy} onClick={() => editModule()}><PlusIcon className="size-4" />Module</Button> : null}
        </div>
      }
    >
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <Metric icon={BoxesIcon} label="Platforms" value={String(metrics?.platforms ?? 0)} />
        <Metric icon={Layers3Icon} label="Groups" value={String(metrics?.totalGroups ?? 0)} />
        <Metric icon={GitBranchIcon} label="Modules" value={String(metrics?.totalModules ?? 0)} />
        <Metric icon={BoxesIcon} label="Active modules" value={String(metrics?.activeModules ?? 0)} />
      </div>
      {form ? <RegistryEditor busy={busy} error={error} form={form} mode={editMode} groups={groupOptions} modules={moduleOptions} onCancel={() => setForm(null)} onChange={setForm} onSave={save} platforms={platforms} /> : null}
      {selectedPlatform ? (
        <>
          <div className="mb-4 rounded-md border bg-card px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{selectedPlatform.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{selectedPlatform.key}</div>
                {selectedPlatform.description ? <div className="mt-2 text-sm text-muted-foreground">{selectedPlatform.description}</div> : null}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => editPlatform(selectedPlatform)}>Edit</Button>
                <Button size="sm" variant="outline" onClick={() => mutations.setActive.mutate({ active: !selectedPlatform.active, id: selectedPlatform.id, kind: "platforms" })}>
                  {selectedPlatform.active ? <BanIcon className="size-4" /> : <ArchiveRestoreIcon className="size-4" />}
                  {selectedPlatform.active ? "Off" : "Restore"}
                </Button>
              </div>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <RegistryColumn title="Module Groups" items={groups} selectedId={selectedGroup?.id ?? ""} onEdit={(item) => editGroup(item)} onSelect={(item) => { setGroupId(item.id); setModuleId(""); }} onToggle={(item) => mutations.setActive.mutate({ active: !item.active, id: item.id, kind: "groups" })} />
            <RegistryColumn title="Module Registry" items={modules} selectedId={selectedModule?.id ?? ""} onEdit={(item) => editModule(item)} onSelect={(item) => setModuleId(item.id)} onToggle={(item) => mutations.setActive.mutate({ active: !item.active, id: item.id, kind: "modules" })} emptyState={selectedGroup ? "No modules found." : "Select a module group first."} />
            <RegistryColumn title="Sub Modules" items={childModules} selectedId={selectedModule?.id ?? ""} onEdit={(item) => editModule(item)} onSelect={(item) => setModuleId(item.id)} onToggle={(item) => mutations.setActive.mutate({ active: !item.active, id: item.id, kind: "modules" })} emptyState={selectedModule ? "No sub modules found." : "Select a module first."} />
          </div>
        </>
      ) : (
        <PlatformTable platforms={platforms} onEdit={editPlatform} onSelect={openPlatform} onToggle={(item) => mutations.setActive.mutate({ active: !item.active, id: item.id, kind: "platforms" })} />
      )}
    </WorkspacePage>
  );
}

function PlatformTable({ onEdit, onSelect, onToggle, platforms }: { onEdit: (platform: ProjectManagerRegistryPlatformNode) => void; onSelect: (platform: ProjectManagerRegistryPlatformNode) => void; onToggle: (platform: ProjectManagerRegistryPlatformNode) => void; platforms: ProjectManagerRegistryPlatformNode[] }) {
  return (
    <WorkspaceTablePanel>
      <table className="w-full min-w-[620px] border-collapse text-sm">
        <thead className="bg-muted/50">
          <tr>
            <WorkspaceTableHeaderCell>Platform</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Key</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Action</WorkspaceTableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {platforms.map((platform) => (
            <tr className="border-b border-border/70 last:border-b-0" key={platform.id}>
              <td className="px-4 py-2.5">
                <button className="font-medium hover:underline" onClick={() => onSelect(platform)} type="button">{platform.name}</button>
                {platform.description ? <div className="mt-1 text-xs text-muted-foreground">{platform.description}</div> : null}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">{platform.key}</td>
              <td className="px-4 py-2.5"><WorkspaceStatusBadge label={platform.active ? platform.status : "off"} tone={platform.active ? "success" : "danger"} /></td>
              <td className="px-4 py-2.5">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(platform)}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => onToggle(platform)}>
                    {platform.active ? <BanIcon className="size-4" /> : <ArchiveRestoreIcon className="size-4" />}
                    {platform.active ? "Off" : "Restore"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {platforms.length === 0 ? <WorkspaceTableEmptyState>No platforms found.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}

function RegistryColumn<T extends { active: boolean; description: string; id: string; key: string; name: string; status: string }>({ emptyState, items, onEdit, onSelect, onToggle, selectedId, title }: { emptyState?: string; items: T[]; onEdit: (item: T) => void; onSelect: (item: T) => void; onToggle: (item: T) => void; selectedId: string; title: string }) {
  return (
    <section className="min-h-[28rem] rounded-md border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold tracking-normal">{title}</h2>
      </div>
      <div className="divide-y">
        {items.length ? items.map((item) => (
          <button key={item.id} type="button" className={`block w-full px-4 py-3 text-left hover:bg-muted/40 ${selectedId === item.id ? "bg-muted/60" : ""}`} onClick={() => onSelect(item)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{item.name}</div>
                <div className="truncate font-mono text-xs text-muted-foreground">{item.key}</div>
              </div>
              <StatusBadge tone={item.active ? "green" : "neutral"}>{item.active ? item.status : "off"}</StatusBadge>
            </div>
            {item.description ? <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.description}</div> : null}
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); onEdit(item); }}>Edit</Button>
              <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); onToggle(item); }}>
                {item.active ? <BanIcon className="size-4" /> : <ArchiveRestoreIcon className="size-4" />}
                {item.active ? "Off" : "Restore"}
              </Button>
            </div>
          </button>
        )) : <div className="px-4 py-8 text-sm text-muted-foreground">{emptyState ?? "No records found."}</div>}
      </div>
    </section>
  );
}

function RegistryEditor({ busy, error, form, groups, mode, modules, onCancel, onChange, onSave, platforms }: { busy: boolean; error: string; form: EditForm; groups: ProjectManagerRegistryGroupNode[]; mode: EditMode; modules: ProjectManagerRegistryModuleNode[]; onCancel: () => void; onChange: (form: EditForm) => void; onSave: () => void; platforms: ProjectManagerRegistryPlatformNode[] }) {
  return (
    <div className="mb-4 rounded-md border bg-card p-4 shadow-sm">
      {error ? <WorkspaceFormBanner title="Could not save">{error}</WorkspaceFormBanner> : null}
      <WorkspaceFormGrid columns={3}>
        <WorkspaceFormField label="Key" required><Input className="font-mono" value={form.key} onChange={(event) => onChange({ ...form, key: event.target.value })} /></WorkspaceFormField>
        <WorkspaceFormField label="Name" required><Input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} /></WorkspaceFormField>
        <WorkspaceFormField label="Status"><Input value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value })} /></WorkspaceFormField>
        <WorkspaceFormField label="Sort"><Input type="number" value={form.sortOrder} onChange={(event) => onChange({ ...form, sortOrder: event.target.value })} /></WorkspaceFormField>
        {mode === "group" ? <WorkspaceFormField label="Platform"><WorkspaceSelect value={form.platformId ?? ""} options={platforms.map((platform) => ({ label: platform.name, value: platform.id }))} onValueChange={(platformId) => onChange({ ...form, platformId })} /></WorkspaceFormField> : null}
        {mode === "group" ? <WorkspaceFormField label="Parent group"><WorkspaceSelect value={form.parentGroupId ?? ""} options={[{ label: "None", value: "" }, ...groups.map((group) => ({ label: group.name, value: group.id }))]} onValueChange={(parentGroupId) => onChange({ ...form, parentGroupId })} /></WorkspaceFormField> : null}
        {mode === "module" ? <WorkspaceFormField label="Group"><WorkspaceSelect value={form.groupId ?? ""} options={groups.map((group) => ({ label: group.name, value: group.id }))} onValueChange={(groupId) => onChange({ ...form, groupId })} /></WorkspaceFormField> : null}
        {mode === "module" ? <WorkspaceFormField label="Parent module"><WorkspaceSelect value={form.parentModuleId ?? ""} options={[{ label: "None", value: "" }, ...modules.map((module) => ({ label: module.name, value: module.id }))]} onValueChange={(parentModuleId) => onChange({ ...form, parentModuleId })} /></WorkspaceFormField> : null}
        {mode === "module" ? <WorkspaceFormField label="Type"><WorkspaceSelect value={form.moduleType ?? "module"} options={[{ label: "Area", value: "area" }, { label: "Module", value: "module" }, { label: "Page", value: "page" }]} onValueChange={(moduleType) => onChange({ ...form, moduleType: moduleType as "area" | "module" | "page" })} /></WorkspaceFormField> : null}
        {mode === "module" ? <WorkspaceFormField label="Route"><Input className="font-mono" value={form.routePath ?? ""} onChange={(event) => onChange({ ...form, routePath: event.target.value })} /></WorkspaceFormField> : null}
        <WorkspaceFormField label="Description"><Input value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></WorkspaceFormField>
      </WorkspaceFormGrid>
      <div className="mt-4 flex justify-end gap-2">
        <Button disabled={busy} variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={busy} onClick={onSave}><SaveIcon className="size-4" />Save</Button>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof BoxesIcon; label: string; value: string }) {
  return <div className="rounded-md border bg-card p-4 shadow-sm"><div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">{label}<Icon className="size-4" /></div><div className="mt-2 text-2xl font-semibold">{value}</div></div>;
}

function flattenGroups(groups: ProjectManagerRegistryGroupNode[]): ProjectManagerRegistryGroupNode[] {
  return groups.flatMap((group) => [group, ...flattenGroups(group.subGroups)]);
}

function flattenModules(modules: ProjectManagerRegistryModuleNode[]): ProjectManagerRegistryModuleNode[] {
  return modules.flatMap((module) => [module, ...flattenModules(module.children)]);
}

function formFromPlatform(platform: ProjectManagerRegistryPlatformNode): EditForm {
  return { ...platform, sortOrder: String(platform.sortOrder) };
}

function formFromGroup(group: ProjectManagerRegistryGroupNode): EditForm {
  return { ...group, sortOrder: String(group.sortOrder) };
}

function formFromModule(module: ProjectManagerRegistryModuleNode): EditForm {
  return { ...module, sortOrder: String(module.sortOrder) };
}

function payloadFromForm(form: EditForm): RegistrySavePayload {
  const payload: RegistrySavePayload = {
    description: form.description,
    key: form.key,
    name: form.name,
    sortOrder: Number(form.sortOrder || 0),
    status: form.status
  };
  if (form.active !== undefined) payload.active = form.active;
  if (form.groupId) payload.groupId = form.groupId;
  if (form.id) payload.id = form.id;
  if (form.moduleType) payload.moduleType = form.moduleType;
  if (form.parentGroupId) payload.parentGroupId = form.parentGroupId;
  if (form.parentModuleId) payload.parentModuleId = form.parentModuleId;
  if (form.platformId) payload.platformId = form.platformId;
  if (form.routePath) payload.routePath = form.routePath;
  return payload;
}
