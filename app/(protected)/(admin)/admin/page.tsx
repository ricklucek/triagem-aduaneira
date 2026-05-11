"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const [draftFilters, setDraftFilters] = useState({
    status: "published",
    dateFrom: "",
    dateTo: "",
    serviceCode: "all",
    userId: "all",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    status: "published",
    dateFrom: "",
    dateTo: "",
    serviceCode: "all",
    userId: "all",
  });

  const sharedFilters = useMemo(
    () => ({
      status: appliedFilters.status || undefined,
      dateFrom: appliedFilters.dateFrom || undefined,
      dateTo: appliedFilters.dateTo || undefined,
    }),
    [appliedFilters],
  );

  const metrics = useAdminDashboardMetrics(sharedFilters);
  const scopesByUser = useAdminScopesByUser({ ...sharedFilters, includeScopes: true });
  const services = useAdminServicesMetrics({
    ...sharedFilters,
    serviceCode: appliedFilters.serviceCode !== "all" ? appliedFilters.serviceCode : undefined,
  });

  const selectedUserServices = useAdminServicesByScope({
    ...sharedFilters,
    createdById: appliedFilters.userId !== "all" ? appliedFilters.userId : undefined,
    serviceCode: appliedFilters.serviceCode !== "all" ? appliedFilters.serviceCode : undefined,
    limit: 500,
    offset: 0,
  });

  const users = scopesByUser.data?.items ?? [];
  const selectedUser = users.find((item) => item.userId === appliedFilters.userId);
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
      <h1 className="text-2xl font-semibold">Painel do Administrador</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"
            onSubmit={(e) => {
              e.preventDefault();
              setAppliedFilters(draftFilters);
            }}
          >
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={draftFilters.status} onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Publicados</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Data inicial</Label>
              <Input type="date" value={draftFilters.dateFrom} onChange={(e) => setDraftFilters((prev) => ({ ...prev, dateFrom: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Data final</Label>
              <Input type="date" value={draftFilters.dateTo} onChange={(e) => setDraftFilters((prev) => ({ ...prev, dateTo: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <Label>Serviço</Label>
              <Select value={draftFilters.serviceCode} onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, serviceCode: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {services.data.items.map((service) => (
                    <SelectItem key={service.serviceCode} value={service.serviceCode}>{service.serviceName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Usuário</Label>
              <Select value={draftFilters.userId} onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, userId: value }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.userId} value={user.userId}>{user.userName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full">Aplicar filtros</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total de escopos" value={metrics.data.totalScopes} />
        <Metric title="Serviços habilitados" value={metrics.data.totalEnabledServices} />
        <Metric title="Tipos de serviços" value={metrics.data.totalDistinctServices} />
        <Metric title="Escopos desatualizados" value={metrics.data.outdatedScopes} />
      </div>

      {appliedFilters.userId !== "all" && selectedUser?.scopes?.length ? (
        <Card>
          <CardHeader><CardTitle>Escopos cadastrados por {selectedUser.userName}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data criação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedUser.scopes.map((scope) => (
                  <TableRow key={scope.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/clients/${scope.clientCnpj}/scopes/view/${scope.id}`} className="underline">
                        {scope.clientName}
                      </Link>
                    </TableCell>
                    <TableCell>{scope.clientCnpj}</TableCell>
                    <TableCell>{scope.status}</TableCell>
                    <TableCell>{new Date(scope.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

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
              {users.map((item) => (
                <TableRow key={item.userId}>
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
                <TableHead>% contratação</TableHead>
                <TableHead>Escopos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.data.items.map((item) => (
                <TableRow key={item.serviceCode}>
                  <TableCell>{item.serviceName}</TableCell>
                  <TableCell>{item.operationType}</TableCell>
                  <TableCell>{item.occurrencesPercentage} %</TableCell>
                  <TableCell>{item.totalScopes}</TableCell>
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
          <CardContent>
            <ul className="list-disc pl-5">
              {servicesFromSelectedUser.map((service) => (
                <li key={service.serviceCode}>
                  {service.name} — {service.occurrences} ocorrências — {formatMoney(service.totalAmount, service.currency)}
                </li>
              ))}
            </ul>
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

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
