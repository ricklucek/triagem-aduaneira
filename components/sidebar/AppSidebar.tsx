'use client';

import * as React from 'react';
import {
  CircleHelp,
  LayoutDashboard,
  ShieldCheck,
  GitCompare,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { NavMain } from "./nav-main"
import { NavOthers } from "./nav-others"
import { NavTool } from './nav-tool';
import { Separator } from '../ui/separator';

const data = {
  navMain: [
    {
      title: 'Overview',
      url: '/dashboard',
      icon: LayoutDashboard,
    }
  ],
  others: [
    {
      title: 'Suporte',
      url: '/dashboard/support',
      icon: CircleHelp,
    },
    {
      title: 'Configurações',
      url: '/dashboard/validators',
      icon: ShieldCheck,
    },
    {
      title: 'Logout',
      url: '/dashboard/validators',
      icon: LogOut,
    },
  ],
  settings:
  {
    title: 'Tracking',
    icon: GitCompare,
    items: [
      {
        title: "Lista",
        url: '/dashboard/events',
      },
      {
        title: "Clientes",
        url: '/dashboard/events',
      },
    ]
  },

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[#FFF]/10 bg-[#121214] text-white"
      {...props}
    >
      <SidebarHeader className="pb-6 flex items-center justify-center group-data-[collapsible=icon]:justify-center">
        <NavTool />
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <div className="flex h-full flex-col justify-between">
          <div className="pt-3">
            <NavMain items={data.navMain} settings={data.settings} />
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#FFF]/10">
        <NavOthers items={data.others} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
