"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useScopeStore } from "@/lib/scope/use-scope-store";
import type { ScopeRecord } from "@/lib/scope/store";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatISO(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function ScopeDetails({ record }: { record: ScopeRecord }) {
  const scope = record.data;

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Resumo</h2>
          <Badge variant={record.status === "published" ? "default" : "secondary"}>
            {record.status === "published" ? `Publicado • v${record.version}` : "Draft"}
          </Badge>
        </div>

        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p><span className="text-muted-foreground">CNPJ:</span> {scope.client.cnpj || "-"}</p>
          <p><span className="text-muted-foreground">Razão social:</span> {scope.client.razaoSocial || "-"}</p>
          <p><span className="text-muted-foreground">Regime tributário:</span> {scope.client.regimeTributario || "-"}</p>
          <p><span className="text-muted-foreground">Atualizado:</span> {formatISO(record.updatedAt)}</p>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-base font-semibold">Operação</h3>
        <div className="grid gap-2 text-sm">
          <p><span className="text-muted-foreground">Tipos:</span> {scope.operation.types.length ? scope.operation.types.join(", ") : "-"}</p>
          <p><span className="text-muted-foreground">Importação • Modal:</span> {scope.importSection.modal || "-"}</p>
          <p><span className="text-muted-foreground">Exportação • Modal:</span> {scope.exportSection.modal || "-"}</p>
          <p><span className="text-muted-foreground">Locais de entrada:</span> {scope.importSection.entryLocations.join(", ") || "-"}</p>
          <p><span className="text-muted-foreground">Portos/fronteiras:</span> {scope.exportSection.departureLocations.join(", ") || "-"}</p>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-base font-semibold">Serviços</h3>
        {scope.services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum serviço configurado.</p>
        ) : (
          <div className="grid gap-3">
            {scope.services.map((service, idx) => (
              <div key={`${service.code}-${idx}`} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{service.code}</p>
                  <Badge variant="outline">{service.operationScope}</Badge>
                </div>
                <div className="mt-2 grid gap-1 text-sm md:grid-cols-2">
                  <p><span className="text-muted-foreground">Ativo:</span> {service.enabled ? "Sim" : "Não"}</p>
                  <p><span className="text-muted-foreground">Precificação:</span> {service.pricingModel}</p>
                  <p><span className="text-muted-foreground">Moeda:</span> {service.currency}</p>
                  <p><span className="text-muted-foreground">Valor:</span> {service.amount ?? "-"}</p>
                  <p><span className="text-muted-foreground">Percentual:</span> {service.percent ?? "-"}</p>
                  <p><span className="text-muted-foreground">Regra textual:</span> {service.textRule || "-"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-base font-semibold">Contatos</h3>
        {scope.contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum contato informado.</p>
        ) : (
          <div className="grid gap-2 text-sm">
            {scope.contacts.map((c, i) => (
              <div key={i} className="rounded-lg border p-3">
                <p><span className="text-muted-foreground">Nome:</span> {c.nome || "-"}</p>
                <p><span className="text-muted-foreground">E-mail:</span> {c.email || "-"}</p>
                <p><span className="text-muted-foreground">Cargo/Departamento:</span> {c.cargoDepartamento || "-"}</p>
                <p><span className="text-muted-foreground">Telefone:</span> {c.telefone || "-"}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ScopeViewPage() {
  const { cnpj, id } = useParams<{ cnpj: string; id: string }>();
  const { records } = useScopeStore(cnpj);

  const publishedRecords = useMemo(
    () => records.filter((r) => r.status === "published").sort((a, b) => b.version - a.version),
    [records]
  );

  const [selectedId, setSelectedId] = useState(id);

  const selected = useMemo(
    () => records.find((r) => r.id === selectedId) ?? records.find((r) => r.id === id) ?? null,
    [id, records, selectedId]
  );

  if (!selected) {
    return (
      <Card className="p-4">
        <p className="font-medium">Escopo não encontrado.</p>
        <Button asChild className="mt-3">
          <Link href={`/clients/${cnpj}/scopes`}>Voltar para escopos</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-4" id="scope-view-layout">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Visualização do Escopo</h1>
            <p className="text-sm text-muted-foreground">
              Documento em modo leitura para acompanhamento operacional.
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button asChild variant="outline">
              <Link href={`/clients/${cnpj}/scopes`}>Voltar</Link>
            </Button>
            <Button onClick={() => window.print()}>Baixar em PDF</Button>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
          <p className="text-sm text-muted-foreground">Versões publicadas:</p>
          <Select value={selected.id} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full md:w-[360px]">
              <SelectValue placeholder="Selecione uma versão" />
            </SelectTrigger>
            <SelectContent>
              {publishedRecords.length === 0 ? (
                <SelectItem value={selected.id}>
                  Sem versões publicadas (visualizando item atual)
                </SelectItem>
              ) : (
                publishedRecords.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    v{r.version} • {formatISO(r.updatedAt)} • {r.title || r.id}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <ScopeDetails record={selected} />

      <style jsx global>{`
        @media print {
          header, nav, .print\\:hidden {
            display: none !important;
          }
          #scope-view-layout {
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}
