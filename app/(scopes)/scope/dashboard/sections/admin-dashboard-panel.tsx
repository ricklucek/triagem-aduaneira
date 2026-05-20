"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminDashboardMetrics, useAdminScopesByUser, useAdminServicesMetrics } from "@/lib/api/hooks/use-dashboards";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

type ServiceCategory = "importacao" | "exportacao";

export default function AdminDashboardPanel() {
  const metrics = useAdminDashboardMetrics({ status: "published", groupBy: "responsible" });
  const scopesByUser = useAdminScopesByUser({ status: "published", groupBy: "responsible", includeScopes: true });
  const services = useAdminServicesMetrics({ status: "published", groupBy: "responsible" });
  const isMobile = useIsMobile();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>("importacao");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const users = scopesByUser.data?.items ?? [];
  const selectedUser = users.find((item) => item.userId === selectedUserId) ?? null;

  const filteredServices = useMemo(() => {
    const operation = serviceCategory === "importacao" ? "importacao" : "exportacao";
    return (services.data?.items ?? []).filter((item) => item.operationType.toLowerCase() === operation);
  }, [serviceCategory, services.data?.items]);

  if (metrics.isLoading || scopesByUser.isLoading || services.isLoading) return <p>Carregando dashboard...</p>;
  if (metrics.error || scopesByUser.error || services.error || !metrics.data) return <p>Falha ao carregar dashboard.</p>;

  const scopesTable = (
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
        {selectedUser?.scopes?.map((scope) => (
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

  return (
    <main className="w-full flex flex-col gap-6 p-2 md:p-4">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Total de escopos"><div className="text-3xl font-bold text-high -mt-5">{metrics.data.totalScopes}</div></DashboardCard>
        <DashboardCard title="Escopos por mês"><div className="text-3xl font-bold text-high -mt-5">-</div></DashboardCard>
        <DashboardCard title="Escopos por semana"><div className="text-3xl font-bold text-high -mt-5">-</div></DashboardCard>
        <DashboardCard title="Escopos desatualizados"><div className="text-3xl font-bold text-high -mt-5">{metrics.data.outdatedScopes}</div></DashboardCard>
      </section>

      {isMobile ? (
        <Card>
          <CardHeader><CardTitle>Escopos por setor</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody>
              {users.map((item) => <TableRow key={item.userId} onClick={() => setSelectedUserId(item.userId)} className="cursor-pointer"><TableCell>{item.userName}</TableCell><TableCell>{item.totalScopes}</TableCell></TableRow>)}
            </TableBody></Table>
          </CardContent>
        </Card>
      ) : (
        <ResizablePanelGroup orientation="horizontal" className="min-h-[420px] rounded-lg border">
          <ResizablePanel defaultSize={45} minSize={35}>
            <Card className="h-full rounded-none border-0"><CardHeader><CardTitle>Escopos por setor</CardTitle></CardHeader><CardContent>
              <Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody>
                {users.map((item) => <TableRow key={item.userId} onClick={() => setSelectedUserId(item.userId)} className="cursor-pointer"><TableCell>{item.userName}</TableCell><TableCell>{item.totalScopes}</TableCell></TableRow>)}
              </TableBody></Table>
            </CardContent></Card>
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

      <Dialog open={Boolean(isMobile && selectedUser)} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{selectedUser ? `Escopos cadastrados por ${selectedUser.userName}` : "Escopos"}</DialogTitle></DialogHeader>
          {scopesTable}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Serviços cadastrados agregado</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsFilterOpen((prev) => !prev)}><Filter className="mr-2 h-4 w-4" />Filtros</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFilterOpen ? (
            <div className="max-w-xs">
              <Select value={serviceCategory} onValueChange={(value) => setServiceCategory(value as ServiceCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="importacao">Importação</SelectItem>
                  <SelectItem value="exportacao">Exportação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-3">
            {filteredServices.map((item) => {
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
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
