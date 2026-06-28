import { Card, StatusBadge, SuperLayout } from "@codexsun/ui";
import { AuthGate } from "../components/AuthGate";

export function SaDesk() {
  return (
    <AuthGate desk="sa">
      <SuperLayout>
        <div className="desk-grid">
          <Card title="Foundation" description="Fresh scaffold status">
            <StatusBadge tone="green">Ready</StatusBadge>
            <p>Master database boot, platform migrations, and initial Super Admin seed are wired.</p>
          </Card>
          <Card title="Tenant Registry" description="First test tenant">
            <strong>test</strong>
            <p>Connected to the seeded tenant database for early local testing.</p>
          </Card>
        </div>
      </SuperLayout>
    </AuthGate>
  );
}
