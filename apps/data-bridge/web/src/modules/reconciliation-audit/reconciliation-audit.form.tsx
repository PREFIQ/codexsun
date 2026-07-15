import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import {
  addExceptionSchema,
  generateReportSchema,
  resolveExceptionSchema,
  signOffSchema
} from "./reconciliation-audit.schema";
import type {
  AddExceptionInput,
  CompletedExecutionOption,
  GenerateReportInput,
  ReconciliationException,
  SignOffInput
} from "./reconciliation-audit.types";
export function ReconciliationGenerateForm({
  runs,
  pending,
  error,
  onSubmit
}: {
  runs: CompletedExecutionOption[];
  pending: boolean;
  error: string | undefined;
  onSubmit: (input: GenerateReportInput) => unknown;
}) {
  const [executionRunId, setExecutionRunId] = useState("");
  const [generatedBy, setGeneratedBy] = useState("");
  const [validation, setValidation] = useState("");
  const submit = () => {
    const result = generateReportSchema.safeParse({
      executionRunId: Number(executionRunId),
      generatedBy
    });
    if (!result.success)
      return setValidation(result.error.issues[0]?.message ?? "Complete the verification form.");
    setValidation("");
    onSubmit(result.data);
  };
  return (
    <section className="space-y-3 rounded-md border bg-card p-4">
      <div>
        <h3 className="font-semibold">Generate reconciliation evidence</h3>
        <p className="text-sm text-muted-foreground">
          Re-reads migrated Target records and compares their mapped row hashes.
        </p>
      </div>
      {validation || error ? (
        <WorkspaceFormBanner title="Unable to reconcile">{validation || error}</WorkspaceFormBanner>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <WorkspaceSelect
          value={executionRunId}
          onValueChange={setExecutionRunId}
          placeholder="Completed execution"
          options={runs.map((run) => ({
            value: String(run.id),
            label: `EX-${run.id} · ${run.name} · ${run.tenant}`
          }))}
        />
        <Input
          value={generatedBy}
          onChange={(event) => setGeneratedBy(event.target.value)}
          placeholder="Verified by"
        />
      </div>
      <Button disabled={pending} onClick={submit}>
        {pending ? "Verifying Target..." : "Generate report"}
      </Button>
    </section>
  );
}
export function ReconciliationSignOffForm({
  pending,
  error,
  onSubmit
}: {
  pending: boolean;
  error: string | undefined;
  onSubmit: (input: SignOffInput) => unknown;
}) {
  const [input, setInput] = useState<SignOffInput>({
    clientName: "",
    clientReference: "",
    signedBy: "",
    note: ""
  });
  const [validation, setValidation] = useState("");
  const submit = () => {
    const result = signOffSchema.safeParse(input);
    if (!result.success)
      return setValidation(result.error.issues[0]?.message ?? "Complete client sign-off.");
    setValidation("");
    onSubmit(result.data);
  };
  return (
    <section className="space-y-3 rounded-md border bg-card p-4">
      <h3 className="font-semibold">Client sign-off</h3>
      {validation || error ? (
        <WorkspaceFormBanner title="Unable to sign off">{validation || error}</WorkspaceFormBanner>
      ) : null}
      <Input
        value={input.clientName}
        onChange={(event) => setInput({ ...input, clientName: event.target.value })}
        placeholder="Client name"
      />
      <Input
        value={input.clientReference}
        onChange={(event) => setInput({ ...input, clientReference: event.target.value })}
        placeholder="Client sign-off reference"
      />
      <Input
        value={input.signedBy}
        onChange={(event) => setInput({ ...input, signedBy: event.target.value })}
        placeholder="Signed by"
      />
      <Input
        value={input.note}
        onChange={(event) => setInput({ ...input, note: event.target.value })}
        placeholder="Sign-off note"
      />
      <Button disabled={pending} onClick={submit}>
        Record immutable sign-off
      </Button>
    </section>
  );
}
export function ReconciliationExceptionForm({
  tables,
  pending,
  error,
  onSubmit
}: {
  tables: string[];
  pending: boolean;
  error: string | undefined;
  onSubmit: (input: AddExceptionInput) => unknown;
}) {
  const [input, setInput] = useState<AddExceptionInput>({
    table: "",
    category: "operator",
    details: "",
    actor: ""
  });
  const [validation, setValidation] = useState("");
  const submit = () => {
    const result = addExceptionSchema.safeParse(input);
    if (!result.success)
      return setValidation(result.error.issues[0]?.message ?? "Complete exception details.");
    setValidation("");
    onSubmit(result.data);
  };
  return (
    <section className="space-y-3 rounded-md border bg-card p-4">
      <h3 className="font-semibold">Record additional exception</h3>
      {validation || error ? (
        <WorkspaceFormBanner title="Unable to record exception">
          {validation || error}
        </WorkspaceFormBanner>
      ) : null}
      <WorkspaceSelect
        value={input.table}
        onValueChange={(table) => setInput({ ...input, table })}
        placeholder="Affected table"
        options={tables.map((table) => ({ value: table, label: table }))}
      />
      <WorkspaceSelect
        value={input.category}
        onValueChange={(category) =>
          setInput({ ...input, category: category as AddExceptionInput["category"] })
        }
        options={[
          { value: "operator", label: "Operator exception" },
          { value: "financial", label: "Financial control exception" }
        ]}
      />
      <Input
        value={input.details}
        onChange={(event) => setInput({ ...input, details: event.target.value })}
        placeholder="Exception details"
      />
      <Input
        value={input.actor}
        onChange={(event) => setInput({ ...input, actor: event.target.value })}
        placeholder="Recorded by"
      />
      <Button disabled={pending} variant="outline" onClick={submit}>
        Add exception
      </Button>
    </section>
  );
}
export function ExceptionResolutionForm({
  item,
  pending,
  error,
  onSubmit
}: {
  item: ReconciliationException;
  pending: boolean;
  error: string | undefined;
  onSubmit: (input: { actor: string; resolution: string }) => unknown;
}) {
  const [actor, setActor] = useState("");
  const [resolution, setResolution] = useState("");
  const [validation, setValidation] = useState("");
  const submit = () => {
    const result = resolveExceptionSchema.safeParse({ actor, resolution });
    if (!result.success)
      return setValidation(result.error.issues[0]?.message ?? "Complete the resolution.");
    setValidation("");
    onSubmit(result.data);
  };
  return (
    <div className="space-y-2 border-t pt-3">
      {validation || error ? (
        <WorkspaceFormBanner title="Unable to resolve exception">
          {validation || error}
        </WorkspaceFormBanner>
      ) : null}
      <Input
        value={actor}
        onChange={(event) => setActor(event.target.value)}
        placeholder="Resolved by"
      />
      <Input
        value={resolution}
        onChange={(event) => setResolution(event.target.value)}
        placeholder={`Resolution for ${item.id}`}
      />
      <Button disabled={pending} onClick={submit}>
        Resolve exception
      </Button>
    </div>
  );
}
