"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ScopeWizard from "@/components/scope/ScopeWizard";
import { getScopeRepo } from "@/data/scope/getScopeRepo";
import type { EscopoForm } from "@/domain/scope/types";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EditDraftPage({ params }: { params: { cnpj: string; id: string } }) {
  const repo = useMemo(() => getScopeRepo(), []);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<EscopoForm | null>(null);
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rec = await repo.getScope(params.id);
        if (!cancelled) {
          setDraft(rec.draft);
          setStatus(rec.status);
        }
      } catch {
        if (!cancelled) setDraft(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id, repo]);

  async function handleSave(nextData: EscopoForm) {
    await repo.saveDraft(params.id, nextData);
    setDraft(nextData);
    const rec = await repo.getScope(params.id);
    setStatus(rec.status);
  }

  async function handlePublish() {
    await repo.publish(params.id);
    const rec = await repo.getScope(params.id);
    setStatus(rec.status);
    setDraft(rec.draft);
    alert("Escopo publicado com sucesso.");
  }

  if (loading) {
    return (
      <Card className="rounded-2xl p-4">
        <div className="text-sm text-muted-foreground">Carregando draft...</div>
      </Card>
    );
  }

  if (!draft) {
    return (
      <Card className="rounded-2xl p-4">
        <div className="text-sm font-semibold">Draft não encontrado</div>
        <div className="mt-2 text-sm text-muted-foreground">ID: {params.id}</div>
        <Button asChild variant="outline" className="mt-4 rounded-xl">
          <Link href={`/clients/${params.cnpj}/scopes`}>Voltar</Link>
        </Button>
      </Card>
    );
  }

  return (
    <ScopeWizard
      initialData={draft}
      onSave={handleSave}
      onPublish={handlePublish}
      title={`Escopo ${params.id}`}
      subtitle="Edite, valide e publique o escopo do cliente."
      status={status}
    />
  );
}
