"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getScopeRepo } from "@/data/scope/getScopeRepo";

export default function NewScopePage({ params }: { params: { cnpj: string } }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const repo = getScopeRepo();
      const { id } = await repo.createScope();
      const rec = await repo.getScope(id);
      await repo.saveDraft(id, {
        ...rec.draft,
        sobreEmpresa: {
          ...rec.draft.sobreEmpresa,
          cnpj: params.cnpj,
        },
      });

      if (!cancelled) {
        router.replace(`/clients/${params.cnpj}/scopes/edit/${id}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.cnpj, router]);

  return <div className="p-6 text-sm text-muted-foreground">Criando escopo...</div>;
}
