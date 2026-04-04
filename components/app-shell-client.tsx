"use client";

import Link from "next/link";
import { Bolt, ChartLine, LayoutDashboard, Menu, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { logoutSession } from "@/lib/api/hooks/use-auth";
import { useAuthSession, type AuthSession } from "@/lib/auth/session-storage";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";

const navByRole = {
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin", label: "Métricas", icon: ChartLine },
    { href: "/clients", label: "Clientes", icon: UserRound },
    { href: "/settings", label: "Configurações", icon: Bolt },
  ],
  comercial: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/comercial", label: "Métricas", icon: ChartLine },
    { href: "/clients", label: "Clientes", icon: UserRound },
    { href: "/settings", label: "Configurações", icon: Bolt },
  ],
  credenciamento: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/credenciamento", label: "Métricas", icon: ChartLine },
    { href: "/clients", label: "Clientes", icon: UserRound },
    { href: "/settings", label: "Configurações", icon: Bolt },
  ],
  operacao: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/operacao", label: "Métricas", icon: ChartLine },
    { href: "/clients", label: "Clientes", icon: UserRound },
    { href: "/settings", label: "Configurações", icon: Bolt },
  ],
} as const;

function initials(name?: string) {
  if (!name) return "US";
  return name
    .split(" ")
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("");
}

function NavLinks({
  items,
  pathname,
}: {
  items: readonly { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  pathname: string;
}) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <div className={cn("flex flex-row gap-3 items-center rounded-lg px-3 py-2.5 text-sm transition hover:bg-muted",
            active && "bg-muted font-medium"
          )} key={item.href}>
            {<item.icon className="h-4 w-4" />}
            <Link
              href={item.href}
            >
              {item.label}
            </Link>
          </div>
        );
      })}
    </SidebarMenu>
  );
}

export function AppShellClient({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: AuthSession | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const hydratedSession = useAuthSession();
  const session = hydratedSession ?? initialSession;
  const isAuthenticated = Boolean(session?.user);
  const role = session?.user.role;
  const nav = role ? navByRole[role] : [];

  const handleLogout = async () => {
    await logoutSession();
    router.push("/login");
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl">
        {isAuthenticated ? (
          <Sidebar className="sticky top-0 h-screen">
            <SidebarHeader>
              <div className="text-sm font-semibold tracking-tight">ScopeDesk</div>
              <Separator className="mt-4" />
            </SidebarHeader>
            <SidebarContent>
              <NavLinks items={nav} pathname={pathname} />
            </SidebarContent>
            <SidebarFooter>
              <p className="mb-2 text-xs text-muted-foreground">
                Perfil: {session?.user.role}
              </p>
            </SidebarFooter>
          </Sidebar>
        ) : null}

        <main className="flex w-full min-w-0 flex-col">
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              {isAuthenticated ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon-sm" className="md:hidden">
                      <Menu />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <div className="p-4">
                      <div className="text-sm font-semibold tracking-tight">ScopeDesk</div>
                      <Separator className="mt-4" />
                    </div>
                    <div className="px-4 pb-6">
                      <NavLinks items={nav} pathname={pathname} />
                    </div>
                  </SheetContent>
                </Sheet>
              ) : null}
              <span className="truncate">Triagem • Montagem do Escopo</span>
            </div>
            <div className="relative">
              {isAuthenticated ? (
                <details className="group">
                  <summary className="list-none cursor-pointer">
                    <Avatar>
                      <AvatarFallback>{initials(session?.user.nome)}</AvatarFallback>
                    </Avatar>
                  </summary>
                  <div className="absolute right-0 z-20 mt-2 w-52 rounded-md border bg-background p-2 shadow-lg">
                    <p className="border-b px-2 pb-2 text-xs text-muted-foreground">{session?.user.email}</p>
                    <div className="mt-2 flex flex-col gap-1">
                      <Button variant="ghost" className="justify-start" onClick={() => router.push("/settings")}>Configurações</Button>
                      <Button variant="ghost" className="justify-start">Perfil</Button>
                      <Button variant="ghost" className="justify-start">Ajuda</Button>
                      <Button variant="destructive" className="mt-1" onClick={handleLogout}>Sair da conta</Button>
                    </div>
                  </div>
                </details>
              ) : (
                <Button variant="outline" size="sm" onClick={() => router.push("/login")}>Entrar</Button>
              )}
            </div>
          </header>
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
      </div>
    </ToastProvider>
  );
}
