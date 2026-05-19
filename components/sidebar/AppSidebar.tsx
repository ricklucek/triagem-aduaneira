'use client';

import * as React from 'react';
import { CircleHelp, LayoutDashboard, GitCompare, LogOut, FileText, Bolt } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { NavMain } from './nav-main';
import { NavOthers } from './nav-others';
import { NavTool } from './nav-tool';
import { Separator } from '../ui/separator';

const toolNavigation = {
  scope: {
    navMain: [{ title: 'Dashboard', url: '/scope/list', icon: LayoutDashboard }],
    settings: {
      title: 'Escopos',
      icon: FileText,
      items: [
        { title: 'Lista', url: '/scope/list' },
        { title: 'Clientes', url: '/scope/clients' },
      ],
    },
  },
  default: {
    navMain: [{ title: 'Overview', url: '/dashboard', icon: LayoutDashboard }],
    settings: {
      title: 'Tracking',
      icon: GitCompare,
      items: [
        { title: 'Lista', url: '/dashboard/events' },
        { title: 'Clientes', url: '/dashboard/events' },
      ],
    },
  },
};

const others = [
  { title: 'Suporte', url: '/dashboard/support', icon: CircleHelp },
  { title: 'Configurações', url: '/dashboard/validators', icon: Bolt },
  { title: 'Logout', url: '/dashboard/validators', icon: LogOut },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const navigation = pathname.startsWith('/scope') ? toolNavigation.scope : toolNavigation.default;

  return (
    <Sidebar collapsible="icon" className="pt-16 border-r border-[#FFF]/10 bg-[#121214] text-white" {...props}>
      <SidebarHeader className="pb-6 flex items-center justify-center group-data-[collapsible=icon]:justify-center">
        <NavTool />
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <div className="flex h-full flex-col justify-between">
          <div className="pt-3">
            <NavMain items={navigation.navMain} settings={navigation.settings} />
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-[#FFF]/10">
        <NavOthers items={others} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
