"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

import type { Scope } from "@/lib/scope/schema";
import { ServiceCatalog } from "@/lib/catalog/services";
import { EntryLocations, ReleaseWarehouses, ExportPortsAndBorders } from "@/lib/catalog/locations";
import { getScopeWarnings } from "@/lib/scope/warnings";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function opLabel(t: "IMPORTACAO" | "EXPORTACAO") {
  return t === "IMPORTACAO" ? "Importação" : "Exportação";
}

function modalLabel(m: Scope["importSection"]["modal"] | Scope["exportSection"]["modal"]) {
  if (!m) return "-";
  if (m === "MARITIMO") return "Marítimo";
  if (m === "AEREO") return "Aéreo";
  return "Rodoviário";
}

function joinCatalogLabels(
  catalog: readonly { id: string; label: string; code?: string }[],
  ids: string[] | undefined
) {
  if (!ids?.length) return "-";
  return ids.map((id) => catalog.find((x) => x.id === id)?.label ?? id).join(", ");
}

function renderServiceValue(s: Scope["services"][number]) {
  const cur = s.currency;

  switch (s.pricingModel) {
    case "FIXED":
      return `${cur} ${s.amount ?? "-"}`;
    case "PERCENT":
      return `${s.percent ?? "-"}%`;
    case "TEXT":
      return s.textRule ?? "-";
    case "SALARY_MINIMUM":
      return `1 salário mínimo (${cur})`;
    default:
      return "-";
  }
}

export function StepReview({ onPublish }: { onPublish: () => void }) {
  const { watch } = useFormContext<Scope>();
  const scope = watch();

  const warnings = useMemo(() => getScopeWarnings(scope), [scope]);

  const ops = scope.operation.types ?? [];
  const hasImport = ops.includes("IMPORTACAO");
  const hasExport = ops.includes("EXPORTACAO");

  return (
    <div className="space-y-3">
      {warnings.length > 0 && (
        <Alert className="rounded-xl">
          <AlertTitle>Alertas</AlertTitle>
          <AlertDescription>
            {warnings.length} item(ns) recomendados para completar antes de publicar (no MVP não bloqueia).
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Revisão</div>
            <div className="text-xs text-muted-foreground">
              Ao publicar, o escopo vira snapshot (published não edita).
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">status: {scope.meta.status}</Badge>
            <Badge variant="outline">v{scope.meta.version}</Badge>
            <Badge variant="outline">{scope.meta.source}</Badge>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-4 md:grid-cols-2">
          {/* Cliente */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Cliente</div>
            <div className="text-sm">
              <div className="font-medium">{scope.client.razaoSocial ?? "-"}</div>
              <div className="text-muted-foreground">{scope.client.cnpj ?? "-"}</div>
            </div>
          </div>

          {/* Operações */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Operações</div>
            <div className="text-sm">
              <div className="font-medium">{ops.length ? ops.map(opLabel).join(" + ") : "-"}</div>
              <div className="text-muted-foreground">
                Import modal: {hasImport ? modalLabel(scope.importSection.modal) : "-"} • Export modal:{" "}
                {hasExport ? modalLabel(scope.exportSection.modal) : "-"}
              </div>
            </div>
          </div>

          {/* Importação */}
          {hasImport && (
            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-muted-foreground">Importação</div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Locais de entrada: {joinCatalogLabels(EntryLocations, scope.importSection.entryLocations)}</div>
                <div>Armazéns de liberação: {joinCatalogLabels(ReleaseWarehouses, scope.importSection.releaseWarehouses)}</div>
                <div>NCM: {scope.importSection.ncm.length ? scope.importSection.ncm.join(", ") : "-"}</div>
                <div>CNAE secundário: {scope.importSection.cnaeSecundario.length ? scope.importSection.cnaeSecundario.join(", ") : "-"}</div>
                <div>LI/LPCO: {scope.importSection.liLpco.enabled ? "Sim" : "Não"}</div>
                {scope.importSection.liLpco.enabled && (
                  <div>Anuências: {scope.importSection.liLpco.anuencias.length ? scope.importSection.liLpco.anuencias.join(", ") : "-"}</div>
                )}
              </div>
            </div>
          )}

          {/* Exportação */}
          {hasExport && (
            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-muted-foreground">Exportação</div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Portos/fronteiras: {joinCatalogLabels(ExportPortsAndBorders, scope.exportSection.departureLocations)}</div>
                <div>NCM: {scope.exportSection.ncm.length ? scope.exportSection.ncm.join(", ") : "-"}</div>
                <div>CNAE secundário: {scope.exportSection.cnaeSecundario.length ? scope.exportSection.cnaeSecundario.join(", ") : "-"}</div>
              </div>
            </div>
          )}

          {/* Contatos */}
          <div className="space-y-1 md:col-span-2">
            <div className="text-xs text-muted-foreground">Contatos</div>
            <div className="text-sm text-muted-foreground">
              {scope.contacts.length ? (
                <div className="space-y-1">
                  {scope.contacts.map((c, i) => (
                    <div key={i}>
                      {c.nome ?? `Contato #${i + 1}`} — {c.email ?? "(sem e-mail)"}
                    </div>
                  ))}
                </div>
              ) : (
                "Nenhum contato"
              )}
            </div>
          </div>

          {/* Serviços */}
          <div className="space-y-1 md:col-span-2">
            <div className="text-xs text-muted-foreground">Serviços</div>
            <div className="text-sm text-muted-foreground">
              {scope.services.length ? (
                <div className="space-y-1">
                  {scope.services
                    .filter((s) => s.enabled !== false)
                    .map((s, i) => {
                      const label = ServiceCatalog.find((x) => x.code === s.code)?.label ?? s.code;
                      return (
                        <div key={i}>
                          {label} • {opLabel(s.operationScope)} — {renderServiceValue(s)}
                        </div>
                      );
                    })}
                </div>
              ) : (
                "Nenhum serviço"
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button className="rounded-xl" onClick={onPublish}>
            Publicar (snapshot)
          </Button>
        </div>
      </Card>

      {/* Debug */}
      <Card className="rounded-2xl p-4">
        <div className="mb-2 text-sm font-semibold">JSON (debug)</div>
        <pre className="max-h-[420px] overflow-auto rounded-xl bg-muted p-3 text-xs">
          {JSON.stringify(scope, null, 2)}
        </pre>
      </Card>
    </div>
  );
}