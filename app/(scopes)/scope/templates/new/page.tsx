"use client";

import { useCallback, useRef, useState } from "react";
import ScopeWizard from "@/components/scope/ScopeWizard";
import General from "@/components/scope/General";
import { escopoFormDefault } from "@/domain/scope/defaults";
import { EscopoForm } from "@/domain/scope/types";
import { Card, Stack } from "@/components/ui/form-layout";
import { scopeApi } from "@/lib/api/services/scopes";
import { useScopeMetadata } from "@/lib/api/hooks/use-scope-api";

export default function NewScopeTemplatePage() {
  const [form, setForm] = useState<EscopoForm>(escopoFormDefault);
  const [templateConfig, setTemplateConfig] = useState({ name: "", description: "" });
  const templateIdRef = useRef<string | null>(null);
  const { data: metadataResponse, isLoading } = useScopeMetadata();

  const handleSave = useCallback(
    async (nextData: EscopoForm) => {
      if (templateIdRef.current) {
        await scopeApi.updateScopeTemplate({
          id: templateIdRef.current,
          ...templateConfig,
          draft: nextData,
        });
        return;
      }

      const created = await scopeApi.createScopeTemplate({
        ...templateConfig,
        draft: nextData,
      });
      templateIdRef.current = created.id;
    },
    [templateConfig],
  );

  if (isLoading) return <div style={{ padding: 24 }}>Carregando metadados...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:items-start">
        <div className="min-w-0">
          <ScopeWizard
            form={form}
            setForm={setForm}
            responsaveis={metadataResponse?.responsaveis ?? []}
            onSave={handleSave}
            onPublish={() => handleSave(form)}
            title="Novo template de escopo"
            submitLabel="Salvar template"
            onFinishRedirect="/scope/new"
            templateConfig={templateConfig}
            onTemplateConfigChange={setTemplateConfig}
          />
        </div>
        <Stack>
          <Card>
            <p className="text-sm text-muted-foreground">Este formulário salva um modelo reutilizável para criação de novos escopos.</p>
          </Card>
          <General form={form} onChange={setForm} />
        </Stack>
      </div>
    </div>
  );
}
