"use client";

import Link from "next/link";
import ScopeWizard from "@/components/scope/ScopeWizard";
import type { EscopoForm } from "@/domain/scope/types";
import { scopeApi } from "@/lib/api/services/scopes";
import { useScope } from "@/lib/api/hooks/use-scope-api";
import { RotateCw } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EditDraftPage({
  params,
}: {
  params: { cnpj: string; id: string };
}) {
  const { data, isLoading, error, mutate } = useScope(params.id);

  async function handleSave(nextData: EscopoForm) {
    await scopeApi.saveScope({ id: params.id, draft: nextData });
    await mutate();
  }

  async function handlePublish() {
    await scopeApi.publishScope(params.id);
    await mutate();
  }

  if (isLoading) {
    return (
      <Card className="rounded-2xl p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RotateCw className="h-4 w-4 animate-spin" /> Carregando draft...
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="rounded-2xl p-4">
        <div className="text-sm font-semibold">Draft não encontrado</div>
        <div className="mt-2 text-sm text-muted-foreground">
          ID: {params.id}
        </div>
        <Button asChild variant="outline" className="mt-4 rounded-xl">
          <Link href={`/clients/${params.cnpj}/scopes`}>Voltar</Link>
        </Button>
      </Card>
    );
  }

  return (
    <ScopeWizard
      initialData={data.draft}
      onSave={handleSave}
      onPublish={handlePublish}
      title={`Escopo ${params.id}`}
      subtitle="Edite, valide e publique o escopo do cliente."
      status={data.status}
    />
  );
}
