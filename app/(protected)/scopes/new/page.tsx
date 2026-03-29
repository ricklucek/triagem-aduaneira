"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { scopeApi } from "@/lib/api/services/scopes";

export default function NewScopePage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const metadata = await scopeApi.getMetadata();
      const { id } = await scopeApi.createScope({
        informacoesFixas: metadata.informacoesFixas,
      });
      router.replace(`/scopes/${id}`);
    })();
  }, [router]);

  return <div style={{ padding: 24 }}>Criando escopo...</div>;
}
