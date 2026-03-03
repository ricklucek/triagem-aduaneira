"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clientes" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-350">
        {/* Sidebar */}
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
          <div className="mt-auto pt-4 text-xs text-muted-foreground">
            Empresa logística • Ambiente de protótipo
          </div>
        </aside>

        {/* Main */}
        <main className="flex w-full flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur">
            <div className="text-sm text-muted-foreground">Triagem • Montagem do Escopo</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">PT-BR</Badge>
              <Badge variant="outline">Enterprise</Badge>
            </div>
          </header>

          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}