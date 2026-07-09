import { LandmarkIcon } from "lucide-react";
import { ApplicationLayout } from "@codexsun/ui";
import { AccountsWorkspace } from "../modules/accounts";

export function AccountsWebApp() {
  return (
    <ApplicationLayout
      brand={{ href: "/", subtitle: "accounts workspace", title: "Accounts" }}
      headerTitle="Accounts"
      menuItems={[
        { icon: LandmarkIcon, isActive: true, title: "Accounts", items: [{ title: "Overview", isActive: true, onSelect: () => undefined }] }
      ]}
      subtitle={null}
      title={null}
      workspaceItems={[]}
    >
      <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-4 lg:w-[calc(100%-3rem)] lg:py-5">
        <AccountsWorkspace />
      </main>
    </ApplicationLayout>
  );
}
