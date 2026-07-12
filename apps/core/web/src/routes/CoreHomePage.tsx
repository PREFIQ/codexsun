import { Link } from "@tanstack/react-router";
import { Button, Card, StatusBadge } from "@codexsun/ui";
import { PageTitle } from "../shared/document/PageTitle";

export function CoreHomePage() {
  return (
    <main className="core-shell">
      <PageTitle title="Core" />
      <section className="core-hero">
        <div>
          <StatusBadge tone="blue">Core</StatusBadge>
          <h1>CODEXSUN Core</h1>
          <p>Shared master data and foundation services for apps built on the CODEXSUN platform.</p>
        </div>
        <Button asChild>
          <Link to="/core/common/location/countries">Open location masters</Link>
        </Button>
      </section>

      <section className="core-grid">
        <Card className="core-card">
          <span>First Module</span>
          <strong>Location</strong>
          <p>Country, state, district, city, and pincode masters with tenant-aware records.</p>
        </Card>
        <Card className="core-card">
          <span>API</span>
          <strong>Core API</strong>
          <p>
            Available at the configured core API endpoint with `/core/common/location/*` endpoints.
          </p>
        </Card>
      </section>
    </main>
  );
}
