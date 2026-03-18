"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasRole } from "@/lib/auth/guard";
import { useOperacaoDashboard } from "@/lib/api/hooks/use-dashboards";

export default function OperacaoPage() {
  const { data, isLoading, error } = useOperacaoDashboard();

  if (!hasRole("operacao")) return <p>Acesso restrito ao perfil operação.</p>;

  if (isLoading) return <p>Carregando métricas da operação...</p>;
  if (error || !data) return <p>Falha ao carregar o painel de operação.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Metric title="Escopos com você como responsável" value={data.responsibleScopes} />
      <Metric title="Escopos criados no último mês" value={data.createdLastMonth} />
      <Metric title="Escopos aguardando ajuste" value={data.waitingAdjustment} />
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return <Card><CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{value}</p></CardContent></Card>;
}
