"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, CircleAlert, Loader2, Settings2 } from "lucide-react";
import { nfeApi } from "@/lib/api/services/nfe";
import { getSessionRole } from "@/lib/api/hooks/use-auth";
import type {
  FiscalProfilePayload,
  NfeNumberSequence,
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

const actionTitles: Record<string, string> = {
  configure_fiscal_profile: "Cadastrar perfil fiscal",
  configure_tax_rule: "Cadastrar regra tributária",
  configure_number_sequence: "Configurar sequência numérica",
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
  const [numberSequence, setNumberSequence] = useState<NfeNumberSequence | null>(null);
  const action = actionOverride || workflow.next_action;
  const isAdmin = getSessionRole() === "admin";
  const importer = workflow.process.importer;

  useEffect(() => {
    if (!open || !workflow.process.importer_id) return;
    let active = true;
    void Promise.allSettled([
      nfeApi.getFiscalProfile(workflow.process.importer_id),
      nfeApi.listNumberSequences(workflow.process.importer_id),
    ]).then(([profileResult, sequencesResult]) => {
      if (!active) return;
      setProfile(profileResult.status === "fulfilled" ? profileResult.value : null);
      setNumberSequence(
        sequencesResult.status === "fulfilled"
          ? sequencesResult.value.find(
              (item) =>
                item.environment === "production" &&
                item.model === "55" &&
                item.series === series,
            ) || null
          : null,
      );
    });
    return () => {
      active = false;
    };
  }, [open, series, workflow.process.importer_id]);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) {
      toast.error("Somente administradores podem alterar o perfil fiscal.");
      return;
    }
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

  async function submitSequence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) {
      toast.error("Somente administradores podem alterar a sequência fiscal.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const payload = {
        environment: "production" as const,
        model: "55" as const,
        series,
        initial_number: Number(form.get("initial_number") || numberSequence?.initial_number || 1),
        max_number: Number(form.get("max_number") || numberSequence?.max_number || 999999999),
        status: String(form.get("status") || numberSequence?.status || "active") as "active" | "inactive",
        ...(numberSequence
          ? {}
          : { current_number: Number(form.get("current_number") || 0) }),
      };
      await nfeApi.saveNumberSequence(workflow.process.importer_id, payload);
      await onResolved();
      onOpenChange(false);
      toast.success(
        numberSequence
          ? "Sequência atualizada sem alterar o progresso numérico."
          : "Sequência numérica configurada. O processo foi reavaliado.",
      );
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
              <Button className="sm:col-span-2" disabled={busy || !isAdmin}>
                {busy ? <Loader2 className="animate-spin" /> : <Check />} Salvar perfil e reavaliar
              </Button>
            </form>
          )}

          {action === "configure_tax_rule" && (
            <Alert>
              <Settings2 />
              <AlertTitle>Regra tributária na Central Fiscal</AlertTitle>
              <AlertDescription>
                Feche esta pendência e use a tabela de regras na etapa Cliente. O formulário rápido foi removido para evitar configurações fiscais incompletas ou defaults silenciosos.
              </AlertDescription>
            </Alert>
          )}

          {action === "configure_number_sequence" && (
            <form className="grid gap-4" onSubmit={submitSequence}>
              <Alert>
                <Settings2 />
                <AlertTitle>Sequência da NF-e</AlertTitle>
                <AlertDescription>
                  Produção · modelo 55 · série {series}. O progresso existente nunca será reduzido por esta tela.
                </AlertDescription>
              </Alert>

              {numberSequence ? (
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Número atual</p>
                    <strong>{numberSequence.current_number}</strong>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Próximo número</p>
                    <strong>{numberSequence.current_number + 1}</strong>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Último reservado</p>
                    <strong>{numberSequence.last_reserved_number ?? "Nenhum"}</strong>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Última reserva</p>
                    <strong>
                      {numberSequence.last_reserved_at
                        ? new Intl.DateTimeFormat("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(numberSequence.last_reserved_at))
                        : "Nenhuma"}
                    </strong>
                  </div>
                </div>
              ) : (
                <Field label="Último número já utilizado" name="current_number" type="number" defaultValue="0" />
              )}

              <Field
                label="Primeiro número permitido"
                name="initial_number"
                type="number"
                defaultValue={String(numberSequence?.initial_number ?? 1)}
              />
              <Field
                label="Número máximo"
                name="max_number"
                type="number"
                defaultValue={String(numberSequence?.max_number ?? 999999999)}
              />
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select name="status" defaultValue={numberSequence?.status || "active"}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button disabled={busy || !isAdmin}>
                {busy ? <Loader2 className="animate-spin" /> : <Check />}
                {numberSequence ? "Salvar sem alterar numeração" : "Cadastrar sequência"}
              </Button>
            </form>
          )}

          {!["configure_fiscal_profile", "configure_tax_rule", "configure_number_sequence"].includes(action) && (
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
