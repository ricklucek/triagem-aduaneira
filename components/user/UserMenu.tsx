'use client';

import { BadgeCheck, Headset, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { useCurrentUser } from "@/lib/api/hooks/use-auth";
import { getIniciais } from "@/utils/functions";
import Link from "next/link";

const UserMenu = () => {

    const { data } = useCurrentUser();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="lg"
                    variant="ghost"
                    className="px-1 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                >
                    <Avatar className="size-8 rounded-full">
                        <AvatarFallback className="rounded-lg">
                            {getIniciais(data?.nome ?? '')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="max-w-[150px] hidden sm:flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
                        <span className="text-white-light line-clamp-1">
                            {data?.nome ?? ''}
                        </span>
                        <span className="text-white-dark text-xs">administrador</span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={'bottom'}
                align="end"
                sideOffset={4}
            >
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarFallback className="rounded-lg">
                                {getIniciais(data?.nome ?? '')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight text-white-light">
                            <span className="truncate font-medium">{data?.nome}</span>
                            <span className="truncate text-xs">{data?.email}</span>
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
                    onClick={() => {}}
                >
                    <LogOut color="#F10000" />
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )

}

export default UserMenu;