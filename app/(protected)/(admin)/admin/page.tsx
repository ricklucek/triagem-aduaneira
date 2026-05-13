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

type AdminDashboardFilters = {
  status: string;
  dateFrom: string;
  dateTo: string;
  serviceCode: string;
  userId: string;
  groupBy: string;
};

const DEFAULT_FILTERS: AdminDashboardFilters = {
  status: "published",
  dateFrom: "",
  dateTo: "",
  serviceCode: "all",
  userId: "all",
  groupBy: "responsible",
};

export default function AdminDashboardPage() {
  const { data: settings } = useAdminSettings();

  const [filters, setFilters] =
    useState<AdminDashboardFilters>(DEFAULT_FILTERS);

  const dateFromIso = useMemo(
    () => parseBrazilianDateToIso(filters.dateFrom),
    [filters.dateFrom],
  );

  const dateToIso = useMemo(
    () => parseBrazilianDateToIso(filters.dateTo),
    [filters.dateTo],
  );

  const hasInvalidDateFrom =
    filters.dateFrom.length > 0 && filters.dateFrom.length === 10 && !dateFromIso;

  const hasInvalidDateTo =
    filters.dateTo.length > 0 && filters.dateTo.length === 10 && !dateToIso;

  const sharedFilters = useMemo(
    () => ({
      groupBy: filters.groupBy || undefined,
      status: filters.status || undefined,
      dateFrom: dateFromIso || undefined,
      dateTo: dateToIso || undefined,
    }),
    [filters.groupBy, filters.status, dateFromIso, dateToIso],
  );

  const metrics = useAdminDashboardMetrics(sharedFilters);

  const scopesByUser = useAdminScopesByUser({
    ...sharedFilters,
    includeScopes: true,
  });

  const services = useAdminServicesMetrics({
    ...sharedFilters,
    serviceCode:
      filters.serviceCode !== "all" ? filters.serviceCode : undefined,
  });

  const selectedUserServices = useAdminServicesByScope({
    ...sharedFilters,
    createdById: filters.userId !== "all" ? filters.userId : undefined,
    serviceCode:
      filters.serviceCode !== "all" ? filters.serviceCode : undefined,
    limit: 500,
    offset: 0,
  });

  const users = scopesByUser.data?.items ?? [];

  const selectedUser = users.find(
    (item) => item.userId === filters.userId,
  );

  const servicesFromSelectedUser = getTopServicesFromScopeItems(
    selectedUserServices.data?.items ?? [],
  );

  function updateFilter<K extends keyof AdminDashboardFilters>(
    key: K,
    value: AdminDashboardFilters[K],
  ) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  if (!hasRole("admin")) {
    return <p>Acesso restrito ao administrador.</p>;
  }

  if (!settings || metrics.isLoading || scopesByUser.isLoading || services.isLoading) {
    return <p>Carregando métricas do administrador...</p>;
  }

  if (
    metrics.error ||
    scopesByUser.error ||
    services.error ||
    selectedUserServices.error ||
    !metrics.data ||
    !scopesByUser.data ||
    !services.data
  ) {
    return <p>Falha ao carregar o painel administrativo.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Painel do Administrador</h1>
        <p className="text-sm text-muted-foreground">
          Os indicadores são atualizados automaticamente conforme os filtros são alterados.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => updateFilter("status", value)}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Publicados</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupBy">Tipo de usuário</Label>
              <Select
                value={filters.groupBy}
                onValueChange={(value) => updateFilter("groupBy", value)}
              >
                <SelectTrigger id="groupBy" className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_by">Criador do Escopo</SelectItem>
                  <SelectItem value="responsible">Responsável Comercial</SelectItem>
                  <SelectItem value="analista_da">Analista DA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceCode">Serviço</Label>
              <Select
                value={filters.serviceCode}
                onValueChange={(value) => updateFilter("serviceCode", value)}
              >
                <SelectTrigger id="serviceCode" className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {services.data.items.map((service) => (
                    <SelectItem
                      key={service.serviceCode}
                      value={service.serviceCode}
                    >
                      {service.serviceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">Usuário</Label>
              <Select
                value={filters.userId}
                onValueChange={(value) => updateFilter("userId", value)}
              >
                <SelectTrigger id="userId" className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.userId} value={user.userId}>
                      {user.userName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Data inicial</Label>
              <Input
                id="dateFrom"
                inputMode="numeric"
                placeholder="DD-MM-YYYY"
                maxLength={10}
                value={filters.dateFrom}
                onChange={(event) =>
                  updateFilter("dateFrom", maskBrazilianDate(event.target.value))
                }
                aria-invalid={hasInvalidDateFrom}
              />
              {hasInvalidDateFrom ? (
                <p className="text-xs text-destructive">
                  Informe uma data inicial válida.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Exemplo: 01-05-2026
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Data final</Label>
              <Input
                id="dateTo"
                inputMode="numeric"
                placeholder="DD-MM-YYYY"
                maxLength={10}
                value={filters.dateTo}
                onChange={(event) =>
                  updateFilter("dateTo", maskBrazilianDate(event.target.value))
                }
                aria-invalid={hasInvalidDateTo}
              />
              {hasInvalidDateTo ? (
                <p className="text-xs text-destructive">
                  Informe uma data final válida.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Exemplo: 31-05-2026
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              Filtros ativos:{" "}
              <span className="font-medium text-foreground">
                {getActiveFiltersCount(filters)}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="w-full md:w-auto"
            >
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total de escopos" value={metrics.data.totalScopes} />
        <Metric
          title="Serviços habilitados"
          value={metrics.data.totalEnabledServices}
        />
        <Metric
          title="Tipos de serviços"
          value={metrics.data.totalDistinctServices}
        />
        <Metric
          title="Escopos desatualizados"
          value={metrics.data.outdatedScopes}
        />
      </div>

      {filters.userId !== "all" && selectedUser?.scopes?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Escopos cadastrados por {selectedUser.userName}
            </CardTitle>
          </CardHeader>

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
                      <Link
                        href={`/clients/${scope.clientCnpj}/scopes/view/${scope.id}`}
                        className="underline"
                      >
                        {scope.clientName}
                      </Link>
                    </TableCell>
                    <TableCell>{scope.clientCnpj}</TableCell>
                    <TableCell>{scope.status}</TableCell>
                    <TableCell>
                      {new Date(scope.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
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
          <CardTitle>Serviços cadastrados agregado</CardTitle>
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

      {selectedUser ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Drill-down do usuário: {selectedUser.userName}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {servicesFromSelectedUser.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {servicesFromSelectedUser.map((service) => (
                  <li key={service.serviceCode}>
                    {service.name} — {service.occurrences} ocorrências —{" "}
                    {formatMoney(service.totalAmount, service.currency)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum serviço encontrado para este usuário com os filtros atuais.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function maskBrazilianDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

function parseBrazilianDateToIso(value: string) {
  if (!value) {
    return "";
  }

  if (value.length !== 10) {
    return "";
  }

  const [day, month, year] = value.split("-");

  if (!day || !month || !year) {
    return "";
  }

  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (
    !Number.isInteger(dayNumber) ||
    !Number.isInteger(monthNumber) ||
    !Number.isInteger(yearNumber)
  ) {
    return "";
  }

  if (year.length !== 4 || yearNumber < 1900) {
    return "";
  }

  if (monthNumber < 1 || monthNumber > 12) {
    return "";
  }

  const lastDayOfMonth = new Date(yearNumber, monthNumber, 0).getDate();

  if (dayNumber < 1 || dayNumber > lastDayOfMonth) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

function getActiveFiltersCount(filters: AdminDashboardFilters) {
  let count = 0;

  if (filters.status !== DEFAULT_FILTERS.status) count += 1;
  if (filters.groupBy !== DEFAULT_FILTERS.groupBy) count += 1;
  if (filters.serviceCode !== DEFAULT_FILTERS.serviceCode) count += 1;
  if (filters.userId !== DEFAULT_FILTERS.userId) count += 1;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;

  return count;
}

function getTopServicesFromScopeItems(
  items: Array<{
    serviceCode: string;
    serviceName: string;
    amount: number;
    currency: string;
  }>,
) {
  const aggregation = new Map<
    string,
    {
      name: string;
      occurrences: number;
      totalAmount: number;
      currency: string;
    }
  >();

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
    .map(([serviceCode, values]) => ({
      serviceCode,
      ...values,
    }))
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
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}