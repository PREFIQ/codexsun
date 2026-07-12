# Data Bridge

Data Bridge is the Super Admin application for controlled legacy database adoption, schema upgrades, and tenant-scoped data transfer into CODEXSUN.

## Pipelines

Schema upgrades follow: discover source and target schemas, compare gaps, map changes, review a dry run, record approval, apply DDL, and verify the resulting schema.

Data transfers follow: profile databases and tables, map columns and relationships, define transformations, review counts and risks, record approval, transfer in checkpointed batches, and reconcile counts, hashes, rejects, and audit events.

## Module Boundaries

| Module                 | Ownership                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------ |
| Overview               | Portfolio readiness, risks, blocked work, and recent audited activity                |
| Migration Projects     | Tenant-scoped case, source product, target release, owners, and lifecycle            |
| Connections & Secrets  | Adapter configuration and encrypted secret references; never raw browser credentials |
| Discovery Snapshots    | Immutable structural, volume, relationship, and sensitivity metadata                 |
| Schema Comparison      | Compatibility findings, ordered DDL plan, recovery notes, and dry-run evidence       |
| Mappings & Transforms  | Table/column mappings, defaults, normalization, validation, redaction, and rejects   |
| Review & Approvals     | Separation of duties, risk decisions, approval reference, and immutable checksum     |
| Execution Runs         | Idempotent jobs, batches, checkpoints, retries, pause/cancel/resume, and quarantine  |
| Reconciliation & Audit | Counts, hashes, financial controls, exceptions, client sign-off, and audit export    |

Migration Projects is the orchestration aggregate. Other modules own their records and publish immutable evidence back to the project. No adapter may bypass the approval gate or write directly into another module's storage.

## Safety Contract

- Every project and job requires explicit tenant context.
- Database credentials remain server-side and must use an encrypted secret provider.
- Discovery reads metadata before any business rows are sampled.
- Schema and data writes require a successful dry run, approval reference, and immutable plan checksum.
- Execution workers must be idempotent, checkpointed, resumable, rate-limited, and fully audited.
- Logs and API responses must redact credentials and configured sensitive columns.
- Source databases are read-only unless an approved adapter explicitly requires otherwise.
- Reconciliation and customer sign-off are required before completion.

## Locked Existing-Record Policy

- If a Source record already exists in Target, the affected table stops immediately.
- Existing Target records are never inserted over or overwritten automatically.
- Every conflict requires an individual `override` or `reject` decision.
- Each decision requires the conflict reference, Source and Target record references, actor, reason, and timestamp.
- Every decision must produce an immutable audit entry.
- A stopped table can resume only after all conflicts have decisions, the query plan remains approved, and its checksum is unchanged.

## Scaffold State

The first scaffold supplies a dedicated API and web bundle, workflow contract, Super Admin navigation, and locked UI. Persistence, connection adapters, encrypted secrets, permission policies, schema diff engines, transformation runners, and execution workers intentionally remain disabled until their contracts are reviewed and approved.

Runtime ports:

- API: `7090`
- Web: `7100`

Start only this bundle with `node tools/dev-stack.mjs data-bridge`. It is not part of the default platform stack, so it adds no normal development load.
