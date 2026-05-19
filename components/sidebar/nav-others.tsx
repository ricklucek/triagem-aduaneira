'use client';

import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavOthers({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
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
    </SidebarMenu>
  );
}
