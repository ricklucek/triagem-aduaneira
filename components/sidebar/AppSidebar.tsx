"use client";

import * as React from "react";
import { Bolt, ChevronLeft, LucideIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";

import { NavMain } from "./nav-main";
import { NavOthers } from "./nav-others";
import { NavTool } from "./nav-tool";
import { Separator } from "../ui/separator";
import { SidebarNavigation } from "./sidebar-types";
import { useRouter } from "next/navigation";
import { hasRole } from "@/lib/auth/guard";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  navigation: SidebarNavigation;
  headerSlot?: "back-button" | "tool-navigation";
  footerItems?: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
};

export function AppSidebar({
  navigation,
  headerSlot = "tool-navigation",
  footerItems = [
    {
      title: "Configurações",
      url: "/settings/general",
      icon: Bolt,
    },
  ],
  ...props
}: AppSidebarProps) {

  const router = useRouter()

  return (
    <Sidebar
      collapsible="icon"
      className="pt-16 border-r border-[#FFF]/10 bg-[#121214] text-white"
      {...props}
    >
      <SidebarHeader className="pb-6 flex items-center justify-center group-data-[collapsible=icon]:justify-center">
        {
          headerSlot == "tool-navigation" && <NavTool />
        }
        {
          headerSlot == "back-button" &&
          <SidebarMenuButton
            size="lg"
            className="cursor-pointer"
            onClick={() => router.back()}
          >
            <div className="flex items-center gap-2">
              <div className="text-primary size-8 rounded-full border flex items-center justify-center">
                <ChevronLeft className="size-5" />
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-white font-semibold">
                  Voltar
                </span>
              </div>
            </div>
          </SidebarMenuButton>
        }
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
        <NavOthers items={hasRole("admin") ? footerItems : []} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}