"use client";

import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EtapaFormulario, EscopoForm } from "@/domain/scope/types";
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
import { toast } from "@/components/ui/toast";
import { TemplateScopeSchema } from "@/domain/scope/template-schema";
import { ZodError } from "zod";

type TemplateConfig = { name: string; description: string };
type TemplateStep = EtapaFormulario | "CONFIGURACAO_TEMPLATE";

function buildTemplateSteps(data: EscopoForm): TemplateStep[] {
  const etapas: TemplateStep[] = [
    "CONFIGURACAO_TEMPLATE",
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

const STEP_LABELS: Record<TemplateStep, string> = {
  CONFIGURACAO_TEMPLATE: "Configuração",
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
  form: EscopoForm;
  setForm: Dispatch<SetStateAction<EscopoForm>>;
  templateConfig: TemplateConfig;
  onTemplateConfigChange: Dispatch<SetStateAction<TemplateConfig>>;
  responsaveis?: ScopeResponsible[];
  onSave: (data: EscopoForm) => Promise<void> | void;
  title?: string;
  finishRedirect?: string;
};

function zodErrorToMap(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export default function TemplateScopeWizard({
  form,
  setForm,
  templateConfig,
  onTemplateConfigChange,
  responsaveis = [],
  onSave,
  title = "Template de escopo",
  finishRedirect = "/scope/new",
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("Não salvo");
  const [errorSheetOpen, setErrorSheetOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const etapas = useMemo(() => buildTemplateSteps(form), [form]);
  const stepFromUrl = searchParams.get("step");
  const etapaAtual = etapas.includes(stepFromUrl as TemplateStep)
    ? (stepFromUrl as TemplateStep)
    : etapas[0];
  const etapaAtualIndex = etapas.indexOf(etapaAtual);
  const isLastStep = etapaAtualIndex === etapas.length - 1;
  const isFirstStep = etapaAtualIndex === 0;

  const persist = useCallback(
    async (data: EscopoForm): Promise<boolean> => {
      setSaving(true);
      try {
        TemplateScopeSchema.parse({ ...templateConfig, draft: data });
        await onSave(data);
        setSavedMessage("Salvo automaticamente");
        return true;
      } catch (error) {
        setSavedMessage("Erro ao salvar");
        if (error instanceof ZodError) {
          setErrors(zodErrorToMap(error));
          setErrorSheetOpen(true);
          return false;
        }
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [onSave, templateConfig],
  );

  const navigateToStep = useCallback(
    (nextStep: TemplateStep) => {
      const q = new URLSearchParams(searchParams.toString());
      q.set("step", nextStep);
      router.push(`${pathname}?${q.toString()}`);
    },
    [pathname, router, searchParams],
  );

  async function proximaEtapa() {
    setErrors({});

    if (etapaAtual === "CONFIGURACAO_TEMPLATE") {
      const result = TemplateScopeSchema.pick({ name: true }).safeParse({
        name: templateConfig.name,
      });

      if (!result.success) {
        setErrors(zodErrorToMap(result.error));
        setErrorSheetOpen(true);
        return;
      }
    }

    const nextStep = etapas[etapaAtualIndex + 1];
    if (!nextStep) return;

    await persist(form);
    navigateToStep(nextStep);
  }

  function etapaAnterior() {
    const previousStep = etapas[etapaAtualIndex - 1];
    if (!previousStep) return;

    setErrors({});
    navigateToStep(previousStep);
  }

  async function salvarTemplate() {
    const ok = await persist(form);
    if (!ok) return;

    setSavedMessage("Template salvo");
    toast.success("Template salvo com sucesso.");
    router.replace(finishRedirect);
  }

  function focusErrorAt(path: string) {
    const guess = path.split(".").at(-1) ?? path;
    const target =
      document.querySelector<HTMLElement>(`[name='${path}']`) ??
      document.querySelector<HTMLElement>(`[name='${guess}']`) ??
      document.querySelector<HTMLElement>(`#${path}`) ??
      document.querySelector<HTMLElement>(`#${guess}`) ??
      Array.from(
        document.querySelectorAll<HTMLElement>("[aria-invalid='true']"),
      )[0];

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus();
      setErrorSheetOpen(false);
    }
  }

  const errorEntries = Object.entries(errors);

  function renderEtapa() {
    switch (etapaAtual) {
      case "CONFIGURACAO_TEMPLATE":
        return (
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-5 space-y-1">
              <h2 className="text-lg font-semibold">Configuração do template</h2>
              <p className="text-sm text-muted-foreground">
                Defina as informações de identificação do template de escopo.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="template-name">Nome do template</Label>
                <Input
                  id="template-name"
                  name="name"
                  value={templateConfig.name}
                  aria-invalid={Boolean(errors.name)}
                  onChange={(event) =>
                    onTemplateConfigChange((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Escopo padrão importação"
                />
                {errors.name ? (
                  <p className="text-sm text-destructive">{errors.name}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template-description">Descrição</Label>
                <Textarea
                  id="template-description"
                  name="description"
                  value={templateConfig.description}
                  onChange={(event) =>
                    onTemplateConfigChange((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Descreva quando este template deve ser utilizado."
                />
              </div>
            </div>
          </div>
        );

      case "SOBRE_EMPRESA":
        return (
          <StepSobreEmpresa
            form={form}
            errors={{}}
            onChange={setForm}
            responsaveis={responsaveis}
          />
        );

      case "CONTATOS":
        return <StepContatos form={form} errors={{}} onChange={setForm} />;

      case "OPERACAO":
        return <StepOperacao form={form} errors={{}} onChange={setForm} />;

      case "IMPORTACAO":
        return (
          <StepImportacao
            form={form}
            errors={{}}
            onChange={setForm}
            responsaveis={responsaveis}
          />
        );

      case "SERVICOS_IMPORTACAO":
        return (
          <StepServicosImportacao
            form={form}
            errors={{}}
            onChange={setForm}
          />
        );

      case "EXPORTACAO":
        return (
          <StepExportacao
            form={form}
            errors={{}}
            onChange={setForm}
            responsaveis={responsaveis}
          />
        );

      case "SERVICOS_EXPORTACAO":
        return (
          <StepServicosExportacao
            form={form}
            errors={{}}
            onChange={setForm}
            responsaveis={responsaveis}
          />
        );

      case "FINANCEIRO":
        return <StepFinanceiro form={form} errors={{}} onChange={setForm} />;

      default:
        return null;
    }
  }

  return (
    <div className="pb-10">
      <PageHeader title={title} subtitle={saving ? "Salvando..." : savedMessage} />

      <StepPills
        steps={etapas.map((e) => STEP_LABELS[e])}
        currentIndex={etapaAtualIndex}
        onSelect={(index) => navigateToStep(etapas[index])}
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
              errorEntries.map(([path, message]) => (
                <div key={path} className="rounded-xl border p-4">
                  <p className="text-sm font-semibold">{path}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {message}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => focusErrorAt(path)}
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
          isLastStep ? (
            <PrimaryButton type="button" onClick={salvarTemplate} disabled={saving}>
              Salvar template
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={proximaEtapa} disabled={saving}>
              Próximo
            </PrimaryButton>
          )
        }
      />
    </div>
  );
}
