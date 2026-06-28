import { AdminLayout, Card, StatusBadge } from "@codexsun/ui";
import { AuthGate } from "../components/AuthGate";

export function AdminDesk() {
  return (
    <AuthGate desk="admin">
      <AdminLayout>
        <div className="desk-grid">
          <Card title="Support Queue" description="Prepared for tenant operations">
            <StatusBadge tone="amber">Scaffold</StatusBadge>
            <p>Support tickets, failed jobs, and tenant health views will build from this desk.</p>
          </Card>
          <Card title="Activation Review" description="Future subscription and feature control">
            <p>High-risk activation changes belong here with approval and audit history.</p>
          </Card>
        </div>
      </AdminLayout>
    </AuthGate>
  );
}
