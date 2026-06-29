import { useState } from "react";
import { AdminLayout, Card, StatusBadge, Button } from "@codexsun/ui";
import { AuthGate } from "../components/AuthGate";
import { useNavigate } from "@tanstack/react-router";
import { logout } from "../api";

type AdminPage = "dashboard" | "queue" | "activation" | "support";

export function AdminDesk() {
  const navigate = useNavigate();
  const [page, setPage] = useState<AdminPage>("dashboard");

  async function handleLogout() {
    await logout("admin");
    await navigate({ to: "/admin/login" });
  }

  const navItems: Array<{ page: AdminPage; label: string }> = [
    { page: "dashboard", label: "Dashboard" },
    { page: "queue", label: "Support Queue" },
    { page: "activation", label: "Activation Review" },
    { page: "support", label: "Helpdesk" },
  ];

  return (
    <AuthGate desk="admin">
      <AdminLayout
        actions={
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem" }}>
            {navItems.map((item) => (
              <Button
                key={item.page}
                onClick={() => setPage(item.page)}
                variant={page === item.page ? "default" : "ghost"}
                size="sm"
              >
                {item.label}
              </Button>
            ))}
            <Button onClick={handleLogout} variant="secondary" size="sm">Log out</Button>
          </div>
        }
      >
        {page === "dashboard" && (
          <div className="desk-grid">
            <Card title="Staff Dashboard" description="Operational overview for platform staff">
              <p>Monitor tenant activity, review support tickets, and manage platform operations from this desk.</p>
            </Card>
            <Card title="Platform Status" description="System health and metrics">
              <StatusBadge tone="green">All Systems Operational</StatusBadge>
            </Card>
          </div>
        )}
        {page === "queue" && (
          <div className="desk-grid">
            <Card title="Support Queue" description="Prepared for tenant operations">
              <StatusBadge tone="amber">Scaffold</StatusBadge>
              <p>Support tickets, failed jobs, and tenant health views will build from this desk.</p>
            </Card>
          </div>
        )}
        {page === "activation" && (
          <div className="desk-grid">
            <Card title="Activation Review" description="Subscription and feature change approval">
              <p>High-risk activation changes belong here with approval and audit history.</p>
            </Card>
          </div>
        )}
        {page === "support" && (
          <div className="desk-grid">
            <Card title="Helpdesk" description="Tenant support and issue tracking">
              <StatusBadge tone="amber">Coming Soon</StatusBadge>
              <p>Tenant issue management and escalation workflows will be available here.</p>
            </Card>
          </div>
        )}
      </AdminLayout>
    </AuthGate>
  );
}
