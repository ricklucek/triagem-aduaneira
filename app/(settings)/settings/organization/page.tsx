"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminFixedInfoSheet } from "@/components/settings/admin-fixed-info-sheet";
import { useAdminSettings } from "@/lib/api/hooks/use-dashboards";
import { hasRole } from "@/lib/auth/guard";

export default function OrganizationSettingsPage() {
  const { data, isLoading } = useAdminSettings();

  if (!hasRole("admin")) return <p>Acesso restrito ao administrador.</p>;

  return (
    <main className="w-full min-h-screen p-6">
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Minha organização</CardTitle>
          <CardDescription>
            Configure as informações globais da sua organização utilizadas pela plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Carregando informações da organização...</p> : null}
          {!isLoading && data ? <AdminFixedInfoSheet initial={data} /> : null}
          {!isLoading && !data ? <p>Não foi possível carregar as configurações da organização.</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
