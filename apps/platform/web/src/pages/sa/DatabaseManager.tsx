import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button, Card, StatusBadge } from "@codexsun/ui"
import { apiGet, apiPost } from "../../api"

type MigrationRecord = { id: string; applied_at: string }
type TenantDatabase = { id: string; tenant_id: string; database_name: string; status: string; dbStatus: string }

export function DatabaseManager({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient()

  const { data: migrations } = useQuery<MigrationRecord[]>({
    queryKey: ["admin", "migrations"],
    queryFn: () => apiGet<MigrationRecord[]>("/admin/migrations", "sa")
  })

  const { data: databases } = useQuery<TenantDatabase[]>({
    queryKey: ["admin", "databases"],
    queryFn: () => apiGet<TenantDatabase[]>("/admin/databases", "sa")
  })

  const runMigrationsMut = useMutation({
    mutationFn: () => apiPost("/admin/migrations/run", {}, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "migrations"] }) }
  })

  return (
    <div className="desk-grid" style={{ maxWidth: "960px", margin: "0 auto" }}>
      <Card title="Database Manager" description="Migration status, tenant databases, and schema management"
        action={<Button variant="secondary" size="sm" onClick={onBack}>Back</Button>}>
        <div style={{ margin: "1rem 0" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>Master Migrations</h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {migrations?.map((m) => (
              <div key={m.id} style={{ padding: "0.5rem", border: "1px solid var(--cx-border)", borderRadius: "6px", fontSize: "0.85rem" }}>
                <code>{m.id}</code>
                <div style={{ fontSize: "0.75rem", color: "var(--cx-muted)" }}>{new Date(m.applied_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <Button size="sm" style={{ marginTop: "0.5rem" }} onClick={() => runMigrationsMut.mutate()}>
            Run Pending Migrations
          </Button>
        </div>
        <div>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>Tenant Databases</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {databases?.length === 0 && <p style={{ color: "var(--cx-muted)" }}>No tenant databases found.</p>}
            {databases?.map((db) => (
              <div key={db.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", border: "1px solid var(--cx-border)", borderRadius: "6px" }}>
                <div>
                  <span style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{db.database_name}</span>
                    <span style={{ marginLeft: "0.5rem" }}><StatusBadge tone={db.status === "active" ? "green" : "red"}>{db.status}</StatusBadge></span>
                  </div>
                  <StatusBadge tone="amber">{db.dbStatus}</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
