import { Button, Input } from "@codexsun/ui";

export function MigrationProjectsForm() {
  return (
    <section className="rounded-md border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">New migration project</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connection secrets will be accepted only by the backend vault adapter in the
            implementation phase.
          </p>
        </div>
        <Button disabled>Save draft</Button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Project label <span className="text-destructive">*</span>
          <Input className="mt-2" disabled placeholder="Client legacy system migration" />
        </label>
        <label className="text-sm font-medium">
          Tenant ID <span className="text-destructive">*</span>
          <Input className="mt-2" disabled placeholder="Select an approved tenant" />
        </label>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Draft creation is intentionally disabled until persistence, permissions, encrypted secrets,
        and audit storage are approved.
      </p>
    </section>
  );
}
