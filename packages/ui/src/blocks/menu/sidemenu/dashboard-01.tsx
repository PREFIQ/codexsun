import { ChartAreaInteractive } from "./chart-area-interactive";
import { DataTable } from "./data-table";
import data from "./data.json";
import { AppLayout } from "../../../layouts/app-layout";
import { OverviewCard } from "./overview-card";
import { SectionCards } from "./section-cards";

export function Dashboard01() {
  return (
    <AppLayout headerTitle="Billing Desk">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <OverviewCard />
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DataTable data={data} />
      </div>
    </AppLayout>
  );
}
