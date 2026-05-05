"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hasRole } from "@/lib/auth/guard";
import {
  useAdminDashboardMetrics,
  useAdminScopesByUser,
  useAdminServicesByScope,
  useAdminServicesMetrics,
  useAdminSettings,
} from "@/lib/api/hooks/use-dashboards";

export default function AdminDashboardPage() {
  const { data: settings } = useAdminSettings();
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [serviceCode, setServiceCode] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const sharedFilters = useMemo(
    () => ({
      status: status || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [dateFrom, dateTo, status],
  );

  const metrics = useAdminDashboardMetrics(sharedFilters);
  const scopesByUser = useAdminScopesByUser({ ...sharedFilters, includeScopes: true });
  const services = useAdminServicesMetrics({
    ...sharedFilters,
    serviceCode: serviceCode || undefined,
  });

  const selectedUser = scopesByUser.data?.items.find((item) => item.userId === selectedUserId) ?? null;
  const selectedUserServices = useAdminServicesByScope({
    ...sharedFilters,
    createdById: selectedUserId || undefined,
    serviceCode: serviceCode || undefined,
    limit: 500,
    offset: 0,
  });
  const servicesFromSelectedUser = getTopServicesFromScopeItems(selectedUserServices.data?.items ?? []);

  if (!hasRole("admin")) return <p>Acesso restrito ao administrador.</p>;
  if (!settings || metrics.isLoading || scopesByUser.isLoading || services.isLoading) {
    return <p>Carregando métricas do administrador...</p>;
  }
  if (metrics.error || scopesByUser.error || services.error || selectedUserServices.error || !metrics.data || !scopesByUser.data || !services.data) {
    return <p>Falha ao carregar o painel administrativo.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Painel do Administrador</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input placeholder="Status (ex: published)" value={status} onChange={(e) => setStatus(e.target.value)} />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Input placeholder="Código do serviço" value={serviceCode} onChange={(e) => setServiceCode(e.target.value)} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total de escopos" value={metrics.data.totalScopes} />
        <Metric title="Serviços habilitados" value={metrics.data.totalEnabledServices} />
        <Metric title="Tipos de serviços" value={metrics.data.totalDistinctServices} />
        <Metric title="Valor total de serviços" value={metrics.data.totalServicesAmount} prefix="R$ " />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escopos por usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Total escopos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopesByUser.data.items.map((item) => (
                <TableRow
                  key={item.userId}
                  className="cursor-pointer"
                  onClick={() => setSelectedUserId(item.userId)}
                >
                  <TableCell>{item.userName}</TableCell>
                  <TableCell>{item.userEmail}</TableCell>
                  <TableCell>{item.userSetor}</TableCell>
                  <TableCell>{item.totalScopes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Serviços cadastrados (agregado)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Ocorrências</TableHead>
                <TableHead>Escopos</TableHead>
                <TableHead>Valor total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.data.items.map((item) => (
                <TableRow key={item.serviceCode}>
                  <TableCell>{item.serviceName}</TableCell>
                  <TableCell>{item.operationType}</TableCell>
                  <TableCell>{item.totalOccurrences}</TableCell>
                  <TableCell>{item.totalScopes}</TableCell>
                  <TableCell>{formatMoney(item.totalAmount, item.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Drill-down do usuário: {selectedUser.userName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Escopos cadastrados</p>
              <ul className="list-disc pl-5">
                {selectedUser.scopes?.map((scope) => (
                  <li key={scope.id}>{scope.clientName} — {scope.status}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Serviços mais vendidos (top 5)</p>
              <ul className="list-disc pl-5">
                {servicesFromSelectedUser.map((service) => (
                  <li key={service.serviceCode}>
                    {service.name} — {service.occurrences} ocorrências — {formatMoney(service.totalAmount, service.currency)}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


function getTopServicesFromScopeItems(items: Array<{ serviceCode: string; serviceName: string; amount: number; currency: string }>) {
  const aggregation = new Map<string, { name: string; occurrences: number; totalAmount: number; currency: string }>();

  for (const item of items) {
    const current = aggregation.get(item.serviceCode) ?? {
      name: item.serviceName,
      occurrences: 0,
      totalAmount: 0,
      currency: item.currency,
    };
    current.occurrences += 1;
    current.totalAmount += item.amount ?? 0;
    aggregation.set(item.serviceCode, current);
  }

  return Array.from(aggregation.entries())
    .map(([serviceCode, values]) => ({ serviceCode, ...values }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 5);
}

function formatMoney(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

function Metric({
  title,
  value,
  prefix = "",
}: {
  title: string;
  value: number;
  prefix?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">
          {prefix}
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
