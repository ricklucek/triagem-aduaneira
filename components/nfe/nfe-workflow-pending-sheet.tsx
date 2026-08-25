"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, CircleAlert, Loader2, Settings2 } from "lucide-react";
import { nfeApi } from "@/lib/api/services/nfe";
import type {
  FiscalProfilePayload,
  ImportPurpose,
  NfeWorkflowState,
} from "@/lib/api/types/nfe-api";
import { useToast } from "@/components/ui/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const actionTitles: Record<string, string> = {
  configure_fiscal_profile: "Cadastrar perfil fiscal",
  configure_tax_rule: "Cadastrar regra tributária",
  configure_number_sequence: "Configurar sequência numérica",
  configure_provider_connection: "Configurar conexão com o Portal Único",
  resolve_context: "Completar dados da importação",
  classify_items: "Classificar finalidades dos itens",
  create_document_plan: "Gerar plano de notas",
  review_document_plan: "Revisar plano de notas",
  create_draft: "Gerar rascunho da NF-e",
  correct_draft: "Corrigir divergências do rascunho",
  generate_access_key: "Gerar chave de acesso",
  generate_xml: "Gerar XML não assinado",
  validate_xml: "Validar XML no XSD",
};

const contextLabels: Record<string, string> = {
  clearance_location: "Local de desembaraço",
  clearance_state: "UF do desembaraço",
  clearance_date: "Data de desembaraço",
  transport_mode_code: "Via de transporte",
  "foreign_supplier.country_code": "Código BACEN do país",
  "foreign_supplier.country_name": "Nome do país do exportador",
  "client.fiscal_profile": "Perfil fiscal do cliente",
  tax_configuration: "Regra tributária",
};

function errorMessage(error: unknown) {
  const candidate = error as {
    response?: {
      data?: {
        message?: string;
        messages?: Record<string, string[]>;
      };
    };
    message?: string;
  };
  const validation = candidate.response?.data?.messages;
  const firstValidation = validation
    ? Object.values(validation).flat().find(Boolean)
    : undefined;
  return candidate.response?.data?.message || firstValidation || candidate.message || "Não foi possível concluir a operação.";
}

function Field({
  label,
  name,
  defaultValue,
  required = true,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`pending-${name}`}>{label}</Label>
      <Input
        id={`pending-${name}`}
        name={name}
        defaultValue={defaultValue}
        required={required}
        type={type}
        placeholder={placeholder}
      />
    </div>
  );
}

export function NfeWorkflowPendingSheet({
  open,
  onOpenChange,
  workflow,
  actionOverride,
  series,
  onResolved,
  onContinue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: NfeWorkflowState;
  actionOverride?: string | null;
  series: string;
  onResolved: () => Promise<void>;
  onContinue: () => Promise<void> | void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<FiscalProfilePayload | null>(null);
  const [rulePurpose, setRulePurpose] = useState<ImportPurpose>("resale");
  const action = actionOverride || workflow.next_action;
  const importer = workflow.process.importer;

  useEffect(() => {
    if (!open || !workflow.process.importer_id) return;
    let active = true;
    void nfeApi
      .getFiscalProfile(workflow.process.importer_id)
      .then((value) => {
        if (active) setProfile(value);
      })
      .catch(() => {
        if (active) setProfile(null);
      });
    return () => {
      active = false;
    };
  }, [open, workflow.process.importer_id]);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await nfeApi.saveFiscalProfile(workflow.process.importer_id, {
        legal_name: String(form.get("legal_name")),
        trade_name: String(form.get("trade_name") || "") || null,
        cnpj: importer?.cnpj || "",
        state_registration: String(form.get("state_registration") || "") || null,
        tax_regime: String(form.get("tax_regime")) as "1" | "2" | "3",
        street: String(form.get("street")),
        number: String(form.get("number")),
        complement: String(form.get("complement") || "") || null,
        district: String(form.get("district")),
        city_code: String(form.get("city_code")),
        city_name: String(form.get("city_name")),
        state: String(form.get("state")).toUpperCase(),
        zip_code: String(form.get("zip_code")).replace(/\D/g, ""),
        country_code: "1058",
        country_name: "Brasil",
        phone: String(form.get("phone") || "") || null,
        email: String(form.get("email") || "") || null,
      });
      await onResolved();
      onOpenChange(false);
      toast.success("Perfil fiscal salvo. O processo foi reavaliado.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function submitTaxRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const cst = String(form.get("icms_cst") || "");
    if (!cst) {
      toast.info("Selecione o CST de ICMS confirmado para esta operação.");
      return;
    }
    const rate = String(form.get("icms_rate") || "").trim();
    const configuration: Record<string, unknown> = {
      cfop: purposeCfops[rulePurpose],
      icms_origin: "1",
      icms_cst: cst,
      ipi_cst: "00",
      ipi_zero_rate_cst: "01",
      pis_cst: "99",
      cofins_cst: "99",
      document_defaults: {
        operation_nature: operationNatures[rulePurpose],
        presence_indicator: "9",
        intermediary_indicator: "0",
      },
      item_defaults: { commercial_unit: "UN", taxable_unit: "UN" },
    };
    if (rate) configuration.icms_rate = rate;
    if (cst === "51" && !rate) configuration.icms_base_reduction_rate = "100";

    setBusy(true);
    try {
      await nfeApi.createTaxRule(workflow.process.importer_id, {
        name: String(form.get("name")),
        issuer_state: String(form.get("issuer_state")).toUpperCase(),
        import_purpose: rulePurpose,
        import_modality: String(form.get("import_modality")) as "direct" | "on_behalf" | "by_order",
        tax_regime: String(form.get("tax_regime")) as "1" | "2" | "3",
        priority: Number(form.get("priority") || 100),
        effective_from: String(form.get("effective_from") || "").trim() || null,
        configuration_json: configuration,
        payment_defaults: { method: "90", value: "0.00" },
        transport_defaults: { freight_mode: "1" },
        active: true,
      });
      await onResolved();
      onOpenChange(false);
      toast.success("Regra tributária criada e aplicada à reavaliação do processo.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function submitSequence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await nfeApi.saveNumberSequence(workflow.process.importer_id, {
        environment: "production",
        model: "55",
        series,
        current_number: Number(form.get("current_number") || 0),
        initial_number: Number(form.get("initial_number") || 1),
        max_number: 999999999,
        status: "active",
      });
      await onResolved();
      onOpenChange(false);
      toast.success("Sequência numérica configurada. O processo foi reavaliado.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function submitProviderConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const scope = String(form.get("connection_scope") || "organization");
      await nfeApi.saveProviderConnection({
        importer_id: scope === "client" ? workflow.process.importer_id : null,
        provider: "portal_unico",
        environment: "production",
        auth_type: "api_key",
        status: "active",
        credentials_ref: String(form.get("credentials_ref") || "gcp:PORTAL_UNICO"),
        config_json: { role_type: "IMPEXP" },
      });
      await onResolved();
      onOpenChange(false);
      toast.success("Conexão do Portal Único configurada. O processo foi reavaliado.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const formKey = [action, profile?.state, profile?.tax_regime, workflow.process.importer_id].join(":");
  const pendingItems = workflow.item_classification?.pending_count || 0;
  const draftErrors = workflow.latest_draft?.draft.validation_errors;
  const errorCount = Array.isArray(draftErrors) ? draftErrors.length : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b pr-12">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <CircleAlert className="size-5" />
            <span className="text-sm font-medium">Pendência da etapa atual</span>
          </div>
          <SheetTitle>{actionTitles[action] || "Resolver pendência"}</SheetTitle>
          <SheetDescription>
            Resolva as informações abaixo e confirme. O fluxo será reavaliado automaticamente após o salvamento.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="text-xs text-muted-foreground">Processo</p>
            <strong>{workflow.process.reference_code}</strong>
            <p className="mt-1 text-xs text-muted-foreground">
              {importer?.name || importer?.legal_name} · {importer?.cnpj}
            </p>
          </div>

          {action === "configure_fiscal_profile" && (
            <form key={formKey} className="grid gap-4 sm:grid-cols-2" onSubmit={submitProfile}>
              <Field label="Razão social" name="legal_name" defaultValue={profile?.legal_name || importer?.legal_name} />
              <Field label="Nome fantasia" name="trade_name" defaultValue={profile?.trade_name || importer?.name} required={false} />
              <Field label="Inscrição estadual" name="state_registration" defaultValue={profile?.state_registration || ""} required={false} />
              <div className="space-y-1.5">
                <Label>Regime tributário NF-e</Label>
                <Select name="tax_regime" defaultValue={profile?.tax_regime || "3"}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Simples Nacional</SelectItem>
                    <SelectItem value="2">2 — Excesso sublimite</SelectItem>
                    <SelectItem value="3">3 — Regime normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="Logradouro" name="street" defaultValue={profile?.street} />
              <Field label="Número" name="number" defaultValue={profile?.number} />
              <Field label="Complemento" name="complement" defaultValue={profile?.complement || ""} required={false} />
              <Field label="Bairro" name="district" defaultValue={profile?.district} />
              <Field label="Código IBGE" name="city_code" defaultValue={profile?.city_code} placeholder="4106902" />
              <Field label="Município" name="city_name" defaultValue={profile?.city_name} />
              <Field label="UF" name="state" defaultValue={profile?.state} placeholder="PR" />
              <Field label="CEP" name="zip_code" defaultValue={profile?.zip_code} />
              <Field label="Telefone" name="phone" defaultValue={profile?.phone || ""} required={false} />
              <Field label="E-mail" name="email" defaultValue={profile?.email || ""} type="email" required={false} />
              <Button className="sm:col-span-2" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Check />} Salvar perfil e reavaliar
              </Button>
            </form>
          )}

          {action === "configure_tax_rule" && (
            <form key={formKey} className="grid gap-4 sm:grid-cols-2" onSubmit={submitTaxRule}>
              <Alert className="sm:col-span-2">
                <CircleAlert />
                <AlertTitle>Confirmação fiscal necessária</AlertTitle>
                <AlertDescription>
                  A regra será reutilizada em outros processos compatíveis. Confirme CST e alíquota com a equipe fiscal antes de uma futura autorização.
                </AlertDescription>
              </Alert>
              <Field label="Nome da regra" name="name" defaultValue="Regra tributária de importação" />
              <Field label="UF do emitente" name="issuer_state" defaultValue={profile?.state} placeholder="PR" />
              <div className="space-y-1.5">
                <Label>Finalidade atendida</Label>
                <Select value={rulePurpose} onValueChange={(value) => setRulePurpose(value as ImportPurpose)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(purposeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>CFOP dos itens</Label>
                <Input value={purposeCfops[rulePurpose]} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Modalidade</Label>
                <Select name="import_modality" defaultValue={String(workflow.context?.normalized?.import_modality || "direct")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Importação própria</SelectItem>
                    <SelectItem value="on_behalf">Por conta e ordem</SelectItem>
                    <SelectItem value="by_order">Por encomenda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Regime tributário</Label>
                <Select name="tax_regime" defaultValue={profile?.tax_regime || "3"}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Simples Nacional</SelectItem>
                    <SelectItem value="2">2 — Excesso sublimite</SelectItem>
                    <SelectItem value="3">3 — Regime normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ICMS CST confirmado</Label>
                <Select name="icms_cst">
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o tratamento" /></SelectTrigger>
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
              <Field label="Alíquota ICMS (quando aplicável)" name="icms_rate" required={false} placeholder="Ex.: 12" />
              <Field label="Prioridade" name="priority" type="number" defaultValue="100" />
              <Field label="Vigência inicial (opcional)" name="effective_from" type="date" required={false} />
              <Button className="sm:col-span-2" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Check />} Salvar regra e reavaliar
              </Button>
            </form>
          )}

          {action === "configure_number_sequence" && (
            <form className="grid gap-4" onSubmit={submitSequence}>
              <Alert>
                <Settings2 />
                <AlertTitle>Sequência da NF-e</AlertTitle>
                <AlertDescription>Modelo 55, série {series}. Informe o último número já utilizado para evitar duplicidade.</AlertDescription>
              </Alert>
              <Field label="Último número utilizado" name="current_number" type="number" defaultValue="0" />
              <Field label="Primeiro número permitido" name="initial_number" type="number" defaultValue="1" />
              <Button disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Check />} Salvar sequência e reavaliar
              </Button>
            </form>
          )}

          {action === "configure_provider_connection" && (
            <form className="grid gap-4" onSubmit={submitProviderConnection}>
              <div className="space-y-1.5"><Label>Escopo</Label><Select name="connection_scope" defaultValue="organization"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="organization">Toda a organização</SelectItem><SelectItem value="client">Somente este cliente</SelectItem></SelectContent></Select></div>
              <Field label="Referência das credenciais" name="credentials_ref" defaultValue="gcp:PORTAL_UNICO" />
              <Alert><CircleAlert /><AlertDescription>A referência aponta para credenciais mantidas no gerenciador de segredos; nenhuma chave será salva no banco.</AlertDescription></Alert>
              <Button disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Check />} Salvar conexão e reavaliar</Button>
            </form>
          )}

          {!["configure_fiscal_profile", "configure_tax_rule", "configure_number_sequence", "configure_provider_connection"].includes(action) && (
            <div className="space-y-4">
              {action === "resolve_context" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Informações que ainda precisam ser preenchidas</p>
                  <div className="flex flex-wrap gap-2">
                    {(workflow.context?.missing_fields || []).map((field) => (
                      <Badge key={field} variant="outline">{contextLabels[field] || field}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {action === "classify_items" && (
                <Alert><CircleAlert /><AlertTitle>{pendingItems} item(ns) pendente(s)</AlertTitle><AlertDescription>Informe a finalidade e confirme a regra tributária e o CFOP de cada item.</AlertDescription></Alert>
              )}
              {action === "correct_draft" && (
                <Alert variant="destructive"><CircleAlert /><AlertTitle>{errorCount} divergência(s) bloqueante(s)</AlertTitle><AlertDescription>Abra o editor do rascunho, corrija os campos indicados e submeta novamente.</AlertDescription></Alert>
              )}
              {action === "review_document_plan" && (
                <Alert><CircleAlert /><AlertTitle>{workflow.prerequisites.planned_documents_count} NF-e filha(s) planejada(s)</AlertTitle><AlertDescription>Confira exportadores, finalidades, CFOPs e rateio antes de prosseguir para o Checkpoint 3C.</AlertDescription></Alert>
              )}
              <Button className="w-full" onClick={() => void onContinue()} disabled={busy}>
                {actionTitles[action] || "Continuar resolução"}
              </Button>
            </div>
          )}
        </div>

        <SheetFooter className="border-t bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Fechar sem alterar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
