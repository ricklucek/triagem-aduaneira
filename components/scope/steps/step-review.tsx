"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { Scope } from "@/lib/scope/schema";
import { getScopeWarnings } from "@/lib/scope/warnings";
import { ServiceCatalog } from "@/lib/catalog/services";
import { EntryLocations, ClearanceLocations } from "@/lib/catalog/locations";

import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

function findLabel(list: readonly { id: string; label: string }[], id?: string | null) {
  return list.find((x) => x.id === id)?.label ?? id ?? "-";
}

export function StepReview({ onPublish }: { onPublish: () => void }) {
  const { watch } = useFormContext<Scope>();
  const scope = watch();

  const warnings = useMemo(() => getScopeWarnings(scope), [scope]);

  const entrada = findLabel(EntryLocations as any, scope.operation.localEntradaId);
  const liberacao = findLabel(ClearanceLocations as any, scope.operation.localLiberacaoId);

  return (
    <div className="space-y-3">
      {warnings.length > 0 && (
        <Alert className="rounded-xl">
          <AlertTitle>Alertas</AlertTitle>
          <AlertDescription>
            {warnings.length} item(ns) recomendados para completar antes de publicar (o MVP não bloqueia).
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Resumo</div>
            <div className="text-xs text-muted-foreground">Snapshot do formulário inteiro ao publicar</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">status: {scope.meta.status}</Badge>
            <Badge variant="outline">v{scope.meta.version}</Badge>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Cliente</div>
            <div className="text-sm">
              <div className="font-medium">{scope.client.razaoSocial || "-"}</div>
              <div className="text-muted-foreground">{scope.client.cnpj || "-"}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Operação</div>
            <div className="text-sm">
              <div className="font-medium">
                {scope.operation.tipo === "IMPORTACAO" ? "Importação" : "Exportação"} •{" "}
                {scope.operation.modal ?? "-"}
              </div>
              <div className="text-muted-foreground">
                Entrada: {entrada} • Liberação: {liberacao}
              </div>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="text-xs text-muted-foreground">Contatos</div>
            <div className="text-sm text-muted-foreground">
              {scope.contacts?.length
                ? scope.contacts.map((c, i) => (
                    <div key={i}>
                      {c.nome || `Contato #${i + 1}`} — {c.email || "(sem e-mail)"}
                    </div>
                  ))
                : "Nenhum contato"}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="text-xs text-muted-foreground">Serviços</div>
            <div className="text-sm text-muted-foreground">
              {scope.services?.length
                ? scope.services.map((s, i) => {
                    const label = ServiceCatalog.find((x) => x.code === s.codigo)?.label ?? s.codigo;
                    return (
                      <div key={i}>
                        {label} — {s.moeda} {s.valor ?? "-"} {s.regraCalculo ? `• ${s.regraCalculo}` : ""}
                      </div>
                    );
                  })
                : "Nenhum serviço"}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button className="rounded-xl" onClick={onPublish}>
            Publicar (snapshot)
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl p-4">
        <div className="mb-2 text-sm font-semibold">JSON (debug do MVP)</div>
        <pre className="max-h-105 overflow-auto rounded-xl bg-muted p-3 text-xs">
          {JSON.stringify(scope, null, 2)}
        </pre>
      </Card>
    </div>
  );
}