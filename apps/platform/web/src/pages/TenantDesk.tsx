import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button, TenantLayout } from "@codexsun/ui";
import { AuthGate } from "../components/AuthGate";
import { logout } from "../api";
import { ContactListPage } from "./tenant/ContactListPage";
import { ComingSoonPage } from "./tenant/ComingSoonPage";

type TenantPage =
  | { view: "home" }
  | { view: "contacts" }
  | { view: "item-categories" }
  | { view: "units" }
  | { view: "tax-categories" };

export function TenantDesk() {
  const navigate = useNavigate();
  const [page, setPage] = useState<TenantPage>({ view: "home" });

  async function handleLogout() {
    await logout("tenant");
    await navigate({ to: "/login" });
  }

  const navItems: Array<{ view: TenantPage; label: string }> = [
    { view: { view: "home" }, label: "Dashboard" },
    { view: { view: "contacts" }, label: "Contacts" },
    { view: { view: "item-categories" }, label: "Item Categories" },
    { view: { view: "units" }, label: "Units" },
    { view: { view: "tax-categories" }, label: "Tax Categories" },
  ];

  function renderPage() {
    switch (page.view) {
      case "contacts":
        return (
          <ContactListPage onBack={() => setPage({ view: "home" })} />
        );
      case "item-categories":
        return (
          <ComingSoonPage
            title="Item Categories"
            description="Product and service category definitions."
            onBack={() => setPage({ view: "home" })}
          />
        );
      case "units":
        return (
          <ComingSoonPage
            title="Units"
            description="Measurement units for items and quantities."
            onBack={() => setPage({ view: "home" })}
          />
        );
      case "tax-categories":
        return (
          <ComingSoonPage
            title="Tax Categories"
            description="GST rate categories for billing."
            onBack={() => setPage({ view: "home" })}
          />
        );
      default:
        return (
          <div className="desk-grid">
            <div className="rounded-lg border border-border/70 bg-card/95 p-6 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold">Welcome</h2>
              <p className="text-sm text-muted-foreground">
                Select a module from the navigation bar to get started.
              </p>
            </div>
          </div>
        );
    }
  }

  return (
    <AuthGate desk="tenant">
      <TenantLayout
        actions={
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem" }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                onClick={() => setPage(item.view)}
                variant={page.view === item.view.view ? "default" : "ghost"}
                size="sm"
              >
                {item.label}
              </Button>
            ))}
            <Button onClick={handleLogout} variant="secondary" size="sm">Log out</Button>
          </div>
        }
      >
        {renderPage()}
      </TenantLayout>
    </AuthGate>
  );
}
