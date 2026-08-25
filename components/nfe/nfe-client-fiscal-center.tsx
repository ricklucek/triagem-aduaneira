"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Check,
  CircleAlert,
  FilePenLine,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { nfeApi } from "@/lib/api/services/nfe";
import type {
  ImportPurpose,
  ImportTaxRule,
  ImportTaxRuleDiagnostics,
  ImportTaxRulePayload,
} from "@/lib/api/types/nfe-api";
import { useToast } from "@/components/ui/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const purposeLabels: Record<ImportPurpose, string> = {
  resale: "Revenda",
  industrialization: "Industrialização",
  fixed_asset: "Ativo imobilizado",
  use_consumption: "Uso e consumo",
};

const purposeCfops: Record<ImportPurpose, string> = {
  resale: "3102",
  industrialization: "3101",
  fixed_asset: "3127",
  use_consumption: "3556",
};

const operationNatures: Record<ImportPurpose, string> = {
  resale: "Compra para comercialização",
  industrialization: "Compra para industrialização",
  fixed_asset: "Compra para o ativo imobilizado",
  use_consumption: "Compra para uso ou consumo",
};

const modalityLabels: Record<string, string> = {
  direct: "Direta",
  on_behalf: "Conta e ordem",
  by_order: "Encomenda",
};

function asText(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

function validityLabel(rule: ImportTaxRule) {
  if (!rule.effective_from && !rule.effective_until) return "Sem limite";
  return `${formatDate(rule.effective_from)} a ${formatDate(rule.effective_until)}`;
}

function apiError(error: unknown) {
  const response = error as {
    response?: {
      data?: {
        message?: string;
        messages?: Record<string, string[]>;
        conflicts?: ImportTaxRule["conflicts"];
      };
    };
    message?: string;
  };
  const validation = response.response?.data?.messages;
  return {
    message:
      response.response?.data?.message ||
      (validation ? Object.values(validation).flat().find(Boolean) : undefined) ||
      response.message ||
      "Não foi possível salvar a regra tributária.",
    conflicts: response.response?.data?.conflicts || [],
  };
}

function FormField({
  label,
  name,
  defaultValue,
  required = true,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`tax-rule-${name}`}>{label}</Label>
      <Input
        id={`tax-rule-${name}`}
        name={name}
        defaultValue={defaultValue}
        required={required}
        type={type}
        placeholder={placeholder}
      />
    </div>
  );
}

export function NfeClientFiscalCenter({
  clientId,
  hasFiscalProfile,
  hasNumberSequence,
  onConfigureProfile,
  onConfigureSequence,
  onChanged,
}: {
  clientId: string;
  hasFiscalProfile: boolean;
  hasNumberSequence: boolean;
  onConfigureProfile: () => void;
  onConfigureSequence: () => void;
  onChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const [diagnostics, setDiagnostics] = useState<ImportTaxRuleDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ImportTaxRule | null>(null);
  const [purpose, setPurpose] = useState<ImportPurpose>("resale");
  const [saveConflicts, setSaveConflicts] = useState<ImportTaxRule["conflicts"]>([]);

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      setDiagnostics(await nfeApi.getTaxRuleDiagnostics(clientId));
    } catch (error) {
      toast.error(apiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    let active = true;
    void nfeApi
      .getTaxRuleDiagnostics(clientId)
      .then((result) => {
        if (active) setDiagnostics(result);
      })
      .catch((error) => {
        if (active) toast.error(apiError(error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clientId, toast]);

  function openNewRule() {
    setEditingRule(null);
    setPurpose("resale");
    setSaveConflicts([]);
    setSheetOpen(true);
  }

  function openRule(rule: ImportTaxRule) {
    setEditingRule(rule);
    setPurpose(rule.import_purpose);
    setSaveConflicts(rule.conflicts || []);
    setSheetOpen(true);
  }

  async function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) || "").trim();
    const cst = text("icms_cst");
    const rate = text("icms_rate");
    const existingConfiguration = editingRule?.configuration_json || {};
    const configuration: Record<string, unknown> = {
      ...existingConfiguration,
      cfop: text("cfop") || purposeCfops[purpose],
      icms_origin: text("icms_origin") || "1",
      icms_cst: cst,
      ipi_cst: asText(existingConfiguration.ipi_cst) || "00",
      ipi_zero_rate_cst: asText(existingConfiguration.ipi_zero_rate_cst) || "01",
      pis_cst: asText(existingConfiguration.pis_cst) || "99",
      cofins_cst: asText(existingConfiguration.cofins_cst) || "99",
      document_defaults: {
        ...((existingConfiguration.document_defaults as Record<string, unknown>) || {}),
        operation_nature: operationNatures[purpose],
        presence_indicator: "9",
        intermediary_indicator: "0",
      },
      item_defaults: {
        ...((existingConfiguration.item_defaults as Record<string, unknown>) || {}),
        commercial_unit: "UN",
        taxable_unit: "UN",
      },
    };
    if (rate) configuration.icms_rate = rate;
    else delete configuration.icms_rate;
    if (cst === "51" && !rate) configuration.icms_base_reduction_rate = "100";

    const modality = text("import_modality");
    const regime = text("tax_regime");
    const payload: ImportTaxRulePayload = {
      name: text("name"),
      issuer_state: text("issuer_state").toUpperCase(),
      import_purpose: purpose,
      import_modality: modality === "all" ? null : modality as ImportTaxRulePayload["import_modality"],
      tax_regime: regime === "all" ? null : regime as ImportTaxRulePayload["tax_regime"],
      ncm_pattern: text("ncm_pattern").replace(/\D/g, "") || null,
      priority: Number(text("priority") || 100),
      effective_from: text("effective_from") || null,
      effective_until: text("effective_until") || null,
      configuration_json: configuration,
      transport_defaults: editingRule?.transport_defaults || { freight_mode: "1" },
      payment_defaults: editingRule?.payment_defaults || { method: "90", value: "0.00" },
      active: text("active") !== "false",
    };

    setBusy(true);
    setSaveConflicts([]);
    try {
      if (editingRule) {
        await nfeApi.updateTaxRule(clientId, editingRule.id, payload);
      } else {
        await nfeApi.createTaxRule(clientId, payload);
      }
      await Promise.all([loadRules(), onChanged()]);
      setSheetOpen(false);
      toast.success(editingRule ? "Regra tributária atualizada." : "Regra tributária cadastrada.");
    } catch (error) {
      const detail = apiError(error);
      setSaveConflicts(detail.conflicts);
      toast.error(detail.message);
    } finally {
      setBusy(false);
    }
  }

  async function deactivateRule(rule: ImportTaxRule) {
    if (!window.confirm(`Desativar a regra “${rule.name}”? Ela deixará de ser aplicada a novos itens.`)) return;
    setBusy(true);
    try {
      await nfeApi.deactivateTaxRule(clientId, rule.id);
      await Promise.all([loadRules(), onChanged()]);
      toast.success("Regra tributária desativada.");
    } catch (error) {
      toast.error(apiError(error).message);
    } finally {
      setBusy(false);
    }
  }

  const rules = diagnostics?.items || [];
  const configuration = editingRule?.configuration_json || {};
  const conflictCount = diagnostics?.summary.conflict_count || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Central fiscal do cliente</CardTitle>
            <CardDescription>
              Revise os cadastros reutilizáveis. Regras tributárias serão aplicadas somente após a DUIMP revelar finalidade, modalidade e NCM de cada item.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadRules()} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} /> Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="font-medium">Perfil fiscal</p>
              <p className={`text-xs font-medium ${hasFiscalProfile ? "text-emerald-700" : "text-amber-700"}`}>
                {hasFiscalProfile ? "Configurado" : "Pendente"}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={onConfigureProfile}>
              <Settings2 /> {hasFiscalProfile ? "Revisar" : "Configurar"}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="font-medium">Sequência numérica</p>
              <p className={`text-xs font-medium ${hasNumberSequence ? "text-emerald-700" : "text-amber-700"}`}>
                {hasNumberSequence ? "Configurada" : "Pendente"}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={onConfigureSequence}>
              <Settings2 /> {hasNumberSequence ? "Revisar" : "Configurar"}
            </Button>
          </div>
        </div>

        {conflictCount > 0 && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>{conflictCount} conflito(s) entre regras ativas</AlertTitle>
            <AlertDescription>
              Edite as regras destacadas. O sistema mostra o registro conflitante e aceita resolver por prioridade, vigência, NCM, modalidade ou regime.
            </AlertDescription>
          </Alert>
        )}

        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Regras tributárias</h3>
              <p className="text-sm text-muted-foreground">
                {diagnostics
                  ? `${diagnostics.summary.active} ativa(s) de ${diagnostics.summary.total} cadastrada(s)`
                  : "Carregando regras cadastradas…"}
              </p>
            </div>
            <Button onClick={openNewRule}><Plus /> Nova regra</Button>
          </div>

          {!loading && rules.length === 0 ? (
            <Alert>
              <CircleAlert />
              <AlertTitle>Nenhuma regra cadastrada</AlertTitle>
              <AlertDescription>
                Isso não impede importar a DUIMP. A classificação será bloqueada apenas nos itens que não encontrarem uma regra aplicável.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-lg border">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Regra</TableHead>
                    <TableHead>Finalidade</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>NCM/escopo</TableHead>
                    <TableHead>UF</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id} className={rule.has_conflicts ? "bg-destructive/5" : undefined}>
                      <TableCell className="max-w-56 whitespace-normal">
                        <strong>{rule.name}</strong>
                        {rule.has_conflicts && (
                          <p className="mt-1 text-xs text-destructive">
                            Conflita com {rule.conflicts.map((item) => item.name).join(", ")}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{purposeLabels[rule.import_purpose]}</TableCell>
                      <TableCell>{rule.import_modality ? modalityLabels[rule.import_modality] : "Todas"}</TableCell>
                      <TableCell>{rule.ncm_pattern ? `${rule.ncm_pattern}*` : "Todos"}</TableCell>
                      <TableCell>{rule.issuer_state}</TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>{validityLabel(rule)}</TableCell>
                      <TableCell>
                        <Badge variant={rule.has_conflicts ? "destructive" : rule.active ? "default" : "outline"}>
                          {rule.has_conflicts ? "Conflito" : rule.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openRule(rule)}>
                            <FilePenLine /> Editar
                          </Button>
                          {rule.active && (
                            <Button variant="ghost" size="sm" onClick={() => void deactivateRule(rule)} disabled={busy}>
                              <Power /> Desativar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </CardContent>

      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) setSaveConflicts([]); }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="border-b pr-12">
            <SheetTitle>{editingRule ? "Editar regra tributária" : "Cadastrar regra tributária"}</SheetTitle>
            <SheetDescription>
              Defina um escopo determinístico. Uma regra mais prioritária ou mais específica prevalece quando houver sobreposição intencional.
            </SheetDescription>
          </SheetHeader>

          <form key={editingRule?.id || "new"} className="grid gap-4 px-4 pb-6 sm:grid-cols-2" onSubmit={saveRule}>
            {(saveConflicts.length > 0 || editingRule?.has_conflicts) && (
              <Alert variant="destructive" className="sm:col-span-2">
                <CircleAlert />
                <AlertTitle>Escopo ambíguo</AlertTitle>
                <AlertDescription>
                  Conflita com {(saveConflicts.length ? saveConflicts : editingRule?.conflicts || []).map((rule) => `${rule.name} (prioridade ${rule.priority})`).join(", ")}. Altere prioridade, vigência, NCM, modalidade ou regime.
                </AlertDescription>
              </Alert>
            )}

            <FormField label="Nome da regra" name="name" defaultValue={editingRule?.name || "Importação padrão"} />
            <FormField label="UF do emitente" name="issuer_state" defaultValue={editingRule?.issuer_state || ""} placeholder="PR" />

            <div className="space-y-1.5">
              <Label>Finalidade</Label>
              <Select value={purpose} onValueChange={(value) => setPurpose(value as ImportPurpose)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(purposeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Modalidade</Label>
              <Select name="import_modality" defaultValue={editingRule?.import_modality || "all"}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="direct">Importação própria</SelectItem>
                  <SelectItem value="on_behalf">Por conta e ordem</SelectItem>
                  <SelectItem value="by_order">Por encomenda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <FormField label="NCM ou prefixo (opcional)" name="ncm_pattern" defaultValue={editingRule?.ncm_pattern || ""} required={false} placeholder="Ex.: 8302" />
            <div className="space-y-1.5">
              <Label>Regime tributário</Label>
              <Select name="tax_regime" defaultValue={editingRule?.tax_regime || "all"}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">1 — Simples Nacional</SelectItem>
                  <SelectItem value="2">2 — Excesso sublimite</SelectItem>
                  <SelectItem value="3">3 — Regime normal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <FormField label="Prioridade" name="priority" type="number" defaultValue={editingRule?.priority ?? 100} />
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select name="active" defaultValue={editingRule?.active === false ? "false" : "true"}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativa</SelectItem>
                  <SelectItem value="false">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <FormField label="Vigência inicial" name="effective_from" type="date" defaultValue={editingRule?.effective_from || ""} required={false} />
            <FormField label="Vigência final" name="effective_until" type="date" defaultValue={editingRule?.effective_until || ""} required={false} />

            <FormField label="CFOP" name="cfop" defaultValue={asText(configuration.cfop) || purposeCfops[purpose]} />
            <FormField label="Origem do ICMS" name="icms_origin" defaultValue={asText(configuration.icms_origin) || "1"} />

            <div className="space-y-1.5">
              <Label>CST do ICMS</Label>
              <Select name="icms_cst" defaultValue={asText(configuration.icms_cst) || "90"}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="00">00 — Tributada integralmente</SelectItem>
                  <SelectItem value="40">40 — Isenta</SelectItem>
                  <SelectItem value="41">41 — Não tributada</SelectItem>
                  <SelectItem value="50">50 — Suspensão</SelectItem>
                  <SelectItem value="51">51 — Diferimento</SelectItem>
                  <SelectItem value="90">90 — Outras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormField label="Alíquota do ICMS" name="icms_rate" defaultValue={asText(configuration.icms_rate)} required={false} placeholder="Ex.: 12" />

            <Alert className="sm:col-span-2">
              <CircleAlert />
              <AlertTitle>Validação preventiva</AlertTitle>
              <AlertDescription>
                Se outra regra ativa puder vencer com a mesma prioridade e especificidade, o salvamento será recusado e a regra conflitante aparecerá aqui.
              </AlertDescription>
            </Alert>

            <Button className="sm:col-span-2" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Check />}
              {editingRule ? "Salvar alterações" : "Cadastrar regra"}
            </Button>
          </form>

          <SheetFooter className="border-t bg-background">
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} disabled={busy}>
              Fechar sem alterar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
