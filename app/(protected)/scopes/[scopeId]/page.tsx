"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ScopeWizard from "@/components/scope/ScopeWizard";
import VersionHistory from "@/components/scope/VersionHistory";
import { EscopoForm } from "@/domain/scope/types";
import { Card, PageShell, SecondaryButton, Stack } from "@/components/ui/form-layout";
import { useScope, useScopeVersions } from "@/lib/api/hooks/use-scope-api";
import { scopeApi } from "@/lib/api/services/scopes";

export default function ScopeDetailPage() {
  const { scopeId } = useParams<{ scopeId: string }>();
  const router = useRouter();

  const { data: scopeResponse, isLoading: loadingScope, error: scopeError, mutate } = useScope(scopeId);
  const { data: versionsResponse, isLoading: loadingVersions, mutate: mutateVersions } = useScopeVersions(scopeId);

  const loading = loadingScope || loadingVersions;
  const draft = scopeResponse?.draft ?? null;
  const status = scopeResponse?.status ?? "draft";
  const versions = versionsResponse ?? [];

  const handleSave = useCallback(
    async (nextData: EscopoForm) => {
      await scopeApi.saveScopeDraft({ id: scopeId, draft: nextData });
      await mutate();
    },
    [mutate, scopeId]
  );

  const handlePublish = useCallback(async () => {
    await scopeApi.publishScope(scopeId);
    await Promise.all([mutate(), mutateVersions()]);
    alert("Escopo publicado com sucesso.");
  }, [mutate, mutateVersions, scopeId]);

  if (loading) return <div style={{ padding: 24 }}>Carregando escopo...</div>;
  if (scopeError || !draft) return <div style={{ padding: 24 }}>Escopo não encontrado.</div>;

  return (
    <PageShell>
      <div style={{ marginBottom: 16 }}>
        <SecondaryButton type="button" onClick={() => router.push("/dashboard")}>
          Voltar ao dashboard
        </SecondaryButton>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 1fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div>
          <ScopeWizard
            initialData={draft}
            onSave={handleSave}
            onPublish={handlePublish}
            title={`Escopo ${scopeId}`}
            subtitle="Edite, valide e publique o escopo."
            status={status}
          />
        </div>

        <Stack>
          <VersionHistory versions={versions} />
          <Card>
            <h3 style={{ marginTop: 0 }}>Resumo</h3>
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Razão social:</strong> {draft.sobreEmpresa.razaoSocial || "-"}</p>
            <p><strong>CNPJ:</strong> {draft.sobreEmpresa.cnpj || "-"}</p>
          </Card>
        </Stack>
      </div>
    </PageShell>
  );
}
