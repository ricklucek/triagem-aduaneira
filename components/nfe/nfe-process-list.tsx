"use client";

import Link from "next/link";
import { useState } from "react";
import { FileCode2, Plus, Search } from "lucide-react";
import { useNfeProcesses } from "@/lib/api/hooks/use-nfe-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const statusLabels: Record<string, string> = {
  created: "Criado",
  duimp_fetched: "DUIMP capturada",
  draft_ready: "Rascunho pronto",
  draft_validation_failed: "Requer correção",
  xml_generated: "XML gerado",
  xml_validated: "XML validado",
};

export function NfeProcessList() {
  const [query, setQuery] = useState("");
  const [mine, setMine] = useState(false);
  const { data, error, isLoading } = useNfeProcesses({
    q: query || undefined,
    created_by_me: mine || undefined,
    limit: 50,
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Operação fiscal</p>
          <h1 className="text-2xl font-semibold tracking-tight">Processos de NF-e</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Todos os operadores visualizam os processos da organização.
          </p>
        </div>
        <Button asChild>
          <Link href="/nfe/new"><Plus /> Nova emissão</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Localizar processo</CardTitle>
          <CardDescription>Pesquise por DUIMP ou referência e filtre os seus registros.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="DUIMP ou referência"
              className="pl-9"
            />
          </div>
          <Button variant={mine ? "default" : "outline"} onClick={() => setMine((value) => !value)}>
            {mine ? "Exibindo os meus" : "Criados por mim"}
          </Button>
        </CardContent>
      </Card>

      {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar os processos.</p>}
      {isLoading && <p className="p-8 text-center text-sm text-muted-foreground">Carregando processos…</p>}
      {!isLoading && data?.items.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <FileCode2 className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="font-medium">Nenhum processo encontrado</p>
          <p className="text-sm text-muted-foreground">Inicie uma emissão a partir do número da DUIMP.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {data?.items.map((process) => (
          <Link key={process.id} href={`/nfe/processes/${process.id}`} className="group">
            <Card className="h-full transition hover:border-primary/40 hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base group-hover:text-primary">{process.duimp_number || process.reference_code}</CardTitle>
                    <CardDescription className="mt-1">{process.reference_code}</CardDescription>
                  </div>
                  <Badge variant={process.status.includes("failed") ? "destructive" : "secondary"}>
                    {statusLabels[process.status] || process.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="block text-muted-foreground">Snapshots</span><strong>{process.snapshots_count}</strong></div>
                <div><span className="block text-muted-foreground">Itens</span><strong>{process.items_count}</strong></div>
                <div><span className="block text-muted-foreground">Origem</span><strong>{process.created_by_me ? "Você" : "Organização"}</strong></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
