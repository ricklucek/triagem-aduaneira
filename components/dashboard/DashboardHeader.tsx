import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { BadgeCheck, Headset, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import UserMenu from '../user/UserMenu';
import NotificationsPanel from '../user/NotificationsPanel';

export default function DashboardHeader({
  headerText,
}: {
  headerText: string;
}) {
  
  return (
    <header className="flex h-16 shrink-0 z-10 items-center gap-2 transition-[height] ease-linear">
      <div
        className="
                fixed w-full z-10
                h-16 flex items-center justify-between px-4
                backdrop-blur supports-backdrop-filter:bg-black/30 bg-black/60
                border-b border-[#FFF]/10
                "
      >
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="min-w-0">
            <span className="text-white-light font-semibold text-2xl">
              {headerText}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NotificationsPanel />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
