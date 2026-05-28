"use client";

import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { EscopoForm } from "@/domain/scope/types";
import {
  EscopoSchema,
  ScopeStepCompanySchema,
  ScopeStepContactsSchema,
  ScopeStepOperationTypesSchema,
  ScopeStepImportOperationSchema,
  ScopeStepExportOperationSchema,
  ScopeStepTaxesSchema,
  ScopeStepServicesSchema,
  ScopeStepFinancialSchema,
} from "@/domain/scope/schema";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";

import { toast } from "@/components/ui/toast";
import { Card, PageHeader, PrimaryButton, SecondaryButton, StepPills, Toolbar } from "@/components/ui/form-layout";

import CompanyStep from "./CompanyStep";
import ContactsStep from "./ContactsStep";
import OperationsStep from "./OperationsStep";
import OperationDetailStep from "./OperationDetailStep";
import TaxesStep from "./TaxesStep";
import ServicesStep from "./ServicesStep";
import FinancialStep from "./FinancialStep";

type EtapaFormulario =
  | "COMPANY"
  | "CONTACTS"
  | "OPERATIONS"
  | "IMPORT"
  | "EXPORT"
  | "TAXES"
  | "SERVICES"
  | "FINANCIAL";

const STEP_LABELS: Record<EtapaFormulario, string> = {
  COMPANY: "Empresa",
  CONTACTS: "Contatos",
  OPERATIONS: "Operações",
  IMPORT: "Importação",
  EXPORT: "Exportação",
  TAXES: "Impostos",
  SERVICES: "Serviços",
  FINANCIAL: "Financeiro",
};

type Props = {
  form: EscopoForm;
  setForm: Dispatch<SetStateAction<EscopoForm>>;
  responsaveis?: ScopeResponsible[];
  onSave?: (data: EscopoForm) => Promise<void> | void;
  onPublish?: (data: EscopoForm) => Promise<void> | void;
  title?: string;
  subtitle?: string;
  status?: string;
};

function buildEtapas(data: EscopoForm): EtapaFormulario[] {
  const etapas: EtapaFormulario[] = ["COMPANY", "CONTACTS", "OPERATIONS"];

  if (data.operations.types.includes("IMPORT")) etapas.push("IMPORT");
  if (data.operations.types.includes("EXPORT")) etapas.push("EXPORT");

  etapas.push("TAXES", "SERVICES", "FINANCIAL");
  return etapas;
}

function zodErrorsToMap(error: any) {
  const map: Record<string, string> = {};
  for (const issue of error?.issues ?? []) {
    const path = issue.path?.join(".") || "form";
    if (!map[path]) map[path] = issue.message;
  }
  return map;
}

function validateForm(data: EscopoForm) {
  const result = EscopoSchema.safeParse(data);
  if (result.success) return { ok: true, errors: {} as Record<string, string> };
  return { ok: false, errors: zodErrorsToMap(result.error) };
}

function validateStep(step: EtapaFormulario, data: EscopoForm) {
  const schemas: Record<EtapaFormulario, { safeParse: (value: unknown) => any }> = {
    COMPANY: ScopeStepCompanySchema,
    CONTACTS: ScopeStepContactsSchema,
    OPERATIONS: ScopeStepOperationTypesSchema,
    IMPORT: ScopeStepImportOperationSchema,
    EXPORT: ScopeStepExportOperationSchema,
    TAXES: ScopeStepTaxesSchema,
    SERVICES: ScopeStepServicesSchema,
    FINANCIAL: ScopeStepFinancialSchema,
  };

  const result = schemas[step].safeParse(data);
  if (result.success) return { ok: true, errors: {} as Record<string, string> };
  return { ok: false, errors: zodErrorsToMap(result.error) };
}


export default function ScopeWizard({
  form,
  setForm,
  responsaveis = [],
  onSave,
  onPublish,
  title = "Escopo",
  subtitle = "Edite, valide e publique o escopo.",
  status,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("Não salvo");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const etapas = useMemo(() => buildEtapas(form), [form]);
  const stepFromUrl = searchParams.get("step") as EtapaFormulario | null;
  const etapaAtual = stepFromUrl && etapas.includes(stepFromUrl) ? stepFromUrl : etapas[0];
  const etapaAtualIndex = etapas.indexOf(etapaAtual);
  const isFirstStep = etapaAtualIndex === 0;
  const isLastStep = etapaAtualIndex === etapas.length - 1;

  const patchForm = useCallback(
    (patch: Partial<EscopoForm>) => setForm((current) => ({ ...current, ...patch })),
    [setForm],
  );

  const persist = useCallback(
    async (data: EscopoForm, silent = false) => {
      if (!onSave) return true;
      setSaving(true);
      try {
        await onSave(data);
        setSavedMessage(silent ? "Salvo automaticamente" : "Salvo");
        return true;
      } catch {
        setSavedMessage("Erro ao salvar");
        toast.error("Não foi possível salvar o rascunho.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [onSave],
  );

  const navigateToStep = useCallback(
    (nextStep: EtapaFormulario, method: "push" | "replace" = "push") => {
      const q = new URLSearchParams(searchParams.toString());
      q.set("step", nextStep);
      const url = `${pathname}?${q.toString()}`;
      if (method === "replace") router.replace(url);
      else router.push(url);
    },
    [pathname, router, searchParams],
  );

  async function proximaEtapa() {
    const result = validateStep(etapaAtual, form);
    setErrors(result.errors);
    if (!result.ok) return;

    await persist(form, true);
    const nextStep = etapas[etapaAtualIndex + 1];
    if (nextStep) navigateToStep(nextStep);
  }

  function etapaAnterior() {
    const previousStep = etapas[etapaAtualIndex - 1];
    if (previousStep) navigateToStep(previousStep);
  }

  async function salvarRascunho() {
    await persist(form, false);
  }

  async function publicar() {
    const result = validateForm(form);
    setErrors(result.errors);
    if (!result.ok) {
      toast.error("Revise os campos obrigatórios antes de publicar.");
      return;
    }

    const ok = await persist(form, true);
    if (!ok) return;

    if (onPublish) {
      setSaving(true);
      try {
        await onPublish(form);
        setSavedMessage("Publicado");
        toast.success("Escopo publicado com sucesso.");
        router.refresh();
      } finally {
        setSaving(false);
      }
    }
  }

  function renderStep() {
    switch (etapaAtual) {
      case "COMPANY":
        return <CompanyStep form={form} patchForm={patchForm} errors={errors} responsaveis={responsaveis} />;
      case "CONTACTS":
        return <ContactsStep form={form} patchForm={patchForm} errors={errors} />;
      case "OPERATIONS":
        return <OperationsStep form={form} patchForm={patchForm} errors={errors} />;
      case "IMPORT":
        return <OperationDetailStep operationType="IMPORT" form={form} patchForm={patchForm} errors={errors} responsaveis={responsaveis} />;
      case "EXPORT":
        return <OperationDetailStep operationType="EXPORT" form={form} patchForm={patchForm} errors={errors} responsaveis={responsaveis} />;
      case "TAXES":
        return <TaxesStep form={form} patchForm={patchForm} errors={errors} />;
      case "SERVICES":
        return <ServicesStep form={form} patchForm={patchForm} errors={errors} />;
      case "FINANCIAL":
        return <FinancialStep form={form} patchForm={patchForm} errors={errors} />;
      default:
        return null;
    }
  }

  return (
    <div className="pb-10">
      <PageHeader title={title} subtitle={`${subtitle} ${status ? `• ${status}` : ""} • ${saving ? "Salvando..." : savedMessage}`} />

      <StepPills
        steps={etapas.map((etapa) => STEP_LABELS[etapa])}
        currentIndex={etapaAtualIndex}
        onSelect={(index) => navigateToStep(etapas[index])}
      />

      <div className="mb-5">{renderStep()}</div>

      {Object.keys(errors).length > 0 ? (
        <Card className="mb-5 border-destructive/40 bg-destructive/5">
          <div className="text-sm font-semibold text-destructive">Campos pendentes</div>
          <div className="mt-2 grid gap-1 text-sm text-destructive">
            {Object.entries(errors).slice(0, 8).map(([path, message]) => (
              <div key={path}>• {path}: {message}</div>
            ))}
          </div>
        </Card>
      ) : null}

      <Toolbar
        left={
          !isFirstStep ? (
            <SecondaryButton type="button" onClick={etapaAnterior} disabled={saving}>
              Anterior
            </SecondaryButton>
          ) : (
            <div />
          )
        }
        right={
          <div className="flex flex-wrap gap-2">
            <SecondaryButton type="button" onClick={salvarRascunho} disabled={saving}>
              Salvar rascunho
            </SecondaryButton>

            {isLastStep ? (
              <PrimaryButton type="button" onClick={publicar} disabled={saving}>
                Publicar
              </PrimaryButton>
            ) : (
              <PrimaryButton type="button" onClick={proximaEtapa} disabled={saving}>
                Próximo
              </PrimaryButton>
            )}
          </div>
        }
      />
    </div>
  );
}
