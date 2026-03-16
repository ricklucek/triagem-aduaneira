"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { hasRole } from "@/lib/auth/guard";
import { useAdminDashboard } from "@/lib/api/hooks/use-dashboards";

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();
  if (!hasRole("admin")) return <p>Acesso restrito ao administrador.</p>;

  if (isLoading) return <p>Carregando métricas do administrador...</p>;
  if (error || !data) return <p>Falha ao carregar o painel administrativo.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Painel do Administrador</h1>
        <Link href="/admin/users">
          <Button>Gerenciar usuários</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Metric title="Escopos criados no último mês" value={data.createdLastMonth} />
        <Metric title="Escopos desatualizados" value={data.outdatedScopes} />
        <Metric title="Total de escopos" value={data.totalScopes} />
        <Metric title="Média cobrada pelo comercial" value={data.comercialAveragePrice} prefix="R$ " />
      </div>

      <Card>
        <CardHeader><CardTitle>Escopos por responsável</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Responsável</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.scopesByPerson.map((item) => (
                <TableRow key={item.group}><TableCell>{item.group}</TableCell><TableCell>{item.total}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Escopos por setor</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Setor</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.scopesBySector.map((item) => (
                <TableRow key={item.group}><TableCell>{item.group}</TableCell><TableCell>{item.total}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, prefix = "" }: { title: string; value: number; prefix?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent><p className="text-3xl font-semibold">{prefix}{value}</p></CardContent>
    </Card>
  );
}
