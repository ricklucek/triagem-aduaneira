"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { scopeApi } from "@/lib/api/services/scopes";
import { clientsApi } from "@/lib/api/services/clients";

export default function NewScopePage({ params }: { params: { cnpj: string } }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const client = await clientsApi.getClient(params.cnpj);
        const { id } = await scopeApi.createScope();
        const rec = await scopeApi.getScope(id);

        await scopeApi.saveScope({
          id,
          draft: {
            ...rec.draft,
            sobreEmpresa: {
              ...rec.draft.sobreEmpresa,
              cnpj: client.cnpj,
              razaoSocial: client.razaoSocial,
            },
          },
        });

        if (!cancelled)
          router.replace(`/clients/${params.cnpj}/scopes/edit/${id}`);
      } catch {
        if (!cancelled) router.replace(`/clients/${params.cnpj}/scopes`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.cnpj, router]);

  return (
    <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
      <RotateCw className="h-4 w-4 animate-spin" /> Criando escopo...
    </div>
  );
}
