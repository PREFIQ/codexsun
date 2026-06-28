"use client"

import * as React from "react"
import {
  AppWindowIcon,
  BadgeCheckIcon,
  ChevronsUpDownIcon,
  CreditCardIcon,
  Globe2Icon,
  LogOutIcon,
  MonitorCogIcon,
  PanelsTopLeftIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
  SparklesIcon,
  UsersRoundIcon,
  WalletCardsIcon
} from "lucide-react"

import { SidemenuSection, type SidemenuItem } from "./sub/sidemenu-section"
import { Avatar, AvatarFallback } from "../../../components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../../../components/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "../../../components/sidebar"

const platformItems: SidemenuItem[] = [
  {
    title: "Admin",
    url: "/workspace",
    icon: WalletCardsIcon,
    isActive: true,
    items: [
      {
        title: "Master Modules",
        url: "/workspace"
      },
      {
        title: "Platform Masters",
        url: "/admin"
      },
      {
        title: "Security Surface",
        url: "/tenant"
      }
    ]
  },
  {
    title: "Tenant",
    url: "/tenant",
    icon: UsersRoundIcon
  },
  {
    title: "Domain",
    url: "/status",
    icon: Globe2Icon
  },
  {
    title: "Subscription",
    url: "/admin",
    icon: CreditCardIcon
  },
  {
    title: "Apps",
    url: "/workspace",
    icon: AppWindowIcon
  },
  {
    title: "Compliance",
    url: "/status",
    icon: RefreshCwIcon
  }
]

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className={className}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Super Admin Desk" className="h-14">
              <a href="/workspace">
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg border bg-background">
                  <img alt="CODEXSUN" className="size-5 dark:hidden" src="/logo/logo.svg" />
                  <img alt="CODEXSUN" className="hidden size-5 dark:block" src="/logo/logo-dark.svg" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">Super Admin Desk</span>
                  <span className="truncate text-xs text-muted-foreground">super-admin</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidemenuSection items={platformItems} />
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">v 1.0.155</div>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="h-14">
                  <Avatar className="size-9 border bg-background">
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <div className="truncate font-semibold">SUNDAR</div>
                    <div className="truncate text-xs text-muted-foreground">sundar@sundar.com</div>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-56 p-2">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="size-9 border bg-background">
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">SUNDAR</div>
                    <div className="truncate text-xs text-muted-foreground">sundar@sundar.com</div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <SparklesIcon />
                  Upgrade to Pro
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BadgeCheckIcon />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ReceiptTextIcon />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MonitorCogIcon />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <PanelsTopLeftIcon />
                  Super Admin login
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOutIcon />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
