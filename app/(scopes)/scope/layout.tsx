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
    <SidebarProvider className="relative h-screen w-full flex-col bg-bg">
      {header}
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <SidebarInset className="min-h-0 bg-bg pt-16">
          <main className="flex min-h-0 flex-1 bg-bg">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
