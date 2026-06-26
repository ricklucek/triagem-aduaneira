"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import ScopeWizard from "@/components/scope/ScopeWizard";
import General from "@/components/scope/General";
import { EscopoForm } from "@/domain/scope/types";
import { Card, Stack } from "@/components/ui/form-layout";
import { useScopeMetadata, useScopeTemplate } from "@/lib/api/hooks/use-scope-api";
import { scopeApi } from "@/lib/api/services/scopes";
import type { ScopeTemplateDetailResponse } from "@/lib/api/types/scope-api";

function EditScopeTemplateForm({
  template,
  responsaveis,
}: {
  template: ScopeTemplateDetailResponse;
  responsaveis: NonNullable<ReturnType<typeof useScopeMetadata>["data"]>["responsaveis"];
}) {
  const [form, setForm] = useState<EscopoForm>(() => template.draft);
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
        <ScopeWizard
          form={form}
          setForm={setForm}
          responsaveis={responsaveis}
          onSave={handleSave}
          onPublish={() => handleSave(form)}
          title="Editar template de escopo"
          submitLabel="Salvar template"
          onFinishRedirect="/scope/new"
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
