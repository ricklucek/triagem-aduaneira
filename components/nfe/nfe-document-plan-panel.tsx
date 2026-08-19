"use client";

import { Check, CircleAlert, FileStack, Loader2, RefreshCw, Scale } from "lucide-react";
import type { ImportPurpose, NfeDocumentPlan } from "@/lib/api/types/nfe-api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const purposeLabels: Record<ImportPurpose, string> = {
  resale: "Revenda",
  industrialization: "Industrialização",
  fixed_asset: "Ativo imobilizado",
  use_consumption: "Uso e consumo",
};

const costLabels: Record<string, string> = {
  afrmm: "AFRMM",
  siscomex_fee: "Taxa Siscomex",
  thc: "THC",
  other: "Outros",
};

function money(value: unknown) {
  const amount = Number(value || 0);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
    : "—";
}

function supplierName(supplier?: Record<string, unknown> | null) {
  if (!supplier) return "Exportador não identificado";
  return String(
    supplier.name ||
    supplier.legal_name ||
    supplier.razaoSocial ||
    "Exportador não identificado",
  );
}

export function NfeDocumentPlanPanel({
  plan,
  busy,
  onGenerate,
}: {
  plan: NfeDocumentPlan | null;
  busy: boolean;
  onGenerate: () => Promise<void>;
}) {
  if (!plan) {
    return (
      <Card id="document-plan">
        <CardHeader>
          <CardTitle>Plano de notas</CardTitle>
          <CardDescription>
            O sistema agrupa os itens por exportador e rateia os custos compartilhados antes de criar documentos fiscais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileStack />
            <AlertTitle>Master apenas gerencial</AlertTitle>
            <AlertDescription>
              O agrupador Master não recebe número, chave de acesso ou XML. Cada exportador dará origem a uma NF-e filha independente.
            </AlertDescription>
          </Alert>
          <Button onClick={() => void onGenerate()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <FileStack />}
            Gerar plano de notas
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="document-plan" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Master gerencial · versão {plan.version_number}</CardTitle>
              <CardDescription>
                {plan.documents.length} NF-e filha(s) planejada(s) · {String(plan.totals.items_count || 0)} item(ns)
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={plan.reconciliation.balanced ? "default" : "destructive"}>
                {plan.reconciliation.balanced ? <Check /> : <CircleAlert />}
                {plan.reconciliation.balanced ? "Rateio conciliado" : "Revisão necessária"}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => void onGenerate()} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Recalcular plano
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Valor aduaneiro</p><strong>{money(plan.totals.customs_value)}</strong></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Custos compartilhados</p><strong>{money(plan.totals.shared_costs)}</strong></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Total planejado</p><strong>{money(plan.totals.planned_value)}</strong></div>
          </div>

          <Alert className="border-emerald-500/30 bg-emerald-500/5">
            <Scale />
            <AlertTitle>Rateio proporcional ao valor aduaneiro</AlertTitle>
            <AlertDescription>
              Custos comuns são distribuídos por item; eventual diferença de centavos fica no item de maior valor aduaneiro.
            </AlertDescription>
          </Alert>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(plan.shared_costs).map(([name, value]) => (
              <div key={name} className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="text-xs text-muted-foreground">{costLabels[name] || name}</p>
                <strong>{money(value)}</strong>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {plan.documents.map((document) => (
          <Card key={document.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">NF-e filha {document.ordinal}</CardTitle>
                  <CardDescription>{supplierName(document.foreign_supplier)}</CardDescription>
                </div>
                <Badge variant="secondary">{document.items_count} item(ns)</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Natureza da operação</p>
                <strong className="text-sm">{document.operation_nature}</strong>
              </div>
              <div className="flex flex-wrap gap-2">
                {document.item_purposes.map((purpose) => (
                  <Badge key={purpose} variant="outline">{purposeLabels[purpose] || purpose}</Badge>
                ))}
                {document.mixed_import_purposes && <Badge>Finalidades mistas</Badge>}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div><p className="text-xs text-muted-foreground">Valor aduaneiro</p><strong className="text-sm">{money(document.totals.customs_value)}</strong></div>
                <div><p className="text-xs text-muted-foreground">Custos rateados</p><strong className="text-sm">{money(document.totals.shared_costs)}</strong></div>
                <div><p className="text-xs text-muted-foreground">Total planejado</p><strong className="text-sm">{money(document.totals.planned_value)}</strong></div>
              </div>
              <details className="rounded-lg border">
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Conferir itens e CFOPs</summary>
                <div className="divide-y border-t">
                  {document.items.map((item) => {
                    const allocated = Object.values(item.allocated_shared_costs).reduce(
                      (sum, value) => sum + Number(value || 0),
                      0,
                    );
                    return (
                      <div key={item.id} className="grid gap-1 px-3 py-2 text-xs sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-3">
                        <strong>Item {item.duimp_item_number}</strong>
                        <span>{purposeLabels[item.import_purpose] || item.import_purpose}</span>
                        <span>CFOP {item.cfop}</span>
                        <span className="text-muted-foreground">Rateio {money(allocated)}</span>
                      </div>
                    );
                  })}
                </div>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>

      {plan.documents.length > 1 && (
        <Alert>
          <CircleAlert />
          <AlertTitle>Plano multi-exportador pronto para conferência</AlertTitle>
          <AlertDescription>
            A criação independente dos rascunhos, números, chaves e XMLs de cada filha será liberada no Checkpoint 3C. Nenhum documento fiscal foi numerado nesta etapa.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
