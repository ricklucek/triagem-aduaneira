'use client';

import Link from 'next/link';
import { ChevronDown, type LucideIcon } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

type MainItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
};

type SettingsItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
};

export function NavMain({
  items,
  settings,
}: {
  items: MainItem[];
  settings?: {
    title: string;
    icon?: LucideIcon;
    items: SettingsItem[];
  };
}) {
  return (
    <SidebarMenu className="gap-2 px-2">
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            tooltip={item.title}
            className="rounded-2xl px-4 font-semibold text-white-light hover:bg-[#FFF]/10 hover:text-white-light data-[active=true]:bg-[#FFF]/10 data-[active=true]:text-white-light group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:px-0"
          >
            <Link href={item.url}>
              {item.icon && <item.icon className="size-6 shrink-0" />}
              <span className="group-data-[collapsible=icon]:hidden">
                {item.title}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}

      {settings && (
        <Collapsible defaultOpen>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip={settings.title}
                className="rounded-2xl px-4 font-semibold text-white-light hover:bg-[#FFF]/10 hover:text-white-light group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:px-0"
              >
                {settings.icon && <settings.icon className="size-6 shrink-0" />}
                <span className="group-data-[collapsible=icon]:hidden">
                  {settings.title}
                </span>
                <ChevronDown className="ml-auto size-5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
              <SidebarMenuSub className="mt-2 border-l border-[#FFF]/20 gap-5">
                {settings.items.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      asChild
                      className="h-fit rounded-xl text-zinc-200 hover:bg-primary/10"
                    >
                      <Link href={subItem.url}>{subItem.title}</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      )}
    </SidebarMenu>
  );
}
