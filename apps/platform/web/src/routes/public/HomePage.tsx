import { useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon, Building2Icon, MonitorCogIcon, ShieldCheckIcon, StoreIcon } from "lucide-react";
import { Button, Card, StatusBadge } from "@codexsun/ui";

const deskLinks = [
  {
    description: "Tenant application workspace.",
    href: "/login",
    icon: StoreIcon,
    title: "Application"
  },
  {
    description: "Staff operations workspace.",
    href: "/admin/login",
    icon: Building2Icon,
    title: "Admin"
  },
  {
    description: "Platform owner workspace.",
    href: "/sa/login",
    icon: ShieldCheckIcon,
    title: "Super Admin"
  }
] as const;

export function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button className="flex items-center gap-3" onClick={() => navigate({ to: "/" })} type="button">
            <img alt="Codexsun" className="size-8" src="/logo/logo.svg" />
            <span className="text-sm font-semibold">Codexsun</span>
          </button>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate({ to: "/status" })} variant="outline">
              <MonitorCogIcon className="size-4" />
              Status
            </Button>
            <Button onClick={() => navigate({ to: "/login" })}>
              Sign in
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-md border border-border bg-card p-6 shadow-sm">
          <StatusBadge tone="green">Platform</StatusBadge>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal">Codexsun Platform</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Platform shell for tenant management, admin operations, and tenant application access.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {deskLinks.map((desk) => (
            <Card key={desk.title} title={desk.title} description={desk.description}>
              <desk.icon className="size-5 text-muted-foreground" />
              <Button className="mt-5 w-full justify-between" onClick={() => navigate({ to: desk.href })} variant="outline">
                Open
                <ArrowRightIcon className="size-4" />
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
