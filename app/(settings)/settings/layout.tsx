'use client'

import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { settingsSidebarNavigation } from "@/components/sidebar/sidebar-navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

export default function Layout({
  children,
  header,
}: {
  children: ReactNode;
  header: ReactNode;
}) {
  return (
    <SidebarProvider className="relative h-screen w-full flex-col bg-bg">
      {header}

      <div className="flex min-h-0 flex-1">
        <AppSidebar navigation={settingsSidebarNavigation} headerSlot="back-button" />

        <SidebarInset className="min-h-0 bg-bg">
          <main className="flex flex-1 bg-card">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}