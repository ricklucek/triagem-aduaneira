"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { listActiveClients, listAllScopeRecords, type DashboardRow } from "@/lib/scope/store-index";
import { getScopeWarnings } from "@/lib/scope/warnings";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

function formatISO(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function statusBadge(status: "draft" | "published") {
  return status === "published" ? (
    <Badge variant="secondary" className="rounded-xl">published</Badge>
  ) : (
    <Badge variant="outline" className="rounded-xl">draft</Badge>
  );
}

export default function DashboardPage() {
  const [rows, setRows] = useState<DashboardRow[]>([]);

  useEffect(() => {
    setRows(listAllScopeRecords());
  }, []);

  const clients = useMemo(() => listActiveClients(), [rows]);

  const stats = useMemo(() => {
    const drafts = rows.filter(r => r.status === "draft").length;
    const pubs = rows.filter(r => r.status === "published").length;

    // warnings: computa em cima do snapshot do Scope (data)
    let warningsCount = 0;
    for (const r of rows.slice(0, 50)) {
      try {
        const w = getScopeWarnings(r.data);
        warningsCount += w.length;
      } catch {
        // ignore no MVP
      }
    }

    return {
      clients: clients.length,
      drafts,
      published: pubs,
      warningsCount,
    };
  }, [rows, clients]);

  const recent = useMemo(() => rows.slice(0, 20), [rows]);

  // CTA fallback: se não houver cliente, usar um placeholder
  const defaultCnpj = clients[0]?.cnpj ?? "00000000000000";

  return (
    <div className="grid gap-4">
      {/* Header */}
      <Card className="rounded-2xl p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Dashboard</div>
            <div className="text-sm text-muted-foreground">
              Visão geral dos escopos (MVP localStorage)
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-xl">
              <Link href={`/clients/${defaultCnpj}/scopes/new`}>Novo escopo</Link>
            </Button>

            <Button asChild variant="outline" className="rounded-xl">
              <Link href={`/clients/${defaultCnpj}/scopes`}>Ver escopos do cliente</Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Clientes ativos</div>
          <div className="mt-1 text-2xl font-semibold">{stats.clients}</div>
          <div className="mt-1 text-xs text-muted-foreground">últimos 30 registros (visual)</div>
        </Card>

        <Card className="rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Drafts</div>
          <div className="mt-1 text-2xl font-semibold">{stats.drafts}</div>
          <div className="mt-1 text-xs text-muted-foreground">editáveis</div>
        </Card>

        <Card className="rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Publicados</div>
          <div className="mt-1 text-2xl font-semibold">{stats.published}</div>
          <div className="mt-1 text-xs text-muted-foreground">imutáveis</div>
        </Card>

        <Card className="rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Alertas (warnings)</div>
          <div className="mt-1 text-2xl font-semibold">{stats.warningsCount}</div>
          <div className="mt-1 text-xs text-muted-foreground">somatório (até 50 recentes)</div>
        </Card>
      </div>

      {/* Recent table */}
      <Card className="rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Escopos recentes</div>
            <div className="text-xs text-muted-foreground">
              Últimos {recent.length} registros (ordenados por atualização)
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Dica: abra “Ver” para published e “Editar” para draft.
          </div>
        </div>

        <Separator className="my-4" />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead>Warnings</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {recent.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-muted-foreground">
                  Nenhum escopo encontrado. Crie um “Novo escopo” para começar.
                </TableCell>
              </TableRow>
            ) : (
              recent.map((r) => {
                let wCount = 0;
                try {
                  wCount = getScopeWarnings(r.data).length;
                } catch {
                  wCount = 0;
                }

                const href =
                  r.status === "draft"
                    ? `/clients/${r.cnpj}/scopes/edit/${r.id}`
                    : `/clients/${r.cnpj}/scopes/view/${r.id}`;

                return (
                  <TableRow key={`${r.cnpj}-${r.id}`}>
                    <TableCell>
                      <div className="font-medium">{r.title ?? "(sem razão social)"}</div>
                      <div className="text-xs text-muted-foreground">{r.cnpj}</div>
                    </TableCell>

                    <TableCell>{statusBadge(r.status)}</TableCell>

                    <TableCell>
                      {r.status === "published" ? (
                        <Badge variant="outline" className="rounded-xl">v{r.version}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm">{formatISO(r.updatedAt)}</TableCell>

                    <TableCell>
                      {wCount === 0 ? (
                        <Badge variant="secondary" className="rounded-xl">0</Badge>
                      ) : (
                        <Badge variant="destructive" className="rounded-xl">{wCount}</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button asChild variant="outline" className="rounded-xl">
                        <Link href={href}>{r.status === "draft" ? "Editar" : "Ver"}</Link>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        className="ml-2 rounded-xl"
                      >
                        <Link href={`/clients/${r.cnpj}/scopes`}>Cliente</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Clients quick list */}
      <Card className="rounded-2xl p-4">
        <div className="text-sm font-semibold">Clientes (atalhos)</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Clique para ver os escopos por cliente.
        </div>

        <Separator className="my-4" />

        <div className="flex flex-wrap gap-2">
          {clients.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sem clientes ainda.</div>
          ) : (
            clients.slice(0, 20).map((c) => (
              <Button key={c.cnpj} asChild variant="outline" className="rounded-xl">
                <Link href={`/clients/${c.cnpj}/scopes`}>
                  {c.title ? c.title : c.cnpj}
                </Link>
              </Button>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}