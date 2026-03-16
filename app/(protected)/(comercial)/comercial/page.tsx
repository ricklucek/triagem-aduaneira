"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasRole } from "@/lib/auth/guard";
import { useComercialDashboard } from "@/lib/api/hooks/use-dashboards";

export default function ComercialPage() {
  const { data, isLoading, error } = useComercialDashboard();

  if (!hasRole("comercial")) return <p>Acesso restrito ao perfil comercial.</p>;

  if (isLoading) return <p>Carregando métricas do comercial...</p>;
  if (error || !data) return <p>Falha ao carregar o painel comercial.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Metric title="Escopos com você como responsável" value={data.responsibleScopes} />
      <Metric title="Média de venda dos serviços" value={data.salesAveragePrice} prefix="R$ " />
      <Metric title="Escopos criados no último mês com você responsável" value={data.createdLastMonthAsResponsible} />
    </div>
  );
}

function Metric({ title, value, prefix = "" }: { title: string; value: number; prefix?: string }) {
  return <Card><CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{prefix}{value}</p></CardContent></Card>;
}
