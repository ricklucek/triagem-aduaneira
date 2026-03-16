"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { escopoFormDefault } from "@/domain/scope/defaults";
import { EtapaFormulario, EscopoForm } from "@/domain/scope/types";
import { validarEtapa, validarFormularioCompleto } from "@/domain/scope/validate";
import StepInformacoesFixas from "./StepInformacoesFixas";
import StepSobreEmpresa from "./StepSobreEmpresa";
import StepContatos from "./StepContatos";
import StepOperacao from "./StepOperacao";
import StepImportacao from "./StepImportacao";
import StepServicosImportacao from "./StepServicosImportacao";
import StepExportacao from "./StepExportacao";
import StepServicosExportacao from "./StepServicosExportacao";
import StepFinanceiro from "./StepFinanceiro";
import {
  AlertWarning,
  PageHeader,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  StepPills,
  Toolbar,
} from "@/components/ui/form-layout";

function buildEtapas(data: EscopoForm): EtapaFormulario[] {
  const etapas: EtapaFormulario[] = [
    "INFORMACOES_FIXAS",
    "SOBRE_EMPRESA",
    "CONTATOS",
    "OPERACAO",
  ];

  if (data.operacao.tipos.includes("IMPORTACAO")) {
    etapas.push("IMPORTACAO", "SERVICOS_IMPORTACAO");
  }

  if (data.operacao.tipos.includes("EXPORTACAO")) {
    etapas.push("EXPORTACAO", "SERVICOS_EXPORTACAO");
  }

  etapas.push("FINANCEIRO");
  return etapas;
}

const STEP_LABELS: Record<EtapaFormulario, string> = {
  INFORMACOES_FIXAS: "Informações Fixas",
  SOBRE_EMPRESA: "Sobre a Empresa",
  CONTATOS: "Contatos",
  OPERACAO: "Operação",
  IMPORTACAO: "Importação",
  SERVICOS_IMPORTACAO: "Serviços Importação",
  EXPORTACAO: "Exportação",
  SERVICOS_EXPORTACAO: "Serviços Exportação",
  FINANCEIRO: "Financeiro",
};

type Props = {
  initialData?: EscopoForm | null;
  onSave?: (data: EscopoForm) => Promise<void> | void;
  onPublish?: () => Promise<void> | void;
  title?: string;
  subtitle?: string;
  status?: "draft" | "published" | "archived";
};

export default function ScopeWizard({
  initialData,
  onSave,
  onPublish,
  title = "Escopos",
  subtitle = "Formulário de montagem de escopo comercial e operacional.",
  status = "draft",
}: Props) {
  const [form, setForm] = useState<EscopoForm>(initialData ?? escopoFormDefault);
  const [indiceEtapa, setIndiceEtapa] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("Não salvo");

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  const etapas = useMemo(() => buildEtapas(form), [form]);
  const etapaAtual = etapas[indiceEtapa];

  const persist = useCallback(
    async (data: EscopoForm, silent = false): Promise<boolean> => {
      if (!onSave) return true;
      setSaving(true);
      try {
        await onSave(data);
        setSavedMessage(silent ? "Salvo automaticamente" : "Salvo");
        return true;
      } catch {
        setSavedMessage("Erro ao salvar");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [onSave]
  );

  async function proximaEtapa() {
    const result = validarEtapa(etapaAtual, form);
    setErrors(result.errors);
    if (!result.ok) return;

    await persist(form);
    setIndiceEtapa((prev) => prev + 1);
  }

  function etapaAnterior() {
    setErrors({});
    setIndiceEtapa((prev) => prev - 1);
  }

  async function finalizar() {
    const result = validarFormularioCompleto(form);
    setErrors(result.errors);
    if (!result.ok) return;

    const ok = await persist(form);
    if (ok) {
      alert("Formulário válido. Rascunho salvo com sucesso.");
    }
  }

  async function publicar() {
    const result = validarFormularioCompleto(form);
    setErrors(result.errors);
    if (!result.ok) return;

    const ok = await persist(form);
    if (!ok) return;

    if (onPublish) {
      await onPublish();
      setSavedMessage("Publicado");
    }
  }

  function updateForm(next: EscopoForm) {
    setForm(next);
  }

  function renderEtapa() {
    switch (etapaAtual) {
      case "INFORMACOES_FIXAS":
        return <StepInformacoesFixas form={form} errors={errors} onChange={updateForm} />;
      case "SOBRE_EMPRESA":
        return <StepSobreEmpresa form={form} errors={errors} onChange={updateForm} />;
      case "CONTATOS":
        return <StepContatos form={form} errors={errors} onChange={updateForm} />;
      case "OPERACAO":
        return <StepOperacao form={form} errors={errors} onChange={updateForm} />;
      case "IMPORTACAO":
        return <StepImportacao form={form} errors={errors} onChange={updateForm} />;
      case "SERVICOS_IMPORTACAO":
        return <StepServicosImportacao form={form} errors={errors} onChange={updateForm} />;
      case "EXPORTACAO":
        return <StepExportacao form={form} errors={errors} onChange={updateForm} />;
      case "SERVICOS_EXPORTACAO":
        return <StepServicosExportacao form={form} errors={errors} onChange={updateForm} />;
      case "FINANCEIRO":
        return <StepFinanceiro form={form} errors={errors} onChange={updateForm} />;
      default:
        return null;
    }
  }

  const errorList = Object.entries(errors).map(([k, v]) => `${k}: ${v}`);

  return (
    <PageShell>
      <PageHeader
        title={title}
        subtitle={`${subtitle} • Status: ${status} • ${saving ? "Salvando..." : savedMessage}`}
      />

      <StepPills steps={etapas.map((e) => STEP_LABELS[e])} currentIndex={indiceEtapa} />

      {errorList.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <AlertWarning
            title="Existem campos obrigatórios pendentes nesta etapa."
            items={errorList}
          />
        </div>
      ) : null}

      <div style={{ marginBottom: 20 }}>{renderEtapa()}</div>

      <Toolbar
        left={
          indiceEtapa > 0 ? (
            <SecondaryButton type="button" onClick={etapaAnterior} disabled={saving}>
              Anterior
            </SecondaryButton>
          ) : <div />
        }
        right={
          <div style={{ display: "flex", gap: 8 }}>
            {indiceEtapa === etapas.length - 1 ? (
              <>
                <SecondaryButton type="button" onClick={finalizar} disabled={saving}>
                  Salvar rascunho
                </SecondaryButton>
                <PrimaryButton type="button" onClick={publicar} disabled={saving}>
                  Publicar
                </PrimaryButton>
              </>
            ) : (
              <PrimaryButton type="button" onClick={proximaEtapa} disabled={saving}>
                Próximo
              </PrimaryButton>
            )}
          </div>
        }
      />
    </PageShell>
  );
}