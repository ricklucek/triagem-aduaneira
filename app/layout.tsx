import "./globals.css";

import { ThemeProvider } from "next-themes";
import { AppShell } from "@/components/app-shell";
import NextTopLoader from "nextjs-toploader";

import { ToastProvider } from "@/components/ui/toast";

import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
    >
        <ToastProvider>
          <html lang="pt-BR" suppressHydrationWarning>
            <body>
              <NextTopLoader color="#42f7f8" showSpinner={false} />
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </body>
          </html>
        </ToastProvider>
    </ThemeProvider>
  );
}
