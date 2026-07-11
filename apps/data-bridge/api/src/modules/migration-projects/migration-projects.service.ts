import type {
  MigrationGateInput,
  MigrationProjectStatus,
  MigrationWorkflow
} from "./migration-projects.types.js";

export class MigrationProjectsService {
  getWorkflow(): MigrationWorkflow {
    return {
      modules: [
        {
          key: "overview",
          label: "Overview",
          description: "Portfolio status, readiness, risks, and recent controlled activity.",
          executionCapability: false
        },
        {
          key: "migration-projects",
          label: "Migration Projects",
          description:
            "Tenant-scoped migration case, ownership, source system, target release, and lifecycle.",
          executionCapability: false
        },
        {
          key: "connections",
          label: "Connections & Secrets",
          description:
            "Read-only source connections and target connections backed by encrypted server-side secrets.",
          executionCapability: false
        },
        {
          key: "discovery",
          label: "Discovery Snapshots",
          description:
            "Immutable database, table, column, key, relationship, volume, and sensitivity metadata.",
          executionCapability: false
        },
        {
          key: "schema-comparison",
          label: "Schema Comparison",
          description:
            "Source-to-target structural gaps, compatibility findings, DDL plan, and rollback notes.",
          executionCapability: false
        },
        {
          key: "mappings",
          label: "Mappings & Transforms",
          description:
            "Table, column, relationship, default, normalization, validation, and redaction rules.",
          executionCapability: false
        },
        {
          key: "approvals",
          label: "Review & Approvals",
          description:
            "Dry-run evidence, risk decisions, immutable checksum, approval reference, and separation of duties.",
          executionCapability: false
        },
        {
          key: "execution-runs",
          label: "Execution Runs",
          description:
            "Idempotent schema and data jobs with batches, checkpoints, retries, rejects, and cancellation.",
          executionCapability: true
        },
        {
          key: "reconciliation",
          label: "Reconciliation & Audit",
          description:
            "Counts, hashes, financial controls, rejects, exceptions, sign-off, and retained audit evidence.",
          executionCapability: false
        }
      ],
      guardrails: {
        approvalRequired: true,
        credentialsReturnedToClient: false,
        dryRunRequired: true,
        executionEnabled: false,
        tenantContextRequired: true
      },
      stages: [
        {
          key: "discover",
          label: "Discover",
          description: "Inspect source and target metadata without copying business rows."
        },
        {
          key: "map",
          label: "Map",
          description: "Map schemas, tables, columns, keys, and transformation rules."
        },
        {
          key: "review",
          label: "Review",
          description: "Review gaps, blockers, row counts, risks, and the dry-run report."
        },
        {
          key: "approved",
          label: "Approve",
          description: "Record an explicit approval reference and immutable plan checksum."
        },
        {
          key: "execute",
          label: "Execute",
          description: "Run an idempotent, checkpointed migration after all gates pass."
        },
        {
          key: "reconcile",
          label: "Reconcile",
          description: "Verify counts, hashes, rejected rows, audit events, and sign-off."
        }
      ],
      tracks: [
        {
          key: "schema",
          label: "Schema Upgrade",
          description:
            "Compare source and CODEXSUN schemas, map gaps, approve DDL, migrate, then verify."
        },
        {
          key: "data",
          label: "Data Transfer",
          description:
            "Profile tables, map fields, approve transforms, transfer in batches, then reconcile."
        }
      ]
    };
  }

  assertExecutionGate(input: MigrationGateInput) {
    const failures: string[] = [];
    if (input.status !== "approved") failures.push("Project status must be approved.");
    if (!input.tenantId?.trim()) failures.push("Tenant context is required.");
    if (!input.approvalReference?.trim()) failures.push("Approval reference is required.");
    if (!input.planChecksum?.trim()) failures.push("Immutable plan checksum is required.");
    if (!input.dryRunPassed) failures.push("A successful dry run is required.");
    return { allowed: failures.length === 0, failures };
  }

  allowedTransitions(status: MigrationProjectStatus): MigrationProjectStatus[] {
    const transitions: Record<MigrationProjectStatus, MigrationProjectStatus[]> = {
      draft: ["discovered", "blocked"],
      discovered: ["mapped", "blocked"],
      mapped: ["in-review", "blocked"],
      "in-review": ["approved", "mapped", "blocked"],
      approved: ["running", "blocked"],
      running: ["reconciling", "blocked"],
      reconciling: ["completed", "blocked"],
      completed: [],
      blocked: ["draft", "discovered", "mapped", "in-review"]
    };
    return transitions[status];
  }
}
