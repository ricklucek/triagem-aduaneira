"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getScopeRepo } from "@/data/scope/getScopeRepo";
import type { ScopeSummary } from "@/data/scope/ScopeRepo";
import { useParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

function formatISO(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export default function ScopesPage() {
  const { cnpj } = useParams<{ cnpj: string }>();
  const repo = useMemo(() => getScopeRepo(), []);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ScopeSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await repo.listScopes({ cnpj, limit: 500, offset: 0 });
        if (!cancelled) setItems(res.items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cnpj, repo]);

  const drafts = items.filter((r) => r.status === "draft");
  const published = items.filter((r) => r.status === "published");

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl border bg-card p-4 shadow-sm">
      <Card className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-lg font-semibold tracking-tight">Escopos • {cnpj}</div>
            <div className="text-sm text-muted-foreground">Gestão de rascunhos e documentos publicados.</div>
          </div>

          <Button asChild className="rounded-xl">
            <Link href={`/clients/${cnpj}/scopes/new`}>Novo escopo</Link>
          </Button>
        </div>

        <Separator className="my-4" />

        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <div className="grid gap-6">
            <section>
            <section>
              <div className="mb-2 flex items-center gap-2">
                <div className="text-sm font-semibold">Drafts</div>
                <Badge variant="secondary">{drafts.length}</Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-muted-foreground">Nenhum draft ainda.</TableCell>
                    </TableRow>
                  ) : (
                    drafts.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.razao_social || "(sem razão social)"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.id}</TableCell>
                        <TableCell>{formatISO(r.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" className="rounded-xl">
                            <Link href={`/clients/${cnpj}/scopes/edit/${r.id}`}>Editar</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </section>

            <section>
              <div className="mb-2 flex items-center gap-2">
                <div className="text-sm font-semibold">Publicados</div>
                <Badge variant="secondary">{published.length}</Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead>Versões</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {published.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-muted-foreground">Nenhuma versão publicada ainda.</TableCell>
                    </TableRow>
                  ) : (
                    published.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.razao_social || "(sem razão social)"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.id}</TableCell>
                        <TableCell>{formatISO(r.updated_at)}</TableCell>
                        <TableCell>v{r.version_count}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="secondary" className="rounded-xl">
                            <Link href={`/clients/${cnpj}/scopes/view/${r.id}`}>Visualizar</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </section>
            </section>
          </div>
        )}
      </Card>
    </div>
  );
}

