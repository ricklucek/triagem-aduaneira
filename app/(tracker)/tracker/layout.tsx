'use client'

import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { processSidebarNavigation, trackerSidebarNavigation } from "@/components/sidebar/sidebar-navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function Layout({
  children,
  header,
}: {
  children: ReactNode;
  header: ReactNode;
}) {

  const pathName = usePathname();

  return (
    <SidebarProvider className="relative h-screen w-full flex-col bg-bg">
      {header}

      <div className="flex min-h-0 flex-1">
        <AppSidebar navigation={renderMenuOptions(pathName)} headerSlot={headerSlot(pathName)} />

        <SidebarInset className="min-h-0 bg-bg">
          <main className="flex flex-1 bg-card">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function renderMenuOptions(pathName: string) {

  if (pathName.startsWith("/tracker/process/")) return processSidebarNavigation

  return trackerSidebarNavigation

}

function headerSlot(pathName: string) {
  if (pathName.startsWith("/tracker/process/")) return "back-button"

  return "tool-navigation"
}