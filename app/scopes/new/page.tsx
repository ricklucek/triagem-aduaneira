"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getScopeRepo } from "@/data/scope/getScopeRepo";

export default function NewScopePage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const repo = getScopeRepo();
      const { id } = await repo.createScope();
      router.replace(`/scopes/${id}`);
    })();
  }, [router]);

  return <div style={{ padding: 24 }}>Criando escopo...</div>;
}