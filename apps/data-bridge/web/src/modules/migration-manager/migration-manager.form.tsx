import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { DatabaseSettings, MigrationJobInput } from "./migration-manager.types";
export function MigrationManagerForm({
  value,
  error,
  pending,
  onChange,
  onSubmit
}: {
  value: MigrationJobInput;
  error: string | undefined;
  pending: boolean;
  onChange: (value: MigrationJobInput) => void;
  onSubmit: () => void;
}) {
  const database = (side: "source" | "target", patch: Partial<DatabaseSettings>) =>
    onChange({ ...value, [side]: { ...value[side], ...patch } });
  return (
    <form
      noValidate
      className="space-y-4 rounded-md border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {error ? (
        <WorkspaceFormBanner title="Unable to save migration job">{error}</WorkspaceFormBanner>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        <Input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="Job name"
        />
        <Input
          value={value.tenant}
          onChange={(event) => onChange({ ...value, tenant: event.target.value })}
          placeholder="Tenant"
        />
        <WorkspaceSelect
          value={value.status}
          onValueChange={(status) =>
            onChange({ ...value, status: status as MigrationJobInput["status"] })
          }
          options={["draft", "ready", "running", "completed", "failed"].map((status) => ({
            value: status,
            label: status
          }))}
        />
      </div>
      {(["source", "target"] as const).map((side) => (
        <section key={side} className="space-y-3 rounded-md border p-3">
          <h3 className="font-semibold capitalize">{side} database</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={value[side].host}
              onChange={(event) => database(side, { host: event.target.value })}
              placeholder="Host"
            />
            <Input
              type="number"
              value={value[side].port}
              onChange={(event) => database(side, { port: Number(event.target.value) })}
              placeholder="Port"
            />
            <Input
              value={value[side].database}
              onChange={(event) => database(side, { database: event.target.value })}
              placeholder="Database"
            />
            <Input
              value={value[side].user}
              onChange={(event) => database(side, { user: event.target.value })}
              placeholder="User"
            />
            <Input
              type="password"
              value={value[side].password}
              onChange={(event) => database(side, { password: event.target.value })}
              placeholder="Password"
            />
            <WorkspaceSelect
              value={value[side].type}
              onValueChange={(type) => database(side, { type: type as DatabaseSettings["type"] })}
              options={[
                { value: "mariadb", label: "MariaDB" },
                { value: "mysql2", label: "MySQL" }
              ]}
            />
          </div>
        </section>
      ))}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
