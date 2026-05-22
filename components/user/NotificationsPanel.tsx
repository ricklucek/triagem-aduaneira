'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell } from 'lucide-react';

export default function NotificationsPanel() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-white-light">
          Notificações
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">
          <span className="text-white-light text-xs">
            Sem notificações por enquanto...
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
