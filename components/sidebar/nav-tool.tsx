'use client';

import { ChevronsUpDown, FileText, ShieldCheck, BriefcaseBusiness, Locate } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const tools = [
  { key: 'scope', label: 'Escopos', description: 'Despachos e cadastros', href: '/scope/list', icon: FileText },
  { key: 'tracker', label: 'Tracker', description: 'Pipeline dos processos', href: '/comercial', icon: Locate },
];

export function NavTool() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  const active = tools.find((tool) => pathname.startsWith(tool.href)) ?? tools[0];
  const Icon = active.icon;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="cursor-pointer bg-primary/10">
              <div className="flex items-center gap-2">
                <div className="text-primary size-8 rounded-full border flex items-center justify-center">
                  <Icon className="size-5" />
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-white font-semibold">{active.label}</span>
                  <span className="text-xs text-white/70">{active.description}</span>
                </div>
              </div>
              <ChevronsUpDown className="text-white" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-72 rounded-lg" side={isMobile ? 'bottom' : 'right'} align="start" sideOffset={4}>
            <DropdownMenuLabel>Selecionar ferramenta</DropdownMenuLabel>
            <DropdownMenuGroup>
              {tools.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <DropdownMenuItem key={tool.key} asChild>
                    <Link href={tool.href} className="flex items-center gap-3">
                      <ToolIcon className="size-4" />
                      <div className="flex flex-col leading-tight">
                        <span>{tool.label}</span>
                        <span className="text-xs text-muted-foreground">{tool.description}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
