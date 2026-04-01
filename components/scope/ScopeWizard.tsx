"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { escopoFormDefault } from "@/domain/scope/defaults";
import { EtapaFormulario, EscopoForm } from "@/domain/scope/types";
import {
  validarEtapa,
  validarFormularioCompleto,
} from "@/domain/scope/validate";
import StepSobreEmpresa from "./StepSobreEmpresa";
import StepContatos from "./StepContatos";
import StepOperacao from "./StepOperacao";
import StepImportacao from "./StepImportacao";
import StepServicosImportacao from "./StepServicosImportacao";
import StepExportacao from "./StepExportacao";
import StepServicosExportacao from "./StepServicosExportacao";
import StepFinanceiro from "./StepFinanceiro";
import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StepPills,
  Toolbar,
} from "@/components/ui/form-layout";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function buildEtapas(data: EscopoForm): EtapaFormulario[] {
  const etapas: EtapaFormulario[] = ["SOBRE_EMPRESA", "CONTATOS", "OPERACAO"];

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
  responsaveis?: ScopeResponsible[];
  onSave?: (data: EscopoForm) => Promise<void> | void;
  onPublish?: () => Promise<void> | void;
  title?: string;
  subtitle?: string;
  status?: string;
};

export default function ScopeWizard({
  initialData,
  responsaveis = [],
  onSave,
  onPublish,
  title = "Escopos",
}: Props) {
  const [form, setForm] = useState<EscopoForm>(
    () => initialData ?? escopoFormDefault,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("Não salvo");
  const [errorSheetOpen, setErrorSheetOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const etapas = useMemo(() => buildEtapas(form), [form]);

  const stepFromUrl = searchParams.get("step");
  const etapaAtual = etapas.includes(stepFromUrl as EtapaFormulario)
    ? (stepFromUrl as EtapaFormulario)
    : etapas[0];

  const etapaAtualIndex = etapas.indexOf(etapaAtual);
  const isLastStep = etapaAtualIndex === etapas.length - 1;
  const isFirstStep = etapaAtualIndex === 0;

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
    [onSave],
  );

  const navigateToStep = useCallback(
    (nextStep: EtapaFormulario, method: "push" | "replace" = "push") => {
      const q = new URLSearchParams(searchParams.toString());
      q.set("step", nextStep);

      const url = `${pathname}?${q.toString()}`;

      if (method === "replace") {
        router.replace(url);
        return;
      }

      router.push(url);
    },
    [pathname, router, searchParams],
  );

  async function proximaEtapa() {
    const result = validarEtapa(etapaAtual, form);
    setErrors(result.errors);

    if (!result.ok) {
      setErrorSheetOpen(true);
      return;
    }

    const nextStep = etapas[etapaAtualIndex + 1];
    if (!nextStep) return;

    setErrors({});
    await persist(form, true);
    navigateToStep(nextStep, "push");
  }

  function etapaAnterior() {
    const previousStep = etapas[etapaAtualIndex - 1];
    if (!previousStep) return;

    setErrors({});
    navigateToStep(previousStep, "push");
  }

  async function finalizar() {
    const result = validarFormularioCompleto(form);
    setErrors(result.errors);

    if (!result.ok) {
      setErrorSheetOpen(true);
      return;
    }

    const ok = await persist(form);
    if (ok) {
      alert("Formulário válido. Rascunho salvo com sucesso.");
    }
  }

  async function publicar() {
    const result = validarFormularioCompleto(form);
    setErrors(result.errors);

    if (!result.ok) {
      setErrorSheetOpen(true);
      return;
    }

    const ok = await persist(form);
    if (!ok) return;

    if (onPublish) {
      await onPublish();
      setSavedMessage("Publicado");
    }
  }

  function focusErrorAt(index: number) {
    const invalidElements = Array.from(
      document.querySelectorAll<HTMLElement>("[aria-invalid='true']"),
    );

    const target = invalidElements[index] ?? invalidElements[0];

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus();
      setErrorSheetOpen(false);
    }
  }

  const errorEntries = Object.entries(errors);

  function renderEtapa() {
    switch (etapaAtual) {
      case "SOBRE_EMPRESA":
        return (
          <StepSobreEmpresa
            form={form}
            errors={errors}
            onChange={setForm}
            responsaveis={responsaveis}
          />
        );

      case "CONTATOS":
        return <StepContatos form={form} errors={errors} onChange={setForm} />;

      case "OPERACAO":
        return <StepOperacao form={form} errors={errors} onChange={setForm} />;

      case "IMPORTACAO":
        return (
          <StepImportacao
            form={form}
            errors={errors}
            onChange={setForm}
            responsaveis={responsaveis}
          />
        );

      case "SERVICOS_IMPORTACAO":
        return (
          <StepServicosImportacao
            form={form}
            errors={errors}
            onChange={setForm}
          />
        );

      case "EXPORTACAO":
        return (
          <StepExportacao
            form={form}
            errors={errors}
            onChange={setForm}
            responsaveis={responsaveis}
          />
        );

      case "SERVICOS_EXPORTACAO":
        return (
          <StepServicosExportacao
            form={form}
            errors={errors}
            onChange={setForm}
            responsaveis={responsaveis}
          />
        );

      case "FINANCEIRO":
        return (
          <StepFinanceiro form={form} errors={errors} onChange={setForm} />
        );

      default:
        return null;
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${saving ? "Salvando..." : savedMessage}`}
      />

      <StepPills
        steps={etapas.map((e) => STEP_LABELS[e])}
        currentIndex={etapaAtualIndex}
      />

      <div style={{ marginBottom: 20 }}>{renderEtapa()}</div>

      <Sheet open={errorSheetOpen} onOpenChange={setErrorSheetOpen}>
        <SheetContent side="right" className="w-full max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Erros desta etapa</SheetTitle>
            <SheetDescription>
              Revise os campos abaixo e use o botão para navegar até o ponto com
              erro.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 grid gap-3">
            {errorEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum erro encontrado no momento.
              </p>
            ) : (
              errorEntries.map(([path, message], index) => (
                <div key={path} className="rounded-xl border p-4">
                  <p className="text-sm font-semibold">{path}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {message}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => focusErrorAt(index)}
                  >
                    Ir para o campo
                  </Button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Toolbar
        left={
          !isFirstStep ? (
            <SecondaryButton
              type="button"
              onClick={etapaAnterior}
              disabled={saving}
            >
              Anterior
            </SecondaryButton>
          ) : (
            <div />
          )
        }
        right={
          <div style={{ display: "flex", gap: 8 }}>
            {isLastStep ? (
              <PrimaryButton type="button" onClick={publicar} disabled={saving}>
                Publicar
              </PrimaryButton>
            ) : (
              <>
                <SecondaryButton
                  type="button"
                  onClick={finalizar}
                  disabled={saving}
                >
                  Salvar rascunho
                </SecondaryButton>

                <PrimaryButton
                  type="button"
                  onClick={proximaEtapa}
                  disabled={saving}
                >
                  Próximo
                </PrimaryButton>
              </>
            )}
          </div>
        }
      />
    </div>
  );
}