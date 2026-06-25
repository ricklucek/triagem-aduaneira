"use client";

import { usePrepostosLookup } from "@/lib/api/hooks/use-dashboards";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrepostoLookupItem } from "@/lib/api/types/public-api";

export default function SettingsPrepostosPage() {
  const params = useSearchParams();

  const cidade = params.get('cidade') || "";
  const operacao = params.get('operacao') || "";

  const { data, isLoading, error } = usePrepostosLookup({
    cidade,
    operacao,
  });

  return (
    <div className="space-y-6 w-full">

      {isLoading && <p>Carregando contatos de prepostos...</p>}
      {error && <p>Falha ao carregar configurações.</p>}

      {!isLoading && !error && data ? (
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Contatos de prepostos</CardTitle>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Total: {data.total}
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Localidade</TableHead>
                    <TableHead>Operação</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Contato</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data.items.length > 0 ? (
                    data.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell>{formatLocalidade(item)}</TableCell>
                        <TableCell>{item.operacao ?? "-"}</TableCell>
                        <TableCell>{item.valorDescricao ?? item.valor ?? "-"}</TableCell>
                        <TableCell>{item.contatoNome ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function formatLocalidade(item: PrepostoLookupItem) {
  const base = [item.cidade, item.uf].filter(Boolean).join(" / ");
  if (item.descricaoLocal) {
    return base ? `${base} - ${item.descricaoLocal}` : item.descricaoLocal;
  }
  return base || "-";
}