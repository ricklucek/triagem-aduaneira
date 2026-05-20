"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminDashboardMetrics, useAdminScopesByUser, useAdminServicesMetrics } from "@/lib/api/hooks/use-dashboards";
import type { ScopeByUserItem, ServiceMetricItem } from "@/lib/api/types/dashboard-api";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type ServiceCategory = "importacao" | "exportacao";

export default function AdminDashboardPanel() {
  const metrics = useAdminDashboardMetrics({ status: "published", groupBy: "responsible" });
  const scopesByUser = useAdminScopesByUser({ status: "published", groupBy: "responsible", includeScopes: true });
  const services = useAdminServicesMetrics({ status: "published", groupBy: "responsible" });
  const isMobile = useIsMobile();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>("importacao");
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  const users = useMemo(() => scopesByUser.data?.items ?? [], [scopesByUser.data?.items]);
  const sectorOptions = useMemo(() => {
    const sectors = Array.from(new Set(users.map((item) => item.userSetor).filter(Boolean)));
    return sectors.sort((a, b) => a.localeCompare(b));
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (sectorFilter === "all") return users;
    return users.filter((item) => item.userSetor === sectorFilter);
  }, [users, sectorFilter]);

  const selectedUser = filteredUsers.find((item) => item.userId === selectedUserId) ?? users.find((item) => item.userId === selectedUserId) ?? null;

  const filteredServices = useMemo(() => {
    const operation = serviceCategory === "importacao" ? "importacao" : "exportacao";
    return (services.data?.items ?? []).filter((item) => item.operationType.toLowerCase() === operation);
  }, [serviceCategory, services.data?.items]);

  if (metrics.isLoading || scopesByUser.isLoading || services.isLoading) return <p>Carregando dashboard...</p>;
  if (metrics.error || scopesByUser.error || services.error || !metrics.data) return <p>Falha ao carregar dashboard.</p>;

  return (
    <main className="w-full flex flex-col gap-6 p-2 md:p-4">
      <MetricsSection totalScopes={metrics.data.totalScopes} outdatedScopes={metrics.data.outdatedScopes} />

      <ScopesBySectorSection
        users={filteredUsers}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUserId}
        isMobile={Boolean(isMobile)}
        sectorFilter={sectorFilter}
        onSectorChange={setSectorFilter}
        sectorOptions={sectorOptions}
      />

      <ServicesSection
        items={filteredServices}
        serviceCategory={serviceCategory}
        onServiceCategoryChange={setServiceCategory}
      />
    </main>
  );
}

function MetricsSection({ totalScopes, outdatedScopes }: { totalScopes: number; outdatedScopes: number }) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardCard title="Total de escopos"><div className="text-3xl font-bold text-high -mt-5">{totalScopes}</div></DashboardCard>
      <DashboardCard title="Escopos por mês"><div className="text-3xl font-bold text-high -mt-5">-</div></DashboardCard>
      <DashboardCard title="Escopos por semana"><div className="text-3xl font-bold text-high -mt-5">-</div></DashboardCard>
      <DashboardCard title="Escopos desatualizados"><div className="text-3xl font-bold text-high -mt-5">{outdatedScopes}</div></DashboardCard>
    </section>
  );
}

function ScopesBySectorSection({ users, selectedUser, onSelectUser, isMobile, sectorFilter, onSectorChange, sectorOptions }: {
  users: ScopeByUserItem[];
  selectedUser: ScopeByUserItem | null;
  onSelectUser: (value: string | null) => void;
  isMobile: boolean;
  sectorFilter: string;
  onSectorChange: (value: string) => void;
  sectorOptions: string[];
}) {
  const scopesTable = selectedUser ? <UserScopesTable scopes={selectedUser.scopes ?? []} /> : null;

  const usersTable = (
    <Table>
      <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Setor</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
      <TableBody>
        {users.map((item) => (
          <TableRow key={item.userId} onClick={() => onSelectUser(item.userId)} className="cursor-pointer">
            <TableCell>{item.userName}</TableCell>
            <TableCell>{item.userSetor || "-"}</TableCell>
            <TableCell>{item.totalScopes}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <>
      {isMobile ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Escopos por setor</CardTitle>
            <SectorFilterDropdown sectorFilter={sectorFilter} onSectorChange={onSectorChange} sectorOptions={sectorOptions} />
          </CardHeader>
          <CardContent>{usersTable}</CardContent>
        </Card>
      ) : (
        <ResizablePanelGroup orientation="horizontal" className="min-h-[420px] rounded-lg border">
          <ResizablePanel defaultSize={45} minSize={35}>
            <Card className="h-full rounded-none border-0">
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Escopos por setor</CardTitle><SectorFilterDropdown sectorFilter={sectorFilter} onSectorChange={onSectorChange} sectorOptions={sectorOptions} /></CardHeader>
              <CardContent>{usersTable}</CardContent>
            </Card>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={55} minSize={35}>
            <Card className="h-full rounded-none border-0">
              <CardHeader><CardTitle>{selectedUser ? `Escopos cadastrados por ${selectedUser.userName}` : "Selecione um usuário"}</CardTitle></CardHeader>
              <CardContent>{selectedUser ? scopesTable : <p className="text-sm text-muted-foreground">Selecione um nome na tabela para abrir os escopos.</p>}</CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      <Sheet open={Boolean(isMobile && selectedUser)} onOpenChange={(open) => !open && onSelectUser(null)}>
        <SheetContent side="bottom" className="h-[100dvh] w-full max-w-none rounded-none border-0 p-0">
          <SheetHeader><SheetTitle>{selectedUser ? `Escopos cadastrados por ${selectedUser.userName}` : "Escopos"}</SheetTitle></SheetHeader>
          <div className="overflow-auto px-4 pb-4">{scopesTable}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function UserScopesTable({ scopes }: { scopes: NonNullable<ScopeByUserItem["scopes"]> }) {
  return (
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
        {scopes.map((scope) => (
          <TableRow key={scope.id}>
            <TableCell><Link href={`/clients/${scope.clientCnpj}/scopes/view/${scope.id}`} className="underline">{scope.clientName}</Link></TableCell>
            <TableCell>{scope.clientCnpj}</TableCell>
            <TableCell>{scope.status}</TableCell>
            <TableCell>{new Date(scope.createdAt).toLocaleDateString("pt-BR")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ServicesSection({ items, serviceCategory, onServiceCategoryChange }: { items: ServiceMetricItem[]; serviceCategory: ServiceCategory; onServiceCategoryChange: (value: ServiceCategory) => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Serviços cadastrados agregado</CardTitle>
        <ServiceFilterDropdown serviceCategory={serviceCategory} onServiceCategoryChange={onServiceCategoryChange} />
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const percentage = Math.max(2, Math.min(100, item.occurrencesPercentage));
          return (
            <div key={item.serviceCode} className="space-y-1">
              <div className="flex items-center justify-between text-sm"><span>{item.serviceName}</span><span className="text-muted-foreground">{item.totalScopes} escopos</span></div>
              <div className="h-5 w-full rounded-full bg-muted/60 overflow-hidden" title={`${item.serviceName}: ${item.totalScopes} escopos (${item.occurrencesPercentage}%)`}>
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ServiceFilterDropdown({ serviceCategory, onServiceCategoryChange }: { serviceCategory: ServiceCategory; onServiceCategoryChange: (value: ServiceCategory) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filtros</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Categoria</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={serviceCategory} onValueChange={(value) => onServiceCategoryChange(value as ServiceCategory)}>
          <DropdownMenuRadioItem value="importacao">Importação</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="exportacao">Exportação</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SectorFilterDropdown({ sectorFilter, onSectorChange, sectorOptions }: { sectorFilter: string; onSectorChange: (value: string) => void; sectorOptions: string[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filtros</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Setor</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={sectorFilter} onValueChange={onSectorChange}>
          <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
          {sectorOptions.map((sector) => (
            <DropdownMenuRadioItem key={sector} value={sector}>{sector}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
