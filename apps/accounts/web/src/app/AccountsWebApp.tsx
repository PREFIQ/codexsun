import { useState } from "react";
import { CircleGaugeIcon, FileSpreadsheetIcon, LandmarkIcon, ReceiptIndianRupeeIcon, Settings2Icon } from "lucide-react";
import { ApplicationLayout } from "@codexsun/ui";
import { AccountsWorkspace } from "../modules/accounts";

type AccountsPage = "overview" | "ledgers" | "vouchers" | "reports" | "settings";

export function AccountsWebApp() {
  const [page, setPage] = useState<AccountsPage>("overview");

  return (
    <ApplicationLayout
      brand={{ href: "/", subtitle: "accounts workspace", title: "Accounts" }}
      headerTitle={titleForPage(page)}
      menuItems={[
        { icon: CircleGaugeIcon, isActive: page === "overview", title: "Overview", onSelect: () => setPage("overview") },
        {
          icon: LandmarkIcon,
          isActive: page === "ledgers",
          title: "Masters",
          items: [{ title: "Ledgers", isActive: page === "ledgers", onSelect: () => setPage("ledgers") }]
        },
        {
          icon: ReceiptIndianRupeeIcon,
          isActive: page === "vouchers",
          title: "Vouchers",
          items: [{ title: "All Vouchers", isActive: page === "vouchers", onSelect: () => setPage("vouchers") }]
        },
        {
          icon: FileSpreadsheetIcon,
          isActive: page === "reports",
          title: "Reports",
          items: [{ title: "Reports Overview", isActive: page === "reports", onSelect: () => setPage("reports") }]
        },
        {
          icon: Settings2Icon,
          isActive: page === "settings",
          title: "Settings",
          items: [{ title: "Accounts Settings", isActive: page === "settings", onSelect: () => setPage("settings") }]
        }
      ]}
      subtitle={null}
      title={null}
      workspaceItems={[]}
    >
      <main className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-5 py-4 lg:w-[calc(100%-3rem)] lg:py-5">
        <AccountsWorkspace page={page} />
      </main>
    </ApplicationLayout>
  );
}

function titleForPage(page: AccountsPage) {
  if (page === "ledgers") return "Ledgers";
  if (page === "vouchers") return "Vouchers";
  if (page === "reports") return "Reports";
  if (page === "settings") return "Accounts Settings";
  return "Accounts";
}
