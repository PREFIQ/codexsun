import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Plus, RefreshCw, Save, TestTube2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel,
  WorkspaceTableSkeletonRows
} from "@codexsun/ui/workspace/table";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import {
  WorkspaceShowCard,
  WorkspaceShowLayout,
  WorkspaceDetailTable
} from "@codexsun/ui/workspace/show";
import {
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceFormPanel,
  WorkspaceUpsertPage
} from "@codexsun/ui/workspace/upsert";
import {
  createMigrationJob,
  listMigrationJobs,
  smokeTestMigrationDatabase,
  updateMigrationJob
} from "./migration-manager.services";
import type {
  DatabaseSettings,
  MigrationJob,
  MigrationJobInput,
  SmokeResult
} from "./migration-manager.types";

type View =
  | { mode: "list" }
  | { mode: "show"; job: MigrationJob }
  | { mode: "upsert"; job: MigrationJob | null };
const emptyDatabase = (): DatabaseSettings => ({
  database: "",
  host: "127.0.0.1",
  password: "",
  port: 3306,
  type: "mariadb",
  user: "root"
});

export function MigrationManagerWorkspace() {
  const client = useQueryClient();
  const [view, setView] = useState<View>({ mode: "list" });
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["data-bridge", "migration-jobs"],
    queryFn: listMigrationJobs
  });
  const create = useMutation({
    mutationFn: createMigrationJob,
    onSuccess: async (job) => {
      await client.invalidateQueries({ queryKey: ["data-bridge", "migration-jobs"] });
      toast.success("Migration job saved");
      setView({ mode: "show", job });
    }
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: MigrationJobInput }) =>
      updateMigrationJob(id, input),
    onSuccess: async (job) => {
      await client.invalidateQueries({ queryKey: ["data-bridge", "migration-jobs"] });
      toast.success("Migration job updated");
      setView({ mode: "show", job });
    }
  });
  if (view.mode === "show")
    return (
      <JobShow
        job={view.job}
        onBack={() => setView({ mode: "list" })}
        onEdit={() => setView({ mode: "upsert", job: view.job })}
      />
    );
  if (view.mode === "upsert")
    return (
      <JobForm
        job={view.job}
        loading={create.isPending || update.isPending}
        error={(create.error ?? update.error)?.message ?? ""}
        onBack={() => setView(view.job ? { mode: "show", job: view.job } : { mode: "list" })}
        onSave={(input) =>
          view.job ? update.mutate({ id: view.job.id, input }) : create.mutate(input)
        }
      />
    );
  const jobs = (query.data ?? []).filter((job) =>
    `${job.name} ${job.tenant} ${job.status}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <WorkspacePage
      title="Migration Manager"
      description="Create and monitor tenant-scoped source-to-target database migration jobs."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void query.refetch()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button onClick={() => setView({ mode: "upsert", job: null })}>
            <Plus className="size-4" />
            New migration job
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        searchValue={search}
        onSearchValueChange={setSearch}
        searchPlaceholder="Search job, tenant, or status"
      />
      <WorkspaceTablePanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <WorkspaceTableHeaderCell>Reference</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Job name</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Tenant</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Source</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Target</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
                <WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr className="border-b last:border-0" key={job.id}>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    MJ-{job.id}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      className="font-medium hover:underline"
                      onClick={() => setView({ mode: "show", job })}
                    >
                      {job.name}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">{job.tenant}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{position(job.source)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{position(job.target)}</td>
                  <td className="px-4 py-2.5">
                    <WorkspaceStatusBadge label={job.status} tone={tone(job.status)} />
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <WorkspaceRowActions
                      title={job.name}
                      onView={() => setView({ mode: "show", job })}
                      onEdit={() => setView({ mode: "upsert", job })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!jobs.length && query.isFetching ? <WorkspaceTableSkeletonRows columns={7} /> : null}
        {!jobs.length && !query.isFetching ? (
          <WorkspaceTableEmptyState>No migration jobs found.</WorkspaceTableEmptyState>
        ) : null}
      </WorkspaceTablePanel>
    </WorkspacePage>
  );
}

function JobShow({
  job,
  onBack,
  onEdit
}: {
  job: MigrationJob;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [results, setResults] = useState<Partial<Record<"source" | "target", SmokeResult>>>({});
  const [connecting, setConnecting] = useState<"source" | "target" | null>(null);
  const [errors, setErrors] = useState<Partial<Record<"source" | "target", string>>>({});

  async function connect(side: "source" | "target") {
    setConnecting(side);
    setErrors((current) => ({ ...current, [side]: "" }));
    try {
      const result = await smokeTestMigrationDatabase(job.id, side);
      setResults((current) => ({ ...current, [side]: result }));
    } catch (error) {
      setResults((current) => ({ ...current, [side]: undefined }));
      setErrors((current) => ({
        ...current,
        [side]: error instanceof Error ? error.message : "Connection request failed."
      }));
    } finally {
      setConnecting(null);
    }
  }

  return (
    <WorkspacePage
      title={job.name}
      description="Review the migration job and verify both database connections."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button onClick={onEdit}>
            <Pencil className="size-4" />
            Edit
          </Button>
        </div>
      }
    >
      <WorkspaceShowLayout>
        <WorkspaceShowCard title="Migration job">
          <WorkspaceDetailTable
            rows={[
              ["Reference", `MJ-${job.id}`],
              ["Name", job.name],
              ["Tenant", job.tenant],
              [
                "Status",
                <WorkspaceStatusBadge key="status" label={job.status} tone={tone(job.status)} />
              ]
            ]}
          />
        </WorkspaceShowCard>
        <div className="space-y-4">
          {(["source", "target"] as const).map((side) => (
            <WorkspaceShowCard key={side} title={`${capitalize(side)} database`}>
              <WorkspaceDetailTable
                rows={[
                  ["Position", position(job[side])],
                  ["Type", job[side].type],
                  ["User", job[side].user],
                  [
                    "Connection",
                    <ConnectionStatus
                      key="connection"
                      checking={connecting === side}
                      error={errors[side]}
                      result={results[side]}
                    />
                  ]
                ]}
              />
              <Button
                className="mt-4"
                variant="outline"
                disabled={connecting !== null}
                onClick={() => void connect(side)}
              >
                <TestTube2 className="size-4" />
                {connecting === side ? "Connecting..." : `Connect ${side}`}
              </Button>
            </WorkspaceShowCard>
          ))}
        </div>
      </WorkspaceShowLayout>
    </WorkspacePage>
  );
}

function ConnectionStatus({
  checking,
  error,
  result
}: {
  checking: boolean;
  error: string | undefined;
  result: SmokeResult | undefined;
}) {
  if (checking) return <WorkspaceStatusBadge label="Checking" tone="info" />;
  if (error) return <span className="text-sm text-destructive">Request failed: {error}</span>;
  if (!result) return <WorkspaceStatusBadge label="Not connected" tone="neutral" />;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <WorkspaceStatusBadge
        label={result.connected ? "Connected" : "Failed"}
        tone={result.connected ? "success" : "danger"}
      />
      <span className="text-xs text-muted-foreground">
        {result.position}
        {result.responseMs === null ? "" : ` · ${result.responseMs} ms`}
      </span>
    </span>
  );
}

function JobForm({
  job,
  loading,
  error,
  onBack,
  onSave
}: {
  job: MigrationJob | null;
  loading: boolean;
  error: string;
  onBack: () => void;
  onSave: (input: MigrationJobInput) => void;
}) {
  const [form, setForm] = useState<MigrationJobInput>(() =>
    job
      ? {
          name: job.name,
          tenant: job.tenant,
          status: job.status,
          source: { ...job.source, password: "" },
          target: { ...job.target, password: "" }
        }
      : { name: "", tenant: "", status: "draft", source: emptyDatabase(), target: emptyDatabase() }
  );
  const [validation, setValidation] = useState("");
  function submit() {
    if (
      !form.name.trim() ||
      !form.tenant.trim() ||
      !validDatabase(form.source, Boolean(job)) ||
      !validDatabase(form.target, Boolean(job))
    ) {
      setValidation(
        "Job name, tenant, and complete source and target database settings are required."
      );
      return;
    }
    setValidation("");
    onSave(form);
  }
  return (
    <WorkspaceUpsertPage
      title={job ? "Edit migration job" : "New migration job"}
      description="Configure tenant ownership and source-to-target database positions."
      action={
        <Button variant="outline" onClick={onBack}>
          <X className="size-4" />
          Cancel
        </Button>
      }
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {validation || error ? (
          <WorkspaceFormBanner title="Could not save">{validation || error}</WorkspaceFormBanner>
        ) : null}
        <WorkspaceFormPanel
          footer={
            <>
              <Button type="submit" disabled={loading}>
                <Save className="size-4" />
                {loading ? "Saving..." : job ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
            </>
          }
        >
          <WorkspaceFormGrid columns={2}>
            <WorkspaceFormField label="Job name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Tenant" required>
              <Input
                value={form.tenant}
                onChange={(e) => setForm({ ...form, tenant: e.target.value })}
              />
            </WorkspaceFormField>
          </WorkspaceFormGrid>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <DatabaseFields
              title="Source database"
              value={form.source}
              passwordRequired={!job}
              onChange={(source) => setForm({ ...form, source })}
            />
            <DatabaseFields
              title="Target database"
              value={form.target}
              passwordRequired={!job}
              onChange={(target) => setForm({ ...form, target })}
            />
          </div>
        </WorkspaceFormPanel>
      </form>
    </WorkspaceUpsertPage>
  );
}

function DatabaseFields({
  title,
  value,
  passwordRequired,
  onChange
}: {
  title: string;
  value: DatabaseSettings;
  passwordRequired: boolean;
  onChange: (value: DatabaseSettings) => void;
}) {
  const field = (key: keyof DatabaseSettings, input: string | number) =>
    onChange({ ...value, [key]: input });
  return (
    <section className="rounded-md border p-4">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <WorkspaceFormGrid columns={2}>
        <WorkspaceFormField label="Host" required>
          <Input value={value.host} onChange={(e) => field("host", e.target.value)} />
        </WorkspaceFormField>
        <WorkspaceFormField label="Port" required>
          <Input
            type="number"
            value={value.port}
            onChange={(e) => field("port", Number(e.target.value))}
          />
        </WorkspaceFormField>
        <WorkspaceFormField label="Database" required>
          <Input value={value.database} onChange={(e) => field("database", e.target.value)} />
        </WorkspaceFormField>
        <WorkspaceFormField label="User" required>
          <Input value={value.user} onChange={(e) => field("user", e.target.value)} />
        </WorkspaceFormField>
        <WorkspaceFormField
          label={passwordRequired ? "Password" : "New password (optional)"}
          required={passwordRequired}
        >
          <Input
            type="text"
            value={value.password ?? ""}
            onChange={(e) => field("password", e.target.value)}
          />
        </WorkspaceFormField>
      </WorkspaceFormGrid>
    </section>
  );
}
function validDatabase(value: DatabaseSettings, editing: boolean) {
  return Boolean(
    value.host && value.port && value.database && value.user && (editing || value.password)
  );
}
function position(value: DatabaseSettings) {
  return `${value.host}:${value.port}/${value.database}`;
}
function capitalize(value: string) {
  return value[0]?.toUpperCase() + value.slice(1);
}
function tone(status: string) {
  return status === "completed" || status === "ready"
    ? "success"
    : status === "failed"
      ? "danger"
      : status === "running"
        ? "info"
        : "warning";
}
