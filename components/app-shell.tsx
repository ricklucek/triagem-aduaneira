"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth/session-storage";
import { logoutSession } from "@/lib/api/hooks/use-auth";

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = getAuthSession();
  const isAuthenticated = Boolean(session?.user);
  const role = session?.user.role;
  const nav = role ? navByRole[role] : [];

  const handleLogout = async () => {
    await logoutSession();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-350">
        {isAuthenticated && (
        <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold tracking-tight">ScopeDesk</div>
            <Badge variant="secondary">MVP</Badge>
          </div>
          <Separator className="my-4" />
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm transition hover:bg-muted",
                    active && "bg-muted font-medium"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-2 pt-4 text-xs text-muted-foreground">
            <p>Perfil: {session?.user.role ?? "não autenticado"}</p>
            {session?.user && (
              <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                Sair
              </Button>
            )}
          </div>
        </aside>
      )}

        <main className="flex w-full flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur">
            <div className="text-sm text-muted-foreground">Triagem • Montagem do Escopo</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">PT-BR</Badge>
              {isAuthenticated ? (
                <Badge variant="outline">Enterprise</Badge>
              ) : (
                <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
                  Entrar
                </Button>
              )}
            </div>
          </header>

          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
