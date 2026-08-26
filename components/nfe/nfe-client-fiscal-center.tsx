"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Check,
  CircleAlert,
  FilePenLine,
  Loader2,
  LockKeyhole,
  Plus,
  Power,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { nfeApi } from "@/lib/api/services/nfe";
import { getSessionRole } from "@/lib/api/hooks/use-auth";
import type {
  FiscalProfilePayload,
  ImportPurpose,
  ImportTaxRule,
  ImportTaxRuleDiagnostics,
  ImportTaxRulePayload,
  NfeNumberSequence,
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
  const [fiscalProfile, setFiscalProfile] = useState<FiscalProfilePayload | null>(null);
  const [numberSequence, setNumberSequence] = useState<NfeNumberSequence | null>(null);
  const [ruleSearch, setRuleSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "conflict">("all");
  const [icmsCst, setIcmsCst] = useState("90");
  const [icmsTreatment, setIcmsTreatment] = useState<"nominal" | "deferment" | "reduction">("nominal");
  const isAdmin = getSessionRole() === "admin";

  const loadRules = useCallback(async () => {
    setLoading(true);
    const [rulesResult, profileResult, sequencesResult] = await Promise.allSettled([
      nfeApi.getTaxRuleDiagnostics(clientId),
      nfeApi.getFiscalProfile(clientId),
      nfeApi.listNumberSequences(clientId),
    ]);
    if (rulesResult.status === "fulfilled") {
      setDiagnostics(rulesResult.value);
    } else {
      toast.error(apiError(rulesResult.reason).message);
    }
    setFiscalProfile(profileResult.status === "fulfilled" ? profileResult.value : null);
    if (sequencesResult.status === "fulfilled") {
      setNumberSequence(
        sequencesResult.value.find(
          (item) => item.environment === "production" && item.model === "55" && item.series === "1",
        ) || null,
      );
    } else {
      setNumberSequence(null);
    }
    setLoading(false);
  }, [clientId, toast]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  function openNewRule() {
    if (!isAdmin) return;
    setEditingRule(null);
    setPurpose("resale");
    setIcmsCst("90");
    setIcmsTreatment("nominal");
    setSaveConflicts([]);
    setSheetOpen(true);
  }

  function openRule(rule: ImportTaxRule) {
    if (!isAdmin) return;
    const configuration = rule.configuration_json || {};
    const cst = asText(configuration.icms_cst) || "90";
    setEditingRule(rule);
    setPurpose(rule.import_purpose);
    setIcmsCst(cst);
    setIcmsTreatment(
      cst === "51" && asText(configuration.icms_deferment_rate) === "100"
        ? "deferment"
        : cst === "51" && asText(configuration.icms_base_reduction_rate) === "100"
          ? "reduction"
          : "nominal",
    );
    setSaveConflicts(rule.conflicts || []);
    setSheetOpen(true);
  }

  async function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) || "").trim();
    const rate = text("icms_rate");
    const existingConfiguration = editingRule?.configuration_json || {};
    const existingDocument = (existingConfiguration.document_defaults as Record<string, unknown>) || {};
    const existingItems = (existingConfiguration.item_defaults as Record<string, unknown>) || {};
    const configuration: Record<string, unknown> = {
      ...existingConfiguration,
      cfop: text("cfop") || purposeCfops[purpose],
      icms_origin: text("icms_origin"),
      icms_cst: icmsCst,
      icms_tax_treatment_confirmed: true,
      ipi_cst: text("ipi_cst"),
      ipi_zero_rate_cst: text("ipi_zero_rate_cst"),
      pis_cst: text("pis_cst"),
      cofins_cst: text("cofins_cst"),
      document_defaults: {
        ...existingDocument,
        operation_nature: text("operation_nature"),
        presence_indicator: text("presence_indicator"),
        intermediary_indicator: text("intermediary_indicator"),
      },
      item_defaults: {
        ...existingItems,
        commercial_unit: text("commercial_unit"),
        taxable_unit: text("taxable_unit"),
      },
    };
    delete configuration.icms_rate;
    delete configuration.icms_base_reduction_rate;
    delete configuration.icms_deferment_rate;
    if (icmsCst === "51" && icmsTreatment === "deferment") {
      configuration.icms_deferment_rate = "100";
    } else if (icmsCst === "51" && icmsTreatment === "reduction") {
      configuration.icms_base_reduction_rate = "100";
    } else if (["00", "51", "90"].includes(icmsCst) && rate) {
      configuration.icms_rate = rate;
    }

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
      transport_defaults: {
        ...(editingRule?.transport_defaults || {}),
        freight_mode: text("freight_mode"),
      },
      payment_defaults: {
        ...(editingRule?.payment_defaults || {}),
        method: text("payment_method"),
        value: text("payment_value"),
      },
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
  const documentDefaults = (configuration.document_defaults as Record<string, unknown>) || {};
  const itemDefaults = (configuration.item_defaults as Record<string, unknown>) || {};
  const transportDefaults = editingRule?.transport_defaults || {};
  const paymentDefaults = editingRule?.payment_defaults || {};
  const conflictCount = diagnostics?.summary.conflict_count || 0;
  const normalizedSearch = ruleSearch.trim().toLocaleLowerCase("pt-BR");
  const visibleRules = rules.filter((rule) => {
    const matchesText = !normalizedSearch || [
      rule.name,
      rule.issuer_state,
      rule.ncm_pattern || "",
      purposeLabels[rule.import_purpose],
    ].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedSearch));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && rule.active && !rule.has_conflicts) ||
      (statusFilter === "inactive" && !rule.active) ||
      (statusFilter === "conflict" && rule.has_conflicts);
    return matchesText && matchesStatus;
  });
  const sequenceNextNumber = numberSequence ? numberSequence.current_number + 1 : null;

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
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Ambiente fiscal: Produção</Badge>
          <Badge variant="outline">Portal Único: Produção</Badge>
          <Badge variant="outline">Modelo: 55</Badge>
          <Badge variant="outline">Série: 1</Badge>
        </div>

        {!isAdmin && (
          <Alert>
            <LockKeyhole />
            <AlertTitle>Central fiscal em modo de consulta</AlertTitle>
            <AlertDescription>
              Perfil, sequência, integração e regras tributárias só podem ser alterados por administradores. A operação e a classificação dos itens continuam disponíveis no processo.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="font-medium">Perfil fiscal</p>
              <p className={`text-xs font-medium ${hasFiscalProfile ? "text-emerald-700" : "text-amber-700"}`}>
                {hasFiscalProfile ? "Configurado" : "Pendente"}
              </p>
              {fiscalProfile && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {fiscalProfile.city_name}/{fiscalProfile.state} · CRT {fiscalProfile.tax_regime}
                </p>
              )}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={onConfigureProfile} disabled={!isAdmin}>
              <Settings2 /> {hasFiscalProfile ? "Revisar" : "Configurar"}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="font-medium">Sequência numérica</p>
              <p className={`text-xs font-medium ${hasNumberSequence ? "text-emerald-700" : "text-amber-700"}`}>
                {hasNumberSequence ? "Configurada" : "Pendente"}
              </p>
              {numberSequence && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Atual {numberSequence.current_number} · Próximo {sequenceNextNumber} · {numberSequence.status === "active" ? "Ativa" : "Inativa"}
                </p>
              )}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={onConfigureSequence} disabled={!isAdmin}>
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
            <Button onClick={openNewRule} disabled={!isAdmin}><Plus /> Nova regra</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <Input
              value={ruleSearch}
              onChange={(event) => setRuleSearch(event.target.value)}
              placeholder="Pesquisar por nome, UF, finalidade ou NCM"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativas sem conflito</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
                <SelectItem value="conflict">Com conflito</SelectItem>
              </SelectContent>
            </Select>
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
                  {visibleRules.map((rule) => (
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
                          <Button variant="ghost" size="sm" onClick={() => openRule(rule)} disabled={!isAdmin}>
                            <FilePenLine /> Editar
                          </Button>
                          {rule.active && (
                            <Button variant="ghost" size="sm" onClick={() => void deactivateRule(rule)} disabled={busy || !isAdmin}>
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
              <Select value={icmsCst} onValueChange={(value) => {
                setIcmsCst(value);
                if (value !== "51") setIcmsTreatment("nominal");
              }}>
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

            {icmsCst === "51" ? (
              <div className="space-y-1.5">
                <Label>Tratamento do CST 51</Label>
                <Select value={icmsTreatment} onValueChange={(value) => setIcmsTreatment(value as typeof icmsTreatment)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nominal">Alíquota nominal</SelectItem>
                    <SelectItem value="deferment">Diferimento integral (100%)</SelectItem>
                    <SelectItem value="reduction">Redução integral da base (100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Tratamento do ICMS</Label>
                <Input value={["40", "41", "50"].includes(icmsCst) ? "Sem alíquota nominal" : "Alíquota nominal"} disabled />
              </div>
            )}

            {["00", "90"].includes(icmsCst) || (icmsCst === "51" && icmsTreatment === "nominal") ? (
              <FormField label="Alíquota do ICMS" name="icms_rate" defaultValue={asText(configuration.icms_rate)} placeholder="Ex.: 12" />
            ) : (
              <input type="hidden" name="icms_rate" value="" />
            )}

            <FormField label="CST do IPI" name="ipi_cst" defaultValue={asText(configuration.ipi_cst) || "00"} />
            <FormField label="CST IPI com alíquota zero" name="ipi_zero_rate_cst" defaultValue={asText(configuration.ipi_zero_rate_cst) || "01"} />
            <FormField label="CST do PIS" name="pis_cst" defaultValue={asText(configuration.pis_cst) || "99"} />
            <FormField label="CST da COFINS" name="cofins_cst" defaultValue={asText(configuration.cofins_cst) || "99"} />

            <FormField
              label="Natureza da operação"
              name="operation_nature"
              defaultValue={asText(documentDefaults.operation_nature) || operationNatures[purpose]}
            />
            <div className="space-y-1.5">
              <Label>Indicador de presença</Label>
              <Select name="presence_indicator" defaultValue={asText(documentDefaults.presence_indicator) || "9"}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 — Não se aplica</SelectItem>
                  <SelectItem value="9">9 — Operação não presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Intermediador</Label>
              <Select name="intermediary_indicator" defaultValue={asText(documentDefaults.intermediary_indicator) || "0"}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 — Sem intermediador</SelectItem>
                  <SelectItem value="1">1 — Com intermediador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <FormField label="Unidade comercial padrão" name="commercial_unit" defaultValue={asText(itemDefaults.commercial_unit) || "UN"} />
            <FormField label="Unidade tributável padrão" name="taxable_unit" defaultValue={asText(itemDefaults.taxable_unit) || "UN"} />

            <div className="space-y-1.5">
              <Label>Modalidade de frete padrão</Label>
              <Select name="freight_mode" defaultValue={asText(transportDefaults.freight_mode) || "1"}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 — Emitente</SelectItem>
                  <SelectItem value="1">1 — Destinatário</SelectItem>
                  <SelectItem value="2">2 — Terceiros</SelectItem>
                  <SelectItem value="9">9 — Sem transporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormField label="Meio de pagamento padrão" name="payment_method" defaultValue={asText(paymentDefaults.method) || "90"} />
            <FormField label="Valor de pagamento padrão" name="payment_value" defaultValue={asText(paymentDefaults.value) || "0.00"} />

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
