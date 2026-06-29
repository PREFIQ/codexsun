import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button, Card, StatusBadge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Input, Label } from "@codexsun/ui"
import { apiGet, apiPost, apiPut } from "../../api"

type Tenant = { id: string; tenantCode: string; tenantName: string; status: string }

const STATUS_OPTIONS = ["active", "inactive", "suspended"]

export function TenantList({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Tenant | null>(null)
  const [suspending, setSuspending] = useState<Tenant | null>(null)

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["admin", "tenants"],
    queryFn: () => apiGet<Tenant[]>("/admin/tenants", "sa")
  })

  const createMut = useMutation({
    mutationFn: (d: { tenantCode: string; tenantName: string; status: string }) => apiPost("/admin/tenants", d, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "tenants"] }); setShowCreate(false) }
  })

  const updateMut = useMutation({
    mutationFn: (d: { id: string; tenantName?: string; status?: string }) => apiPut(`/admin/tenants/${d.id}`, d, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "tenants"] }); setEditing(null) }
  })

  const suspendMut = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/tenants/${id}/suspend`, {}, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "tenants"] }); setSuspending(null) }
  })

  const restoreMut = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/tenants/${id}/restore`, {}, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "tenants"] }) }
  })

  return (
    <div className="desk-grid" style={{ maxWidth: "960px", margin: "0 auto" }}>
      <Card
        title="Tenant Registry"
        description="Manage all registered platform tenants"
        action={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="secondary" onClick={onBack}>Back</Button>
            <Button onClick={() => setShowCreate(true)}>New Tenant</Button>
          </div>
        }
      >
        {tenants && tenants.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            {tenants.map((t) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--cx-border)", paddingBottom: "0.5rem" }}>
                <div>
                  <strong style={{ display: "block" }}>{t.tenantCode}</strong>
                  <span style={{ fontSize: "0.8125rem", color: "var(--cx-muted)" }}>{t.tenantName}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <StatusBadge tone={t.status === "active" ? "green" : t.status === "suspended" ? "red" : "amber"}>{t.status}</StatusBadge>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(t)}>Edit</Button>
                  {t.status === "active" ? (
                    <Button variant="ghost" size="sm" onClick={() => setSuspending(t)}>Suspend</Button>
                  ) : t.status === "suspended" ? (
                    <Button variant="ghost" size="sm" onClick={() => restoreMut.mutate(t.id)}>Restore</Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : <p>No tenants found.</p>}
      </Card>

      <CreateDialog open={showCreate} onClose={() => setShowCreate(false)} onSubmit={(d) => createMut.mutate(d)} loading={createMut.isPending} />
      <EditDialog tenant={editing} onClose={() => setEditing(null)} onSubmit={(d) => updateMut.mutate(d)} loading={updateMut.isPending} />
      <ConfirmDialog
        open={!!suspending} title="Suspend Tenant"
        message={`Are you sure you want to suspend ${suspending?.tenantCode}?`}
        loading={suspendMut.isPending}
        onConfirm={() => suspending && suspendMut.mutate(suspending.id)}
        onClose={() => setSuspending(null)}
      />
    </div>
  )
}

function CreateDialog({ open, onClose, onSubmit, loading }: { open: boolean; onClose: () => void; onSubmit: (d: { tenantCode: string; tenantName: string; status: string }) => void; loading: boolean }) {
  const [code, setCode] = useState(""); const [name, setName] = useState(""); const [status, setStatus] = useState("active")
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Tenant</DialogTitle><DialogDescription>Register a new platform tenant.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (code.trim() && name.trim()) onSubmit({ tenantCode: code.trim(), tenantName: name.trim(), status }); setCode(""); setName(""); setStatus("active") }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem 0" }}>
            <div><Label htmlFor="tc">Tenant Code</Label><Input id="tc" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. acme" required /></div>
            <div><Label htmlFor="tn">Tenant Name</Label><Input id="tn" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" required /></div>
            <div><Label htmlFor="ts">Status</Label>
              <select id="ts" value={status} onChange={(e) => setStatus(e.target.value)} style={{ display: "flex", height: "2.25rem", width: "100%", borderRadius: "0.375rem", border: "1px solid var(--cx-border)", background: "transparent", padding: "0 0.75rem" }}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditDialog({ tenant, onClose, onSubmit, loading }: { tenant: Tenant | null; onClose: () => void; onSubmit: (d: { id: string; tenantName?: string; status?: string }) => void; loading: boolean }) {
  const [name, setName] = useState(""); const [status, setStatus] = useState("active")
  const isOpen = !!tenant
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Tenant</DialogTitle><DialogDescription>{tenant ? `Update ${tenant.tenantCode}` : ""}</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (tenant && name.trim()) onSubmit({ id: tenant.id, tenantName: name.trim(), status }); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem 0" }}>
            <div><Label>Tenant Code</Label><Input value={tenant?.tenantCode ?? ""} disabled /></div>
            <div><Label>Tenant Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>Status</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ display: "flex", height: "2.25rem", width: "100%", borderRadius: "0.375rem", border: "1px solid var(--cx-border)", background: "transparent", padding: "0 0.75rem" }}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmDialog({ open, title, message, loading, onConfirm, onClose }: { open: boolean; title: string; message: string; loading: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{message}</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={onConfirm} disabled={loading}>{loading ? "Processing..." : "Confirm"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
