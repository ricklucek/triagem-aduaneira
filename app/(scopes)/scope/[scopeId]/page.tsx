"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ScopeWizard from "@/components/scope/ScopeWizard";
import { EscopoForm } from "@/domain/scope/types";
import { Card, Stack } from "@/components/ui/form-layout";
import { useScope, useScopeMetadata } from "@/lib/api/hooks/use-scope-api";
import { scopeApi } from "@/lib/api/services/scopes";
import { Badge } from "@/components/ui/badge";
import { formatCNPJ } from "@/utils/format";
import General from "@/components/scope/General";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";

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

  const draft = scopeResponse?.draft ? scopeResponse.draft : null;

  const statusCode = scopeResponse?.status ?? "draft";

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
  }, [scopeId, mutate]);

  if (loading) return <div style={{ padding: 24 }}>Carregando escopo...</div>;
  if (scopeError || !draft)
    return <div style={{ padding: 24 }}>Escopo não encontrado.</div>;

  if (statusCode === "archived")
    return (
      <div className="p-6">
        <Card>
          <Badge variant="secondary">Inativo</Badge>
          <p>
            Este escopo está inativo e disponível somente para consulta.
            Reative-o na lista de escopos para editar.
          </p>
          <Link className="underline" href={`/scope/view/${scopeId}`}>
            Consultar escopo
          </Link>
          <Link className="underline" href="/scope/list">
            Voltar à lista de escopos
          </Link>
        </Card>
      </div>
    );

  return (
    <ScopeEditor
      key={scopeId}
      draft={draft}
      statusCode={statusCode}
      responsaveis={responsaveis}
      onSave={handleSave}
      onPublish={handlePublish}
    />
  );
}

function ScopeEditor({
  draft,
  statusCode,
  responsaveis,
  onSave,
  onPublish,
}: {
  draft: EscopoForm;
  statusCode: "draft" | "published";
  responsaveis: ScopeResponsible[];
  onSave: (next: EscopoForm) => Promise<void>;
  onPublish: () => Promise<void>;
}) {
  const [form, setForm] = useState(draft);
  const status = statusCode === "draft" ? "Rascunho" : "Publicado";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:items-start">
        <div className="min-w-0">
          <ScopeWizard
            form={form}
            setForm={setForm}
            responsaveis={responsaveis}
            onSave={onSave}
            onPublish={onPublish}
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

          <General form={form} onChange={setForm} />
        </Stack>
      </div>
    </div>
  );
}
