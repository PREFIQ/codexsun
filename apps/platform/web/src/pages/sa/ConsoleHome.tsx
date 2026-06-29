import { useQuery } from "@tanstack/react-query"
import { Card } from "@codexsun/ui"
import { apiGet } from "../../api"

type ConsoleData = {
  tenants: { total: number; active: number; suspended: number }
  enabledModules: number
  recentAudits: number
  migrations: number
  dbStatus: { masterDatabase: string; ready: boolean }
}

export function ConsoleHome({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { data } = useQuery<ConsoleData>({
    queryKey: ["admin", "console"],
    queryFn: () => apiGet<ConsoleData>("/admin/console", "sa")
  })

  const stats = [
    { label: "Total Tenants", value: data?.tenants.total ?? 0, page: "tenants" },
    { label: "Active Tenants", value: data?.tenants.active ?? 0, page: "tenants" },
    { label: "Suspended Tenants", value: data?.tenants.suspended ?? 0, page: "tenants" },
    { label: "Enabled Modules", value: data?.enabledModules ?? 0, page: "modules" },
    { label: "Recent Audits (24h)", value: data?.recentAudits ?? 0, page: "audit" },
    { label: "Migrations", value: data?.migrations ?? 0, page: "migrations" },
  ]

  return (
    <div className="desk-grid" style={{ maxWidth: "960px", margin: "0 auto" }}>
      <Card title="Platform Console" description="Super admin operational overview">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", padding: "1rem 0" }}>
          {stats.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onNavigate(s.page)}
              style={{
                border: "1px solid var(--cx-border)",
                borderRadius: "8px",
                padding: "1.25rem",
                textAlign: "left",
                cursor: "pointer",
                background: "var(--cx-card)",
              }}
            >
              <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--cx-muted)", marginTop: "0.25rem" }}>{s.label}</div>
            </button>
          ))}
        </div>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
        {[
          { label: "Tenant Registry", page: "tenants" },
          { label: "Module Activation", page: "modules" },
          { label: "Audit Viewer", page: "audit" },
          { label: "Migration Status", page: "migrations" },
          { label: "System Health", page: "health" },
          { label: "Platform Users", page: "users" },
          { label: "Roles & Permissions", page: "roles" },
          { label: "Active Sessions", page: "sessions" },
        ].map((link) => (
          <button
            key={link.page}
            type="button"
            onClick={() => onNavigate(link.page)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem 1rem",
              border: "1px solid var(--cx-border)",
              borderRadius: "8px",
              cursor: "pointer",
              background: "var(--cx-card)",
              fontSize: "0.9rem",
            }}
          >
            <span>{link.label}</span>
            <span style={{ color: "var(--cx-muted)" }}>&rarr;</span>
          </button>
        ))}
      </div>
    </div>
  )
}
