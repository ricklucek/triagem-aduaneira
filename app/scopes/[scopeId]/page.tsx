"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ScopeWizard from "@/components/scope/ScopeWizard";
import VersionHistory from "@/components/scope/VersionHistory";
import { getScopeRepo } from "@/data/scope/getScopeRepo";
import { EscopoForm } from "@/domain/scope/types";
import { Card, PageShell, SecondaryButton, Stack } from "@/components/ui/form-layout";
import { ScopeVersion } from "@/data/scope/ScopeRepo";

export default function ScopeDetailPage() {
  const { scopeId } = useParams<{ scopeId: string }>();
  const router = useRouter();
  const repo = useMemo(() => getScopeRepo(), []);

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<EscopoForm | null>(null);
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [versions, setVersions] = useState<ScopeVersion[]>([]);

  const carregar = useCallback(async () => {
    try {
      const rec = await repo.getScope(scopeId);
      const versionList = await repo.listVersions(scopeId);
      setDraft(rec.draft);
      setStatus(rec.status);
      setVersions(versionList);
    } catch {
      alert("Escopo não encontrado.");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [repo, router, scopeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleSave(nextData: EscopoForm) {
    await repo.saveDraft(scopeId, nextData);
    setDraft(nextData);
    const rec = await repo.getScope(scopeId);
    setStatus(rec.status);
  }

  async function handlePublish() {
    await repo.publish(scopeId);
    await carregar();
    alert("Escopo publicado com sucesso.");
  }

  if (loading) return <div style={{ padding: 24 }}>Carregando escopo...</div>;
  if (!draft) return <div style={{ padding: 24 }}>Escopo não encontrado.</div>;

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