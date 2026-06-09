import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const settingsSections = [
  {
    title: "Gerenciar contas de usuário",
    description: "Gerencie contas de usuário com acesso a plataforma",
    href: "/settings/users",
    icon: UsersRound,
  },
  {
    title: "Prepostos",
    description: "Gerencie informações de prepostos utilizadas em cadastros",
    href: "/settings/prepostos",
    icon: UserCog,
  },
  {
    title: "Minha organização",
    description: "Configure as informações globais da sua organização",
    href: "/settings/organization",
    icon: Building2,
  },
  {
    title: "Acesso as ferramentas",
    description: "Habilite os acessos dos seus usuários nas ferramentas disponíveis",
    href: "/settings/tools-access",
    icon: ShieldCheck,
  },
];

export default function GeneralSettingsPage() {
  return (
    <main className="w-full min-h-screen p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Configurações gerais</h1>
          <p className="text-sm text-muted-foreground">
            Selecione uma seção para gerenciar as informações cadastradas no sistema.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {settingsSections.map((section) => (
            <Link key={section.href} href={section.href} className="group h-full">
              <Card className="h-full transition-colors hover:border-primary/60 hover:bg-muted/40">
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg border bg-background p-2">
                      <section.icon className="size-5" />
                    </div>
                    <div className="space-y-2">
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-primary">Acessar seção</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
