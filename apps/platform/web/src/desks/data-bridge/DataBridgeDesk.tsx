import { DataBridgeApp } from "@codexsun/data-bridge-web";
import { AuthGate } from "../../shared/auth/AuthGate";

export function DataBridgeDesk() {
  return (
    <AuthGate desk="sa">
      <DataBridgeApp />
    </AuthGate>
  );
}
