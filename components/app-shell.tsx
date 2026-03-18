"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu } from "@/components/ui/sidebar";
import { logoutSession } from "@/lib/api/hooks/use-auth";
import { useAuthSession } from "@/lib/auth/session-storage";
import { cn } from "@/lib/utils";

const navByRole = {
  admin: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/admin", label: "Painel Admin" },
    { href: "/clients", label: "Clientes" },
  ],
  comercial: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/comercial", label: "Meu Painel" },
    { href: "/clients", label: "Clientes" },
  ],
  credenciamento: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/credenciamento", label: "Meu Painel" },
    { href: "/clients", label: "Clientes" },
  ],
  operacao: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/operacao", label: "Meu Painel" },
    { href: "/clients", label: "Clientes" },
  ],
} as const;

function NavLinks({ items, pathname }: { items: readonly { href: string; label: string }[]; pathname: string }) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={cn("rounded-lg px-3 py-2.5 text-sm transition hover:bg-muted", active && "bg-muted font-medium") }>
            {item.label}
          </Link>
        );
      })}
    </SidebarMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSession();
  const isAuthenticated = Boolean(session?.user);
  const role = session?.user.role;
  const nav = role ? navByRole[role] : [];

  const handleLogout = async () => {
    await logoutSession();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl">
        {isAuthenticated ? (
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center justify-between gap-3"><div className="text-sm font-semibold tracking-tight">ScopeDesk</div><Badge variant="secondary">MVP</Badge></div>
              <Separator className="mt-4" />
            </SidebarHeader>
            <SidebarContent><NavLinks items={nav} pathname={pathname} /></SidebarContent>
            <SidebarFooter>
              <p className="mb-2 text-xs text-muted-foreground">Perfil: {session?.user.role}</p>
              <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>Sair</Button>
            </SidebarFooter>
          </Sidebar>
        ) : null}

        <main className="flex w-full min-w-0 flex-col">
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              {isAuthenticated ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon-sm" className="md:hidden"><Menu /></Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3"><div className="text-sm font-semibold tracking-tight">ScopeDesk</div><Badge variant="secondary">MVP</Badge></div>
                      <Separator className="mt-4" />
                    </div>
                    <div className="px-4 pb-6"><NavLinks items={nav} pathname={pathname} /></div>
                  </SheetContent>
                </Sheet>
              ) : null}
              <span className="truncate">Triagem • Montagem do Escopo</span>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Badge variant="outline">PT-BR</Badge>
              {isAuthenticated ? <Badge variant="outline">Enterprise</Badge> : <Button variant="outline" size="sm" onClick={() => router.push("/login")}>Entrar</Button>}
            </div>
          </header>
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
