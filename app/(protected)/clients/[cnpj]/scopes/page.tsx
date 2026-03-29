"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { RotateCw } from "lucide-react";
import { scopeApi } from "@/lib/api/services/scopes";
import { useScopes } from "@/lib/api/hooks/use-scope-api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const { data, error, isLoading, mutate } = useScopes({
    cnpj,
    limit: 500,
    offset: 0,
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const drafts = useMemo(
    () => items.filter((r) => r.status === "draft"),
    [items],
  );
  const published = useMemo(
    () => items.filter((r) => r.status === "published"),
    [items],
  );

  async function cloneFromPublished(scopeId: string) {
    try {
      const rec = await scopeApi.getScope(scopeId);
      const created = await scopeApi.createScope();
      await scopeApi.saveScopeDraft({
        id: created.id,
        draft: {
          ...rec.draft,
        },
      });
      await mutate();
      alert("Draft clonado a partir da versão publicada.");
    } catch {
      alert("Falha ao clonar versão publicada.");
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-lg font-semibold tracking-tight">
              Escopos • {cnpj}
            </div>
            <div className="text-sm text-muted-foreground">
              Gestão de rascunhos e documentos publicados.
            </div>
          </div>

          <Button asChild className="rounded-xl">
            <Link href={`/clients/${cnpj}/scopes/new`}>Novo escopo</Link>
          </Button>
        </div>

        <Separator className="my-4" />

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RotateCw className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">
            Falha ao carregar escopos.
          </div>
        ) : (
          <div className="grid gap-6">
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
                      <TableCell
                        colSpan={4}
                        className="text-sm text-muted-foreground"
                      >
                        Nenhum draft ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    drafts.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.razao_social || "(sem razão social)"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.id}
                        </TableCell>
                        <TableCell>{formatISO(r.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            asChild
                            variant="outline"
                            className="rounded-xl"
                          >
                            <Link href={`/clients/${cnpj}/scopes/edit/${r.id}`}>
                              Editar
                            </Link>
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
                      <TableCell
                        colSpan={5}
                        className="text-sm text-muted-foreground"
                      >
                        Nenhuma versão publicada ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    published.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          {r.razao_social || "(sem razão social)"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.id}
                        </TableCell>
                        <TableCell>{formatISO(r.updated_at)}</TableCell>
                        <TableCell>v{r.version_count}</TableCell>
                        <TableCell className="space-x-2 text-right">
                          <Button
                            asChild
                            variant="secondary"
                            className="rounded-xl"
                          >
                            <Link href={`/clients/${cnpj}/scopes/view/${r.id}`}>
                              Visualizar
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => cloneFromPublished(r.id)}
                          >
                            Clonar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </section>
          </div>
        )}
      </Card>
    </div>
  );
}
