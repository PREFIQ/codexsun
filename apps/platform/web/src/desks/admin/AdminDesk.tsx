import { useState } from "react";
import { Building2Icon, ClipboardCheckIcon, LifeBuoyIcon } from "lucide-react";
import { AdminLayout, Button, Card, StatusBadge } from "@codexsun/ui";
import { AuthGate } from "../../shared/auth/AuthGate";
import { logout } from "../../shared/api/platform-api";

type AdminPage = "dashboard" | "tenant-support" | "activation";

export function AdminDesk() {
  const [page, setPage] = useState<AdminPage>("dashboard");

  async function handleLogout() {
    await logout("admin");
    window.location.href = "/admin/login";
  }

  return (
    <AuthGate desk="admin">
      <AdminLayout
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant={page === "dashboard" ? "default" : "ghost"} onClick={() => setPage("dashboard")}>Dashboard</Button>
            <Button size="sm" variant={page === "tenant-support" ? "default" : "ghost"} onClick={() => setPage("tenant-support")}>Tenant Support</Button>
            <Button size="sm" variant={page === "activation" ? "default" : "ghost"} onClick={() => setPage("activation")}>Activation</Button>
            <Button size="sm" variant="secondary" onClick={handleLogout}>Log out</Button>
          </div>
        }
      >
        <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-4 py-5 lg:w-[calc(100%-3rem)]">
          {page === "dashboard" ? (
            <div className="grid gap-4 md:grid-cols-3">
              <AdminCard title="Tenant Support" icon={Building2Icon} text="Review tenant status and route setup requests." />
              <AdminCard title="Activation Review" icon={ClipboardCheckIcon} text="Approve feature and module activation changes." />
              <AdminCard title="Helpdesk" icon={LifeBuoyIcon} text="Track support operations from the staff desk." />
            </div>
          ) : null}
          {page === "tenant-support" ? <Card title="Tenant Support" description="Operational tenant assistance."><StatusBadge tone="green">Ready</StatusBadge></Card> : null}
          {page === "activation" ? <Card title="Activation Review" description="Module activation review."><StatusBadge tone="green">Ready</StatusBadge></Card> : null}
        </main>
      </AdminLayout>
    </AuthGate>
  );
}

function AdminCard({ icon: Icon, text, title }: { icon: typeof Building2Icon; text: string; title: string }) {
  return (
    <Card title={title} description={text}>
      <Icon className="size-5 text-muted-foreground" />
    </Card>
  );
}
