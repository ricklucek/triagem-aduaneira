"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import ScopeWizard from "@/components/scope/ScopeWizard";
import General from "@/components/scope/General";
import { normalizeCanonicalDraft } from "@/components/scope/canonical-draft";

import type { EscopoForm } from "@/domain/scope/types";
import { Card, Stack } from "@/components/ui/form-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScopeDraft, useScopeMetadata } from "@/lib/api/hooks/use-scope-api";
import { scopeApi } from "@/lib/api/services/scopes";
import { formatCNPJ } from "@/utils/format";

export default function ScopeDetailPage() {
  const params = useParams<{ scopeId?: string; id?: string }>();
  const scopeId = params.scopeId ?? params.id ?? "";

  const { data, isLoading, error, mutate } = useScopeDraft(scopeId);
  const { data: metadataResponse } = useScopeMetadata();

  const draft = useMemo(
    () => (data?.draft ? normalizeCanonicalDraft(data.draft) : undefined),
    [data?.draft],
  );

  const [form, setForm] = useState<EscopoForm>(draft);

  useEffect(() => {
    if (draft) setForm(draft);
  }, [draft]);

  const statusCode = data?.status ?? "draft";
  const status =
    statusCode === "draft"
      ? "Rascunho"
      : statusCode === "published"
        ? "Publicado"
        : "Arquivado";

  const responsaveis = metadataResponse?.responsaveis ?? [];

  const handleSave = useCallback(
    async (nextData: EscopoForm) => {
      await scopeApi.saveScopeDraft({ id: scopeId, draft: nextData });
      await mutate();
    },
    [scopeId, mutate],
  );

  const handlePublish = useCallback(
    async (nextData: EscopoForm) => {
      await scopeApi.publishScope(scopeId, { draft: nextData });
      await mutate();
    },
    [scopeId, mutate],
  );

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando escopo...</div>;
  }

  if (error || !draft || !form) {
    return (
      <div className="p-6">
        <Card>
          <p className="font-medium">Escopo não encontrado.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            tente novamente.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:items-start">
        <div className="min-w-0">
          <ScopeWizard
            form={form}
            setForm={setForm}
            responsaveis={responsaveis}
            onSave={handleSave}
            onPublish={handlePublish}
            title="Escopo operacional"
            subtitle="Edite o draft canônico, salve rascunhos e publique os relacionamentos."
            status={status}
          />
        </div>

        <Stack>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <Badge variant={statusCode === "draft" ? "secondary" : "default"}>
                {status}
              </Badge>
              <Button type="button" variant="outline" onClick={() => handleSave(form)}>
                Salvar
              </Button>
            </div>

            <p className="mt-3 text-sm">
              {`${form.company?.legalName || "-"} • ${formatCNPJ(form.company?.taxId ?? "") || "-"}`}
            </p>

            <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
              <span>Versão: {data?.version ?? "-"}</span>
              <span>Operações: {form.operations?.types?.join(", ") || "Nenhuma"}</span>
              <span>Serviços selecionados: {form.services?.items?.filter((item) => item.enabled).length ?? 0}</span>
            </div>
          </Card>

          <General form={form} onChange={setForm} />
        </Stack>
      </div>
    </div>
  );
}
