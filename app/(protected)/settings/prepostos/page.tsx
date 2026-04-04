"use client";

import { PrepostosManager } from "@/components/settings/prepostos-manager";
import { prepostosLookup } from "@/lib/api/hooks/use-dashboards";

export default function SettingsPrepostosPage() {
  const { data, isLoading, error } = prepostosLookup();

  if (isLoading || !data) return <p>Carregando contatos de prepostos...</p>;
  if (error) return <p>Falha ao carregar configurações.</p>;

  return <PrepostosManager settings={data} />;
}
