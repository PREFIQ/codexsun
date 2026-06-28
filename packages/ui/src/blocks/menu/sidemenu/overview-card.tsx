import { ReceiptTextIcon, UserRoundIcon } from "lucide-react"

import { Badge } from "../../../components/badge"

export function OverviewCard() {
  return (
    <section className="px-4 lg:px-6">
      <div className="relative overflow-hidden rounded-lg border bg-card shadow">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-emerald-100/70 via-emerald-50/50 to-transparent" />
        <div className="relative flex min-h-32 items-center justify-between gap-6 px-5 py-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <ReceiptTextIcon className="size-7" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Super Admin Control</p>
              <h1 className="mt-1 text-3xl font-semibold leading-none tracking-tight">Billing Desk</h1>
              <p className="mt-3 max-w-4xl truncate text-sm text-muted-foreground">
                Sales, purchase, receipt, payment, accounts, reports, masters, common data, and billing settings.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="hidden shrink-0 gap-2 rounded-full bg-background px-4 py-2 shadow-sm lg:flex">
            <UserRoundIcon className="size-4" />
            Signed in as SUNDAR
          </Badge>
        </div>
      </div>
    </section>
  )
}
