'use client';

import * as React from 'react';
import { CircleHelp, LayoutDashboard, FileText, Bolt, Info } from 'lucide-react';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { NavMain } from './nav-main';
import { NavOthers } from './nav-others';
import { NavTool } from './nav-tool';
import { Separator } from '../ui/separator';
import { usePathname } from "next/navigation";

const toolNavigation = {
  scope: {
    navMain: [{ title: 'Dashboard', url: '/scope/dashboard', icon: LayoutDashboard }],
    settings: {
      title: 'Escopos',
      icon: FileText,
      items: [
        { title: 'Lista', url: '/scope/list' },
        { title: 'Clientes', url: '/scope/clients' },
        { title: 'Meus Escopos', url: '/scope/my-scopes' },
      ],
    },
    action: {
      title: 'Novo Escopo',
      url: '/scope/new'
    }
  },
  settings: {
    navMain: [{ title: 'Geral', url: '/settings/general', icon: Info }],
    settings: undefined,
    action: undefined
  },
};

const others = [
  { title: 'Suporte', url: '/support', icon: CircleHelp },
  { title: 'Configurações', url: '/settings', icon: Bolt },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const pathname = usePathname();
  const currentPath = pathname.split('/')[1];

  const navigation = toolNavigation[currentPath as keyof typeof toolNavigation];

  return (
    <Sidebar collapsible="icon" className="pt-16 border-r border-[#FFF]/10 bg-[#121214] text-white" {...props}>
      <SidebarHeader className="pb-6 flex items-center justify-center group-data-[collapsible=icon]:justify-center">
        <NavTool />
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <div className="flex h-full flex-col justify-between">
          <div className="pt-3">
            <NavMain
              items={navigation.navMain}
              settings={navigation.settings}
              action={navigation.action}
            />
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
