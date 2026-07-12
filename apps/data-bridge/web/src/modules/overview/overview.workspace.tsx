import { useEffect, useState } from "react";

const apiUrl = import.meta.env.VITE_DATA_BRIDGE_API_URL ?? "http://127.0.0.1:7090";

type ApiStatus = "checking" | "online" | "offline";

export function OverviewWorkspace() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    let active = true;

    async function checkApi() {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5_000);
      try {
        const response = await fetch(`${apiUrl}/health`, {
          cache: "no-store",
          signal: controller.signal
        });
        if (active) setApiStatus(response.ok ? "online" : "offline");
      } catch {
        if (active) setApiStatus("offline");
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void checkApi();
    const interval = window.setInterval(() => void checkApi(), 10_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const statusStyles = {
    checking: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    online: "border-emerald-500 bg-white text-emerald-700 shadow-sm dark:bg-white dark:text-emerald-700",
    offline: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
  }[apiStatus];
  const dotStyles = {
    checking: "bg-amber-500",
    online: "bg-emerald-500",
    offline: "bg-red-500"
  }[apiStatus];

  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] py-5 lg:w-[calc(100%-3rem)]">
      <section className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.22)_0%,rgba(139,92,246,0.10)_24%,transparent_58%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">Data Bridge</p>
            <h1 className="mt-2 text-3xl font-semibold">Overview</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Monitor Data Bridge availability and manage secure data operations between source
              systems and CODEXSUN from one controlled workspace.
            </p>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${statusStyles}`}
            >
              <span className={`size-2 rounded-full ${dotStyles}`} aria-hidden="true" />
              <span>
                {apiStatus === "checking"
                  ? "Checking API"
                  : apiStatus === "online"
                    ? "API Online"
                    : "API Offline"}
              </span>
            </div>
            <p className="mt-1.5 text-xs font-medium text-foreground">{apiUrl}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
