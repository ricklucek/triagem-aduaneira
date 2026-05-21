"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { scopeApi } from "@/lib/api/services/scopes";
import { RotateCw } from "lucide-react";

export default function NewScopePage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { id } = await scopeApi.createScope();
      router.replace(`/scope/${id}?step=SOBRE_EMPRESA`);
    })();
  }, [router]);

  return (
    <main className="w-full h-full flex flex-col gap-5 items-center justify-center">
      <RotateCw className="mb-4 h-10 w-10 animate-spin text-muted-foreground" />
      <p>Criando novo escopo...</p>
    </main>
  );
}
