import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import type { MigrationWorkflow } from "./migration-projects.types";

export function MigrationProjectsList({ workflow }: { workflow: MigrationWorkflow }) {
  return (
    <section className="rounded-md border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Approval-gated workflow</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {workflow.stages.map((stage, index) => (
          <div className="rounded-md border p-4" key={stage.key}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              {index === 0 ? (
                <CheckCircle2Icon className="size-4 text-primary" />
              ) : (
                <CircleIcon className="size-4 text-muted-foreground" />
              )}
              {index + 1}. {stage.label}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{stage.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
