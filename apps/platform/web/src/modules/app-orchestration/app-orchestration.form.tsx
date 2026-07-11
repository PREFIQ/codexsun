import { Button } from "@codexsun/ui";
import { PlayIcon, RefreshCwIcon, SquareIcon, TerminalIcon } from "lucide-react";
import type { OrchestratedApp } from "./app-orchestration.types";
export function AppOrchestrationForm({
  app,
  busy,
  onRefresh,
  onStart,
  onStop,
  onUpdate
}: {
  app: OrchestratedApp;
  busy: boolean;
  onRefresh: () => void;
  onStart: () => void;
  onStop: () => void;
  onUpdate: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={busy} onClick={onRefresh}>
        <RefreshCwIcon className="size-4" />
        Refresh
      </Button>
      <Button disabled={busy || !app.managed || app.terminalPid !== null} onClick={onStart}>
        <TerminalIcon className="size-4" />
        Open & start
      </Button>
      <Button
        variant="outline"
        disabled={busy || !app.managed || app.terminalPid === null}
        onClick={onStop}
      >
        <SquareIcon className="size-4" />
        Stop
      </Button>
      <Button variant="outline" disabled={busy || !app.managed} onClick={onUpdate}>
        <PlayIcon className="size-4" />
        Update
      </Button>
    </div>
  );
}
