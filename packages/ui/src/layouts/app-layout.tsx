import type { CSSProperties, ReactNode } from "react";

import { AppSidebar } from "../blocks/menu/sidemenu/app-sidebar";
import { TopMenu } from "../blocks/menu/sidemenu/top-menu";
import { SidebarInset, SidebarProvider } from "../components/sidebar";

type AppLayoutProps = {
  children: ReactNode;
  headerTitle?: ReactNode;
  subtitle?: ReactNode;
  title?: ReactNode;
};

export function AppLayout({ children, headerTitle = "Documents", subtitle, title }: AppLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem"
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <TopMenu pageTitle={String(headerTitle)} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {title || subtitle ? (
              <div className="border-b bg-background px-4 py-5 lg:px-6">
                {title ? <h2 className="m-0 text-2xl font-semibold leading-tight">{title}</h2> : null}
                {subtitle ? <p className="mt-1 text-muted-foreground">{subtitle}</p> : null}
              </div>
            ) : null}
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
