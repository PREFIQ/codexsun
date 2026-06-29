import { useQuery } from "@tanstack/react-query"
import { Button, Card, StatusBadge } from "@codexsun/ui"
import { apiGet } from "../../api"

type MigrationRow = { id: string; applied_at: string }

export function MigrationStatus({ onBack }: { onBack: () => void }) {
  const { data: migrations } = useQuery<MigrationRow[]>({
    queryKey: ["admin", "migrations"],
    queryFn: () => apiGet<MigrationRow[]>("/admin/migrations", "sa")
  })

  return (
    <div className="desk-grid" style={{ maxWidth: "960px", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Migration Status</h2>
      </div>
      <Card title="Platform Migrations" description="Applied master database migrations">
        {migrations && migrations.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            {migrations.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--cx-border)", paddingBottom: "0.5rem" }}>
                <div>
                  <strong style={{ fontSize: "0.9rem" }}>{m.id}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <StatusBadge tone="green">Applied</StatusBadge>
                  <span style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>{new Date(m.applied_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <p>No migrations found.</p>}
      </Card>
    </div>
  )
}
