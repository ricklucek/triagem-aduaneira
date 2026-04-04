"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import ScopeWizard from "@/components/scope/ScopeWizard";
import { EscopoForm } from "@/domain/scope/types";
import { Card, PageShell, Stack } from "@/components/ui/form-layout";
import { useScope, useScopeMetadata } from "@/lib/api/hooks/use-scope-api";
import { scopeApi } from "@/lib/api/services/scopes";
import { Badge } from "@/components/ui/badge";
import { formatCNPJ } from "@/utils/format";

export default function ScopeDetailPage() {
  const { scopeId } = useParams<{ scopeId: string }>();

  const {
    data: scopeResponse,
    isLoading: loadingScope,
    error: scopeError,
    mutate,
  } = useScope(scopeId);
  const { data: metadataResponse, isLoading: loadingMetadata } =
    useScopeMetadata();

  const loading = loadingScope || loadingMetadata;

  const draft = scopeResponse?.draft
    ? {
        ...scopeResponse.draft,
        informacoesFixas:
          metadataResponse?.informacoesFixas ??
          scopeResponse.draft.informacoesFixas,
      }
    : null;

  const statusCode = scopeResponse?.status ?? "draft";

  const status =
    statusCode === "draft"
      ? "Rascunho"
      : statusCode === "published"
        ? "Publicado"
        : "Arquivado";

  const responsaveis = metadataResponse?.responsaveis ?? [];

  const handleSave = useCallback(
    async (nextData: EscopoForm) => {
      await scopeApi.saveScope({ id: scopeId, draft: nextData });
      await mutate();
    },
    [scopeId, mutate],
  );

  const handlePublish = useCallback(async () => {
    await scopeApi.publishScope(scopeId);
    await mutate();
  }, [mutate, scopeId]);

  if (loading) return <div style={{ padding: 24 }}>Carregando escopo...</div>;
  if (scopeError || !draft)
    return <div style={{ padding: 24 }}>Escopo não encontrado.</div>;

  return (
    <PageShell className="space-y-4">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:items-start">
        <div className="min-w-0">
          <ScopeWizard
            initialData={draft}
            responsaveis={responsaveis}
            onSave={handleSave}
            onPublish={handlePublish}
            title={""}
            subtitle="Edite, valide e publique o escopo."
            status={status}
          />
        </div>

        <Stack>
          <Card>
            <Badge variant={statusCode === "draft" ? "secondary" : "default"}>
              {status}
            </Badge>
            <p className="text-sm">{`${draft.sobreEmpresa.razaoSocial || "-"} • ${formatCNPJ(draft.sobreEmpresa.cnpj) || "-"}`}</p>
          </Card>
        </Stack>
      </div>
    </PageShell>
  );
}
