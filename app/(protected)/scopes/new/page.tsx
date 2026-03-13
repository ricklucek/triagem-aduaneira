"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { scopeApi } from "@/lib/api/services/scopes";

export default function NewScopePage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { id } = await scopeApi.createScope();
      router.replace(`/scopes/${id}`);
    })();
  }, [router]);

  return <div style={{ padding: 24 }}>Criando escopo...</div>;
}
