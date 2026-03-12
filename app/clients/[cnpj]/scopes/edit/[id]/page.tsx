"use client";

import { useMemo } from "react";
import { useScopeStore } from "@/lib/scope/use-scope-store";
import { ScopeWizard } from "@/components/scope/scope-wizard";
import type { Scope } from "@/lib/scope/schema";
import { defaultScope } from "@/lib/scope/schema";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EditDraftPage({ params }: { params: { cnpj: string; id: string } }) {
  const { loadOne } = useScopeStore(params.cnpj);

  const record = useMemo(() => loadOne(params.id), [loadOne, params.id]);
  const initial: Scope | null = record?.data ?? null;

  if (!record) {
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

  // evita “flash” de default values
  if (!initial) {
    return (
      <Card className="rounded-2xl p-4">
        <div className="text-sm text-muted-foreground">Carregando draft...</div>
      </Card>
    );
  }

  return (
    <ScopeWizard
      cnpj={params.cnpj}
      initialScope={{
        ...defaultScope,
        ...initial,
        client: { ...defaultScope.client, ...initial.client, cnpj: params.cnpj },
        meta: { ...initial.meta, status: "draft" },
      }}
      draftId={record.id}
    />
  );
}