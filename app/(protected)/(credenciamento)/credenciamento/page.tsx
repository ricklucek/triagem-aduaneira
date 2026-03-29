"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasRole } from "@/lib/auth/guard";
import { useCredenciamentoDashboard } from "@/lib/api/hooks/use-dashboards";

export default function CredenciamentoPage() {
  const { data, isLoading, error } = useCredenciamentoDashboard();

  if (!hasRole("credenciamento"))
    return <p>Acesso restrito ao perfil credenciamento.</p>;

  if (isLoading) return <p>Carregando métricas do credenciamento...</p>;
  if (error || !data)
    return <p>Falha ao carregar o painel de credenciamento.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric
        title="Escopos criados no último mês"
        value={data.createdLastMonth}
      />
      <Metric title="Escopos vencidos" value={data.expiredScopes} />
      <Metric title="Escopos criados por você" value={data.createdByUser} />
      <Metric
        title="Escopos aguardando ajuste"
        value={data.waitingAdjustment}
      />
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
