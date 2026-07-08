# Database Backup Runbook

## Purpose

Use this runbook to create, verify, and restore CODEXSUN platform and tenant database backups.

## Backup Schedule

| Backup type | Frequency | Retention |
| --- | --- | --- |
| Platform full backup | Daily | 30 days |
| Tenant full backup | Daily | 30 days |
| High-volume tenant incremental or PITR | 15 minutes to 1 hour | 7 to 30 days |
| File storage backup | Daily | 30 days |
| Pre-migration backup | Before every production migration | Through rollback window |
| Monthly archive backup | Monthly | 1 year or compliance policy |

## Restore Test

1. Choose a backup artifact.
2. Restore it into a sandbox database, never a live platform or tenant database.
3. Set `CODEXSUN_RESTORE_TEST_DB_NAME` to the sandbox database name.
4. Run `npm run db:restore:test`.
5. Validate row counts, login-critical records, tenant registry records, and affected module totals.
6. Set `CODEXSUN_BACKUP_VERIFY_ID` to the backup artifact or run id.
7. Run `npm run db:backup:verify`.

## Safety Rules

- Encrypt dumps at rest.
- Restrict backup and dump download access to approved operators.
- Audit backup creation, download, restore, verification, and deletion.
- Keep tenant restores isolated from other tenants.
- Do not mark a backup verified until a sandbox restore succeeds.
