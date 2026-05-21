"use client";

import { useState } from "react";
import { PrepostosManager } from "@/components/settings/prepostos-manager";
import { usePrepostosLookup } from "@/lib/api/hooks/use-dashboards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Operacao = "IMPORTACAO" | "EXPORTACAO";

export default function SettingsPrepostosPage() {
  const [cidade, setCidade] = useState("Santos");
  const [operacao, setOperacao] = useState<Operacao>("IMPORTACAO");

  const { data, isLoading, error } = usePrepostosLookup({
    cidade,
    operacao,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="grid gap-4 md:grid-cols-[minmax(220px,320px)_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cidade</label>
            <Input
              placeholder="Digite a cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Operação</span>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={operacao === "IMPORTACAO" ? "default" : "outline"}
                onClick={() => setOperacao("IMPORTACAO")}
              >
                IMPORTACAO
              </Button>

              <Button
                type="button"
                variant={operacao === "EXPORTACAO" ? "default" : "outline"}
                onClick={() => setOperacao("EXPORTACAO")}
              >
                EXPORTACAO
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && <p>Carregando contatos de prepostos...</p>}
      {error && <p>Falha ao carregar configurações.</p>}

      {!isLoading && !error && data ? (
        <PrepostosManager
          settings={data}
          filters={{ cidade, operacao }}
        />
      ) : null}
    </div>
  );
}