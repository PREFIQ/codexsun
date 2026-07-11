import {
  AlertTriangleIcon,
  DatabaseIcon,
  GitCompareArrowsIcon,
  LockKeyholeIcon
} from "lucide-react";
import { StatusBadge } from "@codexsun/ui";
import { useMigrationWorkflow } from "./migration-projects.hooks";
import { MigrationProjectsForm } from "./migration-projects.form";
import { MigrationProjectsList } from "./migration-projects.list";
import type { MigrationWorkflow } from "./migration-projects.types";

export function MigrationProjectsWorkspace({ page = "overview" }: { page?: string }) {
  const query = useMigrationWorkflow();
  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-5 lg:w-[calc(100%-3rem)]">
      {query.isError ? (
        <section className="rounded-md border border-destructive/40 bg-card p-4 text-sm">
          <AlertTriangleIcon className="mr-2 inline size-4" />
          Data Bridge API is unavailable. Start the Data Bridge stack on ports 7090 and 7100.
        </section>
      ) : null}
      {query.data ? (
        <>
          {page === "overview" ? (
            <Overview workflow={query.data} />
          ) : (
            <ModuleWorkspace moduleKey={page} workflow={query.data} />
          )}
          {page === "migration-projects" ? <MigrationProjectsForm /> : null}
        </>
      ) : !query.isError ? (
        <section className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          Loading controlled migration workflow...
        </section>
      ) : null}
    </main>
  );
}

function Overview({ workflow }: { workflow: MigrationWorkflow }) {
  return (
    <>
      <section className="rounded-md border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">
              Super Admin · Data Bridge
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Database migration control</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Discover legacy databases, compare schemas, map fields, obtain approval, transfer
              safely, and reconcile every row.
            </p>
          </div>
          <StatusBadge tone="amber">Foundation · execution locked</StatusBadge>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {workflow.tracks.map((track) => (
          <section className="rounded-md border bg-card p-5 shadow-sm" key={track.key}>
            {track.key === "schema" ? (
              <GitCompareArrowsIcon className="size-5 text-primary" />
            ) : (
              <DatabaseIcon className="size-5 text-primary" />
            )}
            <h2 className="mt-4 text-lg font-semibold">{track.label}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{track.description}</p>
          </section>
        ))}
      </div>
      <MigrationProjectsList workflow={workflow} />
      <section className="rounded-md border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <LockKeyholeIcon className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Non-negotiable controls</h2>
        </div>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <p>• Tenant context on every operation</p>
          <p>• Explicit approval plus plan checksum</p>
          <p>• Dry run before schema or data writes</p>
          <p>• Credentials never returned to the browser</p>
          <p>• Batch checkpoints and idempotent retries</p>
          <p>• Counts, hashes, rejects, and audit reconciliation</p>
        </div>
      </section>
    </>
  );
}

function ModuleWorkspace({
  moduleKey,
  workflow
}: {
  moduleKey: string;
  workflow: MigrationWorkflow;
}) {
  const module = workflow.modules.find((item) => item.key === moduleKey) ?? workflow.modules[0];
  if (!module) return null;
  const controls: Record<string, string[]> = {
    "migration-projects": [
      "Tenant and client ownership",
      "Source product and version",
      "Target CODEXSUN release",
      "Project owner and reviewers"
    ],
    connections: [
      "Encrypted server-side secret reference",
      "Read-only source account",
      "Connectivity test with redacted errors",
      "Rotation and revocation history"
    ],
    discovery: [
      "Database and schema inventory",
      "Tables, columns, keys, and relationships",
      "Row counts and size estimates",
      "Sensitive-field classification"
    ],
    "schema-comparison": [
      "Missing and incompatible structures",
      "Ordered DDL dry-run plan",
      "Index and constraint impact",
      "Rollback and recovery notes"
    ],
    mappings: [
      "Table and column mappings",
      "Defaults and normalization",
      "Relationship and sequence handling",
      "Validation, redaction, and reject rules"
    ],
    approvals: [
      "Dry-run evidence",
      "Risk and exception decisions",
      "Immutable plan checksum",
      "Independent approval reference"
    ],
    "execution-runs": [
      "Idempotency and checkpoints",
      "Batch limits and retries",
      "Pause, cancel, and resume",
      "Reject quarantine without payload leakage"
    ],
    reconciliation: [
      "Source/target counts and hashes",
      "Financial and document totals",
      "Rejected-row resolution",
      "Client sign-off and audit export"
    ]
  };
  return (
    <section className="rounded-md border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            Data Bridge module
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{module.label}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{module.description}</p>
        </div>
        <StatusBadge tone={module.executionCapability ? "red" : "blue"}>
          {module.executionCapability ? "Execution locked" : "Foundation ready"}
        </StatusBadge>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {(controls[module.key] ?? []).map((control) => (
          <div className="rounded-md border px-4 py-3 text-sm" key={control}>
            {control}
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-muted-foreground">
        Persistence and editable actions activate only after the module database contract,
        permission keys, audit events, and secret-storage adapter are approved.
      </p>
    </section>
  );
}
