"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, Loader2, Tags } from "lucide-react";
import { nfeApi } from "@/lib/api/services/nfe";
import type { ImportPurpose, NfeItemClassificationState } from "@/lib/api/types/nfe-api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const purposeLabels: Record<ImportPurpose, string> = {
  resale: "Revenda",
  industrialization: "Industrialização",
  fixed_asset: "Ativo imobilizado",
  use_consumption: "Uso e consumo",
};
const statusLabels: Record<string, string> = {
  unclassified: "Finalidade pendente",
  missing_tax_rule: "Regra tributária ausente",
  inactive_tax_rule: "Regra tributária inativa",
  missing_cfop: "CFOP pendente",
  classified: "Classificado",
};
function apiError(error: unknown) {
  const value = error as { response?: { data?: { message?: string } }; message?: string };
  return value.response?.data?.message || value.message || "Não foi possível salvar a classificação.";
}

export function NfeItemClassificationPanel({
  processId, state, onSaved,
}: {
  processId: string;
  state: NfeItemClassificationState;
  onSaved: () => Promise<unknown>;
}) {
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [purposes, setPurposes] = useState<Record<string, ImportPurpose>>({});
  const [bulkPurpose, setBulkPurpose] = useState<ImportPurpose>("resale");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current: Record<string, ImportPurpose> = {};
    const pending = new Set<string>();
    state.items.forEach((item) => {
      if (item.import_purpose) current[item.duimp_item_number] = item.import_purpose;
      if (item.status !== "classified") pending.add(item.duimp_item_number);
    });
    setPurposes(current);
    setSelected(pending);
  }, [state.snapshot_id, state.latest_updated_at, state.items]);

  const configuredCount = useMemo(
    () => state.items.filter((item) => Boolean(purposes[item.duimp_item_number])).length,
    [purposes, state.items],
  );
  function toggle(number: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(number)) next.delete(number); else next.add(number);
      return next;
    });
  }
  function selectPending() {
    setSelected(new Set(state.items.filter((item) => item.status !== "classified").map((item) => item.duimp_item_number)));
  }
  function applyBulk() {
    if (!selected.size) return toast.info("Selecione ao menos um item.");
    setPurposes((current) => {
      const next = { ...current };
      selected.forEach((number) => { next[number] = bulkPurpose; });
      return next;
    });
  }
  async function save() {
    const items = state.items
      .filter((item) => Boolean(purposes[item.duimp_item_number]))
      .map((item) => ({
        duimp_item_number: item.duimp_item_number,
        import_purpose: purposes[item.duimp_item_number],
      }));
    if (!items.length) return toast.info("Defina a finalidade de ao menos um item.");
    setSaving(true);
    try {
      const result = await nfeApi.saveItemClassifications(processId, {
        duimp_snapshot_id: state.snapshot_id, items,
      });
      await onSaved();
      if (result.ready_for_draft) toast.success("Todos os itens foram classificados. A geração de um novo rascunho foi liberada.");
      else toast.info(result.pending_count + " item(ns) ainda precisam de finalidade, regra tributária ativa e CFOP.");
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card id="item-classification">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Finalidade fiscal por item</CardTitle>
            <CardDescription>
              Cada item pode usar finalidade, regra tributária e CFOP próprios. Em uma NF-e mista,
              a natureza será “Importação de mercadorias”.
            </CardDescription>
          </div>
          <Badge variant={state.ready_for_draft ? "secondary" : "outline"}>
            {state.classified_count}/{state.total_items} prontos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!state.ready_for_draft && (
          <Alert>
            <CircleAlert />
            <AlertTitle>Classificação necessária antes do próximo rascunho</AlertTitle>
            <AlertDescription>
              Se uma finalidade não encontrar regra ativa para o cliente, cadastre a parametrização correspondente e salve novamente.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Aplicar finalidade em lote</span>
            <select className="h-10 w-full rounded-md border bg-background px-3" value={bulkPurpose}
              onChange={(event) => setBulkPurpose(event.target.value as ImportPurpose)}>
              {Object.entries(purposeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <Button variant="outline" onClick={applyBulk} disabled={!selected.size}>
            <Tags /> Aplicar a {selected.size} item(ns)
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={selectPending}>Pendentes</Button>
            <Button size="sm" variant="ghost"
              onClick={() => setSelected(new Set(state.items.map((item) => item.duimp_item_number)))}>Todos</Button>
          </div>
        </div>
        <div className="space-y-3">
          {state.items.map((item) => {
            const purpose = purposes[item.duimp_item_number];
            const changed = purpose !== item.import_purpose;
            const ready = !changed && item.status === "classified";
            return (
              <div key={item.duimp_item_number}
                className="grid gap-3 rounded-xl border p-4 lg:grid-cols-[auto_minmax(0,1.5fr)_minmax(190px,.8fr)_minmax(180px,.8fr)] lg:items-center">
                <input type="checkbox" className="size-4 accent-primary"
                  aria-label={"Selecionar item " + item.duimp_item_number}
                  checked={selected.has(item.duimp_item_number)} onChange={() => toggle(item.duimp_item_number)} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>Item {item.duimp_item_number}</strong>
                    {item.ncm && <Badge variant="outline">NCM {item.ncm}</Badge>}
                    {item.exporter_code && <Badge variant="outline">Exportador {item.exporter_code}</Badge>}
                  </div>
                  <p className="mt-1 break-words text-sm text-muted-foreground">
                    {item.description || item.product_code || "Descrição não informada"}
                  </p>
                </div>
                <label className="space-y-1 text-sm">
                  <span className="text-xs text-muted-foreground">Finalidade</span>
                  <select className="h-10 w-full rounded-md border bg-background px-3" value={purpose || ""}
                    onChange={(event) => setPurposes((current) => ({
                      ...current, [item.duimp_item_number]: event.target.value as ImportPurpose,
                    }))}>
                    <option value="" disabled>Selecionar</option>
                    {Object.entries(purposeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    {ready && <Check className="size-4 text-emerald-600" />}
                    <span className={ready ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>
                      {statusLabels[item.status] || item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {changed
                      ? "Regra e CFOP serão recalculados ao salvar"
                      : item.tax_rule
                        ? item.tax_rule.name + (item.cfop ? " · CFOP " + item.cfop : "")
                        : purpose ? "Nenhuma regra ativa encontrada" : "Aguardando finalidade"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {configuredCount} de {state.total_items} item(ns) com finalidade informada.
          </p>
          <Button onClick={() => void save()} disabled={saving || !configuredCount}>
            {saving && <Loader2 className="animate-spin" />} Salvar classificação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
