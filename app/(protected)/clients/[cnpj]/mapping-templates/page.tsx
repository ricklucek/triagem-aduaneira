"use client";

import { useMemo, useState } from "react";
import {
  listTemplates,
  deleteTemplatesForClient,
  type MappingTemplate,
} from "@/lib/scope/mapping-store";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  params: {
    cnpj: string;
  };
};

export default function MappingTemplatesPage({ params }: Props) {
  const { cnpj } = params;

  const [refreshKey, setRefreshKey] = useState(0);
  const templates = useMemo<MappingTemplate[]>(() => {
    void refreshKey;
    return listTemplates(cnpj);
  }, [cnpj, refreshKey]);

  function handleDeleteAll() {
    if (!confirm("Remover todos os templates deste cliente?")) return;
    deleteTemplatesForClient(cnpj);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Templates de Mapeamento</div>
            <div className="text-sm text-muted-foreground">Cliente: {cnpj}</div>
          </div>

          <Button
            variant="destructive"
            className="rounded-xl"
            onClick={handleDeleteAll}
          >
            Limpar todos
          </Button>
        </div>
      </Card>

      {templates.length === 0 && (
        <Card className="rounded-2xl p-4 text-sm text-muted-foreground">
          Nenhum template salvo para este cliente.
        </Card>
      )}

      {templates.map((tpl) => (
        <Card key={tpl.id} className="rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{tpl.docType}</Badge>

              <div className="text-sm text-muted-foreground">
                atualizado em {new Date(tpl.updatedAt).toLocaleString("pt-BR")}
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-xl p-3 text-xs overflow-auto max-h-60">
            <pre>{JSON.stringify(tpl.mapping, null, 2)}</pre>
          </div>
        </Card>
      ))}
    </div>
  );
}
