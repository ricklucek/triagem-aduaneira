"use client";

import { Plus, RotateCw, Search } from "lucide-react";
import { TextInput } from "@/components/ui/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClients } from "@/lib/api/hooks/use-clients-api";
import { formatCNPJ, isCNPJ } from "@/utils/format";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

type ListTableProps = {
  onOpenScope: (scopeId: string) => void;
  onCreateScope: (clientId: string) => void;
};

export default function ClientsPage({
  onOpenScope,
  onCreateScope,
}: ListTableProps) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      q: isCNPJ(q) ? undefined : q,
      cnpj: isCNPJ(q) ? q.replace(/\D/g, "") : undefined,
      limit: 100,
      offset: page - 1,
    }),
    [page, q],
  );

  const { data, isLoading, error } = useClients(params);
  const items = data?.items ?? [];

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col bg-background/80 p-2 md:p-4 gap-4 border-b">
        <div className="flex flex-row items-center gap-2">
          <Search size={20} />
          <h2 className="text-sm font-semibold tracking-tight">Filtros</h2>
        </div>

        <TextInput
          placeholder="Buscar por razão social ou CNPJ"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="rounded-md bg-background pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 p-5 justify-center">
          <RotateCw className="size-5 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-5 text-sm text-destructive">
          Falha ao carregar dados.
        </div>
      ) : items.length === 0 ? (
        <div className="p-5 text-sm">Nenhum cliente encontrado.</div>
      ) : (
        items.map((client) => {
          const hasScope = Boolean(client.scope_id);

          const content = (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>{client.cnpj ? formatCNPJ(client.cnpj) : "-"}</div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {!hasScope ? (
                    <Badge variant="outline">Sem escopo</Badge>
                  ) : null}
                  <Badge variant={client.ativo ? "default" : "secondary"}>
                    {client.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>

              <div className="py-4 font-medium whitespace-normal flex items-start">
                {client.razao_social}
              </div>
            </>
          );

          return (
            <div
              key={client.id}
              className={`w-full border-b transition-colors ${hasScope ? "hover:bg-muted/60" : ""}`}
            >
              {client.scope_id ? (
                <button
                  type="button"
                  className="w-full cursor-pointer p-5 text-left focus:outline-none focus:ring-2 focus:ring-ring"
                  onClick={() => onOpenScope(client.scope_id!)}
                  aria-label={`Abrir escopo de ${client.razao_social}`}
                >
                  {content}
                </button>
              ) : (
                <div className="w-full p-5">{content}</div>
              )}

              <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs">
                  Atualizado em{" "}
                  {format(client.updated_at ?? new Date(), "dd MMM • HH:mm", {
                    locale: ptBR,
                  })}
                </span>

                {!hasScope ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onCreateScope(client.id)}
                  >
                    <Plus className="size-4" />
                    Criar escopo
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
