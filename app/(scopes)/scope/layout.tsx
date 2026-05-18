import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ReactNode } from 'react';

export default function Layout({
  children,
  header,
}: {
  children: ReactNode;
  header: ReactNode;
}) {
  return (
    <SidebarProvider className="relative h-screen w-full">
      <AppSidebar />
      <SidebarInset className="bg-bg">
        {header}
        <main className="flex flex-1 bg-bg">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
