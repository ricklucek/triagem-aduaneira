"use client";

import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { nfeSidebarNavigation } from "@/components/sidebar/sidebar-navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode, Suspense } from "react";

export default function NfeLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="relative h-screen w-full flex-col bg-background text-foreground">
      <DashboardHeader headerText="Emissão de NF-e" />
      <div className="flex min-h-0 flex-1">
        <AppSidebar navigation={nfeSidebarNavigation} />
        <SidebarInset className="min-h-0 bg-muted/20">
          <Suspense>
            <main className="flex-1 overflow-y-auto">{children}</main>
          </Suspense>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
