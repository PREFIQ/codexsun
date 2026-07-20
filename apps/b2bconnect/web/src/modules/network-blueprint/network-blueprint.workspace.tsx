import { BadgeCheck, Building2, MessageCircle, Network, ShieldCheck } from "lucide-react";
import { useNetworkBlueprint } from "./network-blueprint.hooks";

export function NetworkBlueprintWorkspace() {
  const { blueprint, status } = useNetworkBlueprint();
  if (status === "loading")
    return (
      <p className="rounded-xl border p-5 text-sm text-muted-foreground">
        Loading operating-system blueprint…
      </p>
    );
  if (!blueprint)
    return (
      <p className="rounded-xl border border-destructive/30 p-5 text-sm text-destructive">
        Blueprint API unavailable.
      </p>
    );
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
          Platform positioning
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{blueprint.positioning.primary}</h2>
        <p className="mt-1 text-muted-foreground">{blueprint.positioning.secondary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {blueprint.positioning.reject.map((item) => (
            <span
              className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700 line-through"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        {blueprint.capabilities.map((capability) => (
          <article className="rounded-xl border bg-card p-4" key={capability.key}>
            <div className="flex items-center justify-between">
              <Network className="size-5 text-primary" />
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${capability.stage === "active" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}`}
              >
                {capability.stage}
              </span>
            </div>
            <h3 className="mt-3 font-semibold">{capability.name}</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{capability.description}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border bg-card p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Building2 className="size-5 text-orange-500" />
            Association hubs
          </h3>
          <div className="mt-4 space-y-3">
            {blueprint.associations.map((association) => (
              <div className="rounded-md bg-muted/40 p-3" key={association.code}>
                <strong className="text-sm">{association.name}</strong>
                <p className="mt-1 text-xs text-muted-foreground">{association.description}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-xl border bg-card p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <MessageCircle className="size-5 text-emerald-500" />
            WhatsApp-first rules
          </h3>
          <div className="mt-4 space-y-3">
            {blueprint.whatsapp.map((item) => (
              <div className="flex gap-3" key={item.name}>
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <div>
                  <strong className="text-sm">{item.name}</strong>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
      <section className="rounded-xl border bg-slate-950 p-5 text-white">
        <h3 className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-5 text-violet-300" />
          Role ownership
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {blueprint.roles.map((role) => (
            <div key={role.role}>
              <strong className="text-sm capitalize">{role.role.replace("_", " ")}</strong>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {role.responsibilities.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
