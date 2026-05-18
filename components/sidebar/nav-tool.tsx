'use client';

import {
  BadgeCheck,
  ChevronsUpDown,
  FileText,
  Headset,
  LogOut,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';


export function NavTool() {

  const { isMobile } = useSidebar();


  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="pl-0 cursor-pointer bg-primary/10 flex flex-row items-center justify-between"
            >
              <div className='flex flex-row items-center gap-2'>
                <div className='text-primary size-8 rounded-full border flex items-center justify-center'>
                  <FileText className='size-6' />
                </div>
                <span className='text-white font-semibold'>Escopos</span>
              </div>
              <ChevronsUpDown className='text-white'/>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className='flex flex-row items-center gap-5'>
                  <div className='size-8 rounded-full bg-'>
                    <FileText className='' color='#FFF' />
                  </div>
                  <span className='text-white'>Escopos</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight text-white-light">
                  <span className="truncate font-medium">AAA</span>
                  <span className="truncate text-xs">BBB</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link
                  href="/support"
                  className="flex w-full flex-row items-center gap-2"
                >
                  <Headset />
                  Suporte
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link
                  href="/user"
                  className="flex w-full flex-row items-center gap-2"
                >
                  <BadgeCheck />
                  Minha Conta
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[#F10000]"
              onClick={() => { }}
            >
              <LogOut color="#F10000" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
