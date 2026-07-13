import {
  DatabaseZapIcon,
  Layers3Icon,
  ReceiptTextIcon,
  ServerCogIcon,
  UtensilsIcon,
  PlayIcon,
  SquareIcon,
  RotateCcwIcon
} from "lucide-react";
import { Button, StatusBadge } from "@codexsun/ui";
import type { OrchestratedApp, OrchestratedAppId } from "./app-orchestration.types";
const icons = {
  platform: ServerCogIcon,
  core: Layers3Icon,
  billing: ReceiptTextIcon,
  "data-bridge": DatabaseZapIcon,
  "kitchen-serve": UtensilsIcon
};
export const appOperationTones: Record<
  OrchestratedAppId,
  { card: string; icon: string; metric: string }
> = {
  platform: {
    card: "border-cyan-200/80 from-cyan-100 via-sky-50 to-blue-100 hover:border-cyan-300 dark:border-cyan-800/70 dark:from-cyan-950/70 dark:via-sky-950/50 dark:to-blue-950/70",
    icon: "border-cyan-200 bg-white/70 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300",
    metric:
      "border-cyan-100 from-cyan-50/80 via-card to-blue-50/70 dark:border-cyan-900 dark:from-cyan-950/35 dark:to-blue-950/25"
  },
  core: {
    card: "border-violet-200/80 from-violet-100 via-purple-50 to-fuchsia-100 hover:border-violet-300 dark:border-violet-800/70 dark:from-violet-950/70 dark:via-purple-950/50 dark:to-fuchsia-950/70",
    icon: "border-violet-200 bg-white/70 text-violet-700 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-300",
    metric:
      "border-violet-100 from-violet-50/80 via-card to-fuchsia-50/70 dark:border-violet-900 dark:from-violet-950/35 dark:to-fuchsia-950/25"
  },
  billing: {
    card: "border-amber-200/80 from-amber-100 via-yellow-50 to-orange-100 hover:border-amber-300 dark:border-amber-800/70 dark:from-amber-950/70 dark:via-yellow-950/50 dark:to-orange-950/70",
    icon: "border-amber-200 bg-white/70 text-amber-700 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
    metric:
      "border-amber-100 from-amber-50/80 via-card to-orange-50/70 dark:border-amber-900 dark:from-amber-950/35 dark:to-orange-950/25"
  },
  "data-bridge": {
    card: "border-emerald-200/80 from-emerald-100 via-green-50 to-teal-100 hover:border-emerald-300 dark:border-emerald-800/70 dark:from-emerald-950/70 dark:via-green-950/50 dark:to-teal-950/70",
    icon: "border-emerald-200 bg-white/70 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
    metric:
      "border-emerald-100 from-emerald-50/80 via-card to-teal-50/70 dark:border-emerald-900 dark:from-emerald-950/35 dark:to-teal-950/25"
  },
  "kitchen-serve": {
    card: "border-orange-200/80 from-orange-100 via-amber-50 to-lime-100 hover:border-orange-300 dark:border-orange-800/70 dark:from-orange-950/70 dark:via-amber-950/50 dark:to-lime-950/70",
    icon: "border-orange-200 bg-white/70 text-orange-700 dark:border-orange-800 dark:bg-orange-950/70 dark:text-orange-300",
    metric:
      "border-orange-100 from-orange-50/80 via-card to-lime-50/70 dark:border-orange-900 dark:from-orange-950/35 dark:to-lime-950/25"
  }
};
export function AppOperationsStrip({
  apps,
  onSelect
}: {
  apps: OrchestratedApp[];
  onSelect: (id: OrchestratedAppId) => void;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {apps.map((app) => {
          const Icon = icons[app.id];
          const tone = appOperationTones[app.id];
          return (
            <button
              className={`relative flex min-h-32 min-w-0 items-center gap-4 overflow-hidden rounded-lg border bg-gradient-to-br p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${tone.card}`}
              key={app.id}
              onClick={() => onSelect(app.id)}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-12 -right-10 size-28 rounded-full bg-white/80 blur-2xl dark:bg-white/15"
              />
              <div
                className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-lg border shadow-sm ${tone.icon}`}
              >
                <Icon className="size-6" />
              </div>
              <div className="relative z-10 min-w-0 flex-1">
                <div className="truncate font-semibold">{app.label}</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {app.services.filter((item) => item.online).length}/{app.services.length}{" "}
                    services
                  </span>
                  <StatusBadge
                    tone={
                      app.status === "online" ? "green" : app.status === "partial" ? "amber" : "red"
                    }
                  >
                    {app.status}
                  </StatusBadge>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
export function AppServiceList({
  app,
  busy,
  onRestart,
  onStart,
  onStop
}: {
  app: OrchestratedApp;
  busy: boolean;
  onRestart: (serviceId: "api" | "web") => void;
  onStart: (serviceId: "api" | "web") => void;
  onStop: (serviceId: "api" | "web") => void;
}) {
  return (
    <section className="rounded-md border bg-card shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-semibold">Services</h2>
      </div>
      <div className="divide-y">
        {app.services.map((service) => (
          <div
            className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary/[0.06] via-card to-card px-5 py-4"
            key={service.port}
          >
            <div>
              <div className="font-medium">{service.label}</div>
              <div className="text-sm text-muted-foreground">127.0.0.1:{service.port}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !app.managed || service.online}
                  onClick={() => onStart(service.id)}
                >
                  <PlayIcon className="size-3.5" />
                  Start
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !app.managed || service.managedPid === null}
                  onClick={() => onStop(service.id)}
                >
                  <SquareIcon className="size-3.5" />
                  Stop
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !app.managed || service.managedPid === null}
                  onClick={() => onRestart(service.id)}
                >
                  <RotateCcwIcon className="size-3.5" />
                  Restart
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                {service.responseMs === null ? "—" : `${service.responseMs} ms`}
              </span>
              <StatusBadge tone={service.online ? "green" : "red"}>
                {service.online ? "online" : "offline"}
              </StatusBadge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
