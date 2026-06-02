"use client";

import * as React from "react";
import {
  ArrowLeft,
  Building2,
  FileText,
  Info,
  LayoutDashboard,
  Locate,
  MessageSquare,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavOthers } from "./nav-others";
import { NavTool } from "./nav-tool";
import { Separator } from "../ui/separator";
import Link from "next/link";
import { usePathname } from "next/navigation";

const toolNavigation = {
  scope: {
    navMain: [
      { title: "Dashboard", url: "/scope/dashboard", icon: LayoutDashboard },
    ],
    settings: {
      title: "Escopos",
      icon: FileText,
      items: [
        { title: "Lista", url: "/scope/list" },
        { title: "Clientes", url: "/scope/clients" },
        { title: "Meus Escopos", url: "/scope/my-scopes" },
      ],
    },
    action: {
      title: "Novo Escopo",
      url: "/scope/new",
    },
  },
  tracker: {
    navMain: [{ title: "Pipeline", url: "/tracker/pipeline", icon: Locate }],
    settings: undefined,
    action: undefined,
  },
  settings: {
    navMain: [{ title: "Geral", url: "/settings/general", icon: Info }],
    settings: undefined,
    action: undefined,
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const currentPath = pathSegments[0];
  const isTrackerProcess =
    currentPath === "tracker" && pathSegments[1] === "process";

  const navigation = isTrackerProcess
    ? {
        navMain: [
          { title: "Informações do processo", url: pathname, icon: Info },
          {
            title: "Comentários",
            url: `${pathname}#comentarios`,
            icon: MessageSquare,
          },
        ],
        settings: {
          title: "Departamentos",
          icon: Building2,
          items: [
            {
              title: "Despacho aduaneiro",
              url: `${pathname}#departamento-despacho-aduaneiro`,
            },
            {
              title: "Frete internacional",
              url: `${pathname}#departamento-frete-internacional`,
            },
            {
              title: "Frete Rodoviário",
              url: `${pathname}#departamento-frete-rodoviario`,
            },
            { title: "Financeiro", url: `${pathname}#departamento-financeiro` },
          ],
        },
        action: undefined,
      }
    : toolNavigation[currentPath as keyof typeof toolNavigation];

  return (
    <Sidebar
      collapsible="icon"
      className="pt-16 border-r border-[#FFF]/10 bg-[#121214] text-white"
      {...props}
    >
      <SidebarHeader className="pb-6 flex items-center justify-center group-data-[collapsible=icon]:justify-center">
        {isTrackerProcess ? (
          <Link
            href="/tracker/pipeline"
            className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 font-semibold text-white-light hover:bg-[#FFF]/10 hover:text-white-light group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <ArrowLeft className="size-5 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">
              Retornar
            </span>
          </Link>
        ) : (
          <NavTool />
        )}
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
        <NavOthers items={[]} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
