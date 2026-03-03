"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useScopeStore } from "@/lib/scope/use-scope-store";

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

export default function ScopesPage({ params }: { params: { cnpj: string } }) {
  const { records, loading, cloneLatestPublished, remove } = useScopeStore(params.cnpj);

  const drafts = useMemo(() => records.filter((r) => r.status === "draft"), [records]);
  const published = useMemo(() => records.filter((r) => r.status === "published"), [records]);

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-lg font-semibold">Escopos • {params.cnpj}</div>
            <div className="text-sm text-muted-foreground">Drafts e versões publicadas (localStorage)</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild className="rounded-xl">
              <Link href={`/clients/${params.cnpj}/scopes/new`}>Novo escopo (wizard)</Link>
            </Button>

            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                const r = cloneLatestPublished();
                if (!r) alert("Nenhuma versão publicada para clonar.");
                else alert("Draft clonado! Abra o wizard para editar.");
              }}
            >
              Clonar última published → draft
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <div className="grid gap-6">
            {/* Drafts */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="text-sm font-semibold">Drafts</div>
                <Badge variant="secondary">{drafts.length}</Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-muted-foreground">
                        Nenhum draft ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    drafts.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.title ?? "(sem razão social)"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.id}</TableCell>
                        <TableCell>{formatISO(r.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => alert("Para editar um draft, vamos ligar isso ao wizard na próxima iteração.")}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            className="ml-2 rounded-xl"
                            onClick={() => remove(r.id)}
                          >
                            Excluir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Published */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="text-sm font-semibold">Publicados</div>
                <Badge variant="secondary">{published.length}</Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Versão</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {published.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-muted-foreground">
                        Nenhuma versão publicada ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    published.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">v{r.version}</TableCell>
                        <TableCell>{r.title ?? "(sem razão social)"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.id}</TableCell>
                        <TableCell>{formatISO(r.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => alert("Viewer de snapshot: na próxima iteração eu te mando /view/[id].")}
                          >
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            className="ml-2 rounded-xl"
                            onClick={() => {
                              const draft = cloneLatestPublished(r.id);
                              if (!draft) alert("Falha ao clonar.");
                              else alert("Draft clonado a partir desta published.");
                            }}
                          >
                            Clonar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}