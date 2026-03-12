"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { Scope } from "@/lib/scope/schema";

import { ImportServiceRules } from "@/lib/catalog/service-rules";
import { ExportServiceRules } from "@/lib/catalog/service-rules-export";
import { upsertService, removeService } from "@/lib/scope/services-helpers";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

function toNumberOrNull(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function StepServices() {
  const { watch, setValue } = useFormContext<Scope>();

  const ops = watch("operation.types") ?? [];
  const hasImport = ops.includes("IMPORTACAO");
  const hasExport = ops.includes("EXPORTACAO");

  const scope = watch();
  const salaryMin = scope.globalsSnapshot?.salaryMinimumBRL ?? 1518;

  const importServices = useMemo(
    () => scope.services.filter((s) => s.operationScope === "IMPORTACAO"),
    [scope.services]
  );

  const exportServices = useMemo(
    () => scope.services.filter((s) => s.operationScope === "EXPORTACAO"),
    [scope.services]
  );

  function getService(operationScope: "IMPORTACAO" | "EXPORTACAO", code: string) {
    return scope.services.find((s) => s.operationScope === operationScope && s.code === code) ?? null;
  }

  function patchService(operationScope: "IMPORTACAO" | "EXPORTACAO", code: string, patch: Partial<Scope["services"][number]>) {
    const current = getService(operationScope, code);
    if (!current) return;
    setValue("services", upsertService(scope, { ...current, ...patch }), { shouldDirty: true });
  }

  function patchExtra(operationScope: "IMPORTACAO" | "EXPORTACAO", code: string, extraPatch: Record<string, unknown>) {
    const current = getService(operationScope, code);
    if (!current) return;
    setValue(
      "services",
      upsertService(scope, { ...current, extra: { ...(current.extra ?? {}), ...extraPatch } }),
      { shouldDirty: true }
    );
  }

  function toggleService(operationScope: "IMPORTACAO" | "EXPORTACAO", code: string, enabled: boolean) {
    if (!enabled) {
      setValue("services", removeService(scope, operationScope, code), { shouldDirty: true });
      return;
    }

    // defaults por código (Import)
    if (operationScope === "IMPORTACAO") {
      if (code === "DESPACHO_ADUANEIRO") {
        setValue(
          "services",
          upsertService(scope, {
            operationScope,
            code,
            enabled: true,
            currency: "BRL",
            pricingModel: "SALARY_MINIMUM",
            amount: null,
            percent: null,
            textRule: null,
            notes: null,
            extra: {},
          }),
          { shouldDirty: true }
        );
        return;
      }

      if (code === "PREPOSTO") {
        setValue(
          "services",
          upsertService(scope, {
            operationScope,
            code,
            enabled: true,
            currency: "BRL",
            pricingModel: "FIXED",
            amount: null,
            percent: null,
            textRule: null,
            notes: null,
            extra: { includedInDesemb: false },
          }),
          { shouldDirty: true }
        );
        return;
      }

      if (code === "FRETE_INTERNACIONAL") {
        setValue(
          "services",
          upsertService(scope, {
            operationScope,
            code,
            enabled: true,
            currency: "USD",
            pricingModel: "TEXT",
            amount: null,
            percent: null,
            textRule: "PTAX negociado",
            notes: null,
            extra: { percent: null },
          }),
          { shouldDirty: true }
        );
        return;
      }
    }

    // defaults por código (Export)
    if (operationScope === "EXPORTACAO") {
      if (code === "CERTIFICADO_ORIGEM") {
        setValue(
          "services",
          upsertService(scope, {
            operationScope,
            code,
            enabled: true,
            currency: "BRL",
            pricingModel: "FIXED",
            amount: null,
            percent: null,
            textRule: null,
            notes: null,
            extra: {},
          }),
          { shouldDirty: true }
        );
        return;
      }

      if (code === "CERTIFICADO_FITOSSANITARIO") {
        setValue(
          "services",
          upsertService(scope, {
            operationScope,
            code,
            enabled: true,
            currency: "BRL",
            pricingModel: "FIXED",
            amount: null,
            percent: null,
            textRule: null,
            notes: null,
            extra: {},
          }),
          { shouldDirty: true }
        );
        return;
      }

      if (code === "OUTROS_CERTIFICADOS") {
        setValue(
          "services",
          upsertService(scope, {
            operationScope,
            code,
            enabled: true,
            currency: "BRL",
            pricingModel: "FIXED",
            amount: null,
            percent: null,
            textRule: null,
            notes: null,
            extra: { description: "" }, // texto obrigatório no mundo real (aqui warning)
          }),
          { shouldDirty: true }
        );
        return;
      }
    }

    // fallback
    setValue(
      "services",
      upsertService(scope, {
        operationScope,
        code,
        enabled: true,
        currency: "BRL",
        pricingModel: "FIXED",
        amount: null,
        percent: null,
        textRule: null,
        notes: null,
        extra: {},
      }),
      { shouldDirty: true }
    );
  }

  if (!hasImport && !hasExport) {
    return (
      <Card className="rounded-2xl p-4">
        <div className="text-sm font-semibold">Serviços</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Selecione uma operação (Importação/Exportação) antes de configurar serviços.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* IMPORTAÇÃO */}
      {hasImport && (
        <Card className="rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">Serviços • Importação</div>
              <div className="text-xs text-muted-foreground">
                Regras específicas por serviço (MVP) • Salário mínimo: BRL {salaryMin}
              </div>
            </div>
            <Badge variant="secondary">{importServices.length} ativo(s)</Badge>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            {ImportServiceRules.map((r) => {
              const active = !!getService("IMPORTACAO", r.code);
              return (
                <Button
                  key={r.code}
                  type="button"
                  variant={active ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => toggleService("IMPORTACAO", r.code, !active)}
                >
                  {r.label}
                </Button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3">
            {/* DESPACHO */}
            {getService("IMPORTACAO", "DESPACHO_ADUANEIRO") && (
              <Card className="rounded-2xl border p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">Despacho Aduaneiro</div>
                    <div className="text-xs text-muted-foreground">
                      Escolha: 1 salário mínimo vigente ou outro valor fixo (BRL).
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => toggleService("IMPORTACAO", "DESPACHO_ADUANEIRO", false)}
                  >
                    Remover
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Modelo</div>
                    <Select
                      value={getService("IMPORTACAO", "DESPACHO_ADUANEIRO")?.pricingModel ?? "SALARY_MINIMUM"}
                      onValueChange={(v) =>
                        patchService("IMPORTACAO", "DESPACHO_ADUANEIRO", {
                          pricingModel: v as Scope["services"][number]["pricingModel"],
                          currency: "BRL",
                          amount: v === "SALARY_MINIMUM" ? null : getService("IMPORTACAO", "DESPACHO_ADUANEIRO")?.amount ?? null,
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SALARY_MINIMUM">1 salário mínimo vigente</SelectItem>
                        <SelectItem value="FIXED">Outro valor (fixo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Valor (BRL)</div>
                    <Input
                      className="rounded-xl"
                      placeholder={String(salaryMin)}
                      disabled={getService("IMPORTACAO", "DESPACHO_ADUANEIRO")?.pricingModel === "SALARY_MINIMUM"}
                      value={String(getService("IMPORTACAO", "DESPACHO_ADUANEIRO")?.amount ?? "")}
                      onChange={(e) => patchService("IMPORTACAO", "DESPACHO_ADUANEIRO", { amount: toNumberOrNull(e.target.value) })}
                    />
                    <div className="text-xs text-muted-foreground">
                      {getService("IMPORTACAO", "DESPACHO_ADUANEIRO")?.pricingModel === "SALARY_MINIMUM"
                        ? `Aplicará BRL ${salaryMin} ao publicar (snapshot carimba o salário).`
                        : "Informe o valor fixo."}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* PREPOSTO */}
            {getService("IMPORTACAO", "PREPOSTO") && (
              <Card className="rounded-2xl border p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">Preposto</div>
                    <div className="text-xs text-muted-foreground">
                      Valor fixo (BRL) + flag “Incluso no Desembaraço”.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => toggleService("IMPORTACAO", "PREPOSTO", false)}
                  >
                    Remover
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Valor (BRL)</div>
                    <Input
                      className="rounded-xl"
                      placeholder="ex.: 250"
                      value={String(getService("IMPORTACAO", "PREPOSTO")?.amount ?? "")}
                      onChange={(e) => patchService("IMPORTACAO", "PREPOSTO", { amount: toNumberOrNull(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Incluso no Desembaraço?</div>
                    <Select
                      value={String(!!getService("IMPORTACAO", "PREPOSTO")?.extra?.includedInDesemb)}
                      onValueChange={(v) => patchExtra("IMPORTACAO", "PREPOSTO", { includedInDesemb: v === "true" })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Não</SelectItem>
                        <SelectItem value="true">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            )}

            {/* FRETE */}
            {getService("IMPORTACAO", "FRETE_INTERNACIONAL") && (
              <Card className="rounded-2xl border p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">Frete Internacional</div>
                    <div className="text-xs text-muted-foreground">
                      Regra textual (ex.: “PTAX negociado”) + percentual.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => toggleService("IMPORTACAO", "FRETE_INTERNACIONAL", false)}
                  >
                    Remover
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Regra (texto)</div>
                    <Input
                      className="rounded-xl"
                      value={getService("IMPORTACAO", "FRETE_INTERNACIONAL")?.textRule ?? ""}
                      onChange={(e) => patchService("IMPORTACAO", "FRETE_INTERNACIONAL", { textRule: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Percentual (%)</div>
                    <Input
                      className="rounded-xl"
                      placeholder="ex.: 8"
                      value={String(getService("IMPORTACAO", "FRETE_INTERNACIONAL")?.extra?.percent ?? "")}
                      onChange={(e) => patchExtra("IMPORTACAO", "FRETE_INTERNACIONAL", { percent: toNumberOrNull(e.target.value) })}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Card>
      )}

      {/* EXPORTAÇÃO */}
      {hasExport && (
        <Card className="rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">Serviços • Exportação</div>
              <div className="text-xs text-muted-foreground">Certificados e custos associados (MVP)</div>
            </div>
            <Badge variant="secondary">{exportServices.length} ativo(s)</Badge>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            {ExportServiceRules.map((r) => {
              const active = !!getService("EXPORTACAO", r.code);
              return (
                <Button
                  key={r.code}
                  type="button"
                  variant={active ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => toggleService("EXPORTACAO", r.code, !active)}
                >
                  {r.label}
                </Button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3">
            {/* Certificado de Origem */}
            {getService("EXPORTACAO", "CERTIFICADO_ORIGEM") && (
              <Card className="rounded-2xl border p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">Certificado de Origem</div>
                    <div className="text-xs text-muted-foreground">Valor fixo (moeda livre).</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => toggleService("EXPORTACAO", "CERTIFICADO_ORIGEM", false)}
                  >
                    Remover
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Moeda</div>
                    <Select
                      value={getService("EXPORTACAO", "CERTIFICADO_ORIGEM")?.currency ?? "BRL"}
                      onValueChange={(v) => patchService("EXPORTACAO", "CERTIFICADO_ORIGEM", { currency: v as Scope["services"][number]["currency"] })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">BRL</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Valor</div>
                    <Input
                      className="rounded-xl"
                      placeholder="ex.: 350"
                      value={String(getService("EXPORTACAO", "CERTIFICADO_ORIGEM")?.amount ?? "")}
                      onChange={(e) => patchService("EXPORTACAO", "CERTIFICADO_ORIGEM", { amount: toNumberOrNull(e.target.value) })}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Certificado Fitossanitário */}
            {getService("EXPORTACAO", "CERTIFICADO_FITOSSANITARIO") && (
              <Card className="rounded-2xl border p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">Certificado Fitossanitário</div>
                    <div className="text-xs text-muted-foreground">Valor fixo (moeda livre).</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => toggleService("EXPORTACAO", "CERTIFICADO_FITOSSANITARIO", false)}
                  >
                    Remover
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Moeda</div>
                    <Select
                      value={getService("EXPORTACAO", "CERTIFICADO_FITOSSANITARIO")?.currency ?? "BRL"}
                      onValueChange={(v) => patchService("EXPORTACAO", "CERTIFICADO_FITOSSANITARIO", { currency: v as Scope["services"][number]["currency"] })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">BRL</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Valor</div>
                    <Input
                      className="rounded-xl"
                      placeholder="ex.: 420"
                      value={String(getService("EXPORTACAO", "CERTIFICADO_FITOSSANITARIO")?.amount ?? "")}
                      onChange={(e) =>
                        patchService("EXPORTACAO", "CERTIFICADO_FITOSSANITARIO", { amount: toNumberOrNull(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Outros certificados */}
            {getService("EXPORTACAO", "OUTROS_CERTIFICADOS") && (
              <Card className="rounded-2xl border p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">Outros certificados</div>
                    <div className="text-xs text-muted-foreground">Descreva e informe um valor fixo (moeda livre).</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => toggleService("EXPORTACAO", "OUTROS_CERTIFICADOS", false)}
                  >
                    Remover
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Descrição</div>
                    <Input
                      className="rounded-xl"
                      placeholder="ex.: Certificado X / Documento Y"
                      value={String(getService("EXPORTACAO", "OUTROS_CERTIFICADOS")?.extra?.description ?? "")}
                      onChange={(e) => patchExtra("EXPORTACAO", "OUTROS_CERTIFICADOS", { description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Moeda</div>
                    <Select
                      value={getService("EXPORTACAO", "OUTROS_CERTIFICADOS")?.currency ?? "BRL"}
                      onValueChange={(v) => patchService("EXPORTACAO", "OUTROS_CERTIFICADOS", { currency: v as Scope["services"][number]["currency"] })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">BRL</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <div className="text-xs text-muted-foreground">Valor</div>
                    <Input
                      className="rounded-xl"
                      placeholder="ex.: 180"
                      value={String(getService("EXPORTACAO", "OUTROS_CERTIFICADOS")?.amount ?? "")}
                      onChange={(e) => patchService("EXPORTACAO", "OUTROS_CERTIFICADOS", { amount: toNumberOrNull(e.target.value) })}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}