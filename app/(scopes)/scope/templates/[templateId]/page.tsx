"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import TemplateScopeWizard from "@/components/scope/TemplateScopeWizard";
import General from "@/components/scope/General";
import { escopoFormDefault } from "@/domain/scope/defaults";
import { DeepPartial, EscopoForm } from "@/domain/scope/types";
import { Card, Stack } from "@/components/ui/form-layout";
import { useScopeMetadata, useScopeTemplate } from "@/lib/api/hooks/use-scope-api";
import { scopeApi } from "@/lib/api/services/scopes";
import type { ScopeTemplateDetailResponse } from "@/lib/api/types/scope-api";

function mergeTemplateDraft(defaults: EscopoForm, draft: DeepPartial<EscopoForm>): EscopoForm {
  return {
    ...defaults,
    ...draft,
    sobreEmpresa: { ...defaults.sobreEmpresa, ...draft.sobreEmpresa },
    contatos: draft.contatos ?? defaults.contatos,
    operacao: {
      ...defaults.operacao,
      ...draft.operacao,
      importacao: draft.operacao?.importacao
        ? { ...defaults.operacao.importacao, ...draft.operacao.importacao }
        : defaults.operacao.importacao,
      exportacao: draft.operacao?.exportacao
        ? { ...defaults.operacao.exportacao, ...draft.operacao.exportacao }
        : defaults.operacao.exportacao,
    },
    servicos: {
      ...defaults.servicos,
      ...draft.servicos,
      importacao: draft.servicos?.importacao
        ? { ...defaults.servicos.importacao, ...draft.servicos.importacao }
        : defaults.servicos.importacao,
      exportacao: draft.servicos?.exportacao
        ? { ...defaults.servicos.exportacao, ...draft.servicos.exportacao }
        : defaults.servicos.exportacao,
    },
    financeiro: { ...defaults.financeiro, ...draft.financeiro },
    geral: { ...defaults.geral, ...draft.geral },
  } as EscopoForm;
}

function EditScopeTemplateForm({
  template,
  responsaveis,
}: {
  template: ScopeTemplateDetailResponse;
  responsaveis: NonNullable<ReturnType<typeof useScopeMetadata>["data"]>["responsaveis"];
}) {
  const [form, setForm] = useState<EscopoForm>(() =>
    mergeTemplateDraft(escopoFormDefault, template.draft),
  );
  const [templateConfig, setTemplateConfig] = useState(() => ({
    name: template.name,
    description: template.description ?? "",
  }));

  const handleSave = useCallback(
    async (nextData: EscopoForm) => {
      await scopeApi.updateScopeTemplate({ id: template.id, ...templateConfig, draft: nextData });
    },
    [template.id, templateConfig],
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:items-start">
      <div className="min-w-0">
        <TemplateScopeWizard
          form={form}
          setForm={setForm}
          responsaveis={responsaveis}
          onSave={handleSave}
          title="Editar template de escopo"
          finishRedirect="/scope/new"
          templateConfig={templateConfig}
          onTemplateConfigChange={setTemplateConfig}
        />
      </div>
      <Stack>
        <Card>
          <p className="text-sm text-muted-foreground">Atualize os dados e o formulário-base deste template.</p>
        </Card>
        <General form={form} onChange={setForm} />
      </Stack>
    </div>
  );
}

export default function EditScopeTemplatePage() {
  const { templateId } = useParams<{ templateId: string }>();
  const { data: template, isLoading: loadingTemplate, error } = useScopeTemplate(templateId);
  const { data: metadataResponse, isLoading: loadingMetadata } = useScopeMetadata();

  if (loadingTemplate || loadingMetadata) return <div style={{ padding: 24 }}>Carregando template...</div>;
  if (error || !template) return <div style={{ padding: 24 }}>Template não encontrado.</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <EditScopeTemplateForm
        key={template.id}
        template={template}
        responsaveis={metadataResponse?.responsaveis ?? []}
      />
    </div>
  );
}
