"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { RotateCw } from "lucide-react";
import type { EscopoForm } from "@/domain/scope/types";
import { useScope, useScopeVersions } from "@/lib/api/hooks/use-scope-api";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function formatISO(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function ScopeDetails({ scope, versionLabel }: { scope: EscopoForm; versionLabel: string }) {
  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Resumo</h2>
          <Badge>{versionLabel}</Badge>
        </div>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p><span className="text-muted-foreground">CNPJ:</span> {scope.sobreEmpresa.cnpj || "-"}</p>
          <p><span className="text-muted-foreground">Razão social:</span> {scope.sobreEmpresa.razaoSocial || "-"}</p>
          <p><span className="text-muted-foreground">Regime tributário:</span> {scope.sobreEmpresa.regimeTributacao || "-"}</p>
          <p><span className="text-muted-foreground">Responsável comercial:</span> {scope.sobreEmpresa.responsavelComercial || "-"}</p>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-base font-semibold">Operação</h3>
        <div className="grid gap-2 text-sm">
          <p><span className="text-muted-foreground">Tipos:</span> {scope.operacao.tipos.length ? scope.operacao.tipos.join(", ") : "-"}</p>
          <p><span className="text-muted-foreground">Importação:</span> {scope.operacao.importacao ? "Configurada" : "-"}</p>
          <p><span className="text-muted-foreground">Exportação:</span> {scope.operacao.exportacao ? "Configurada" : "-"}</p>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-base font-semibold">Serviços</h3>
        <div className="grid gap-2 text-sm">
          <p><span className="text-muted-foreground">Importação:</span> {scope.servicos.importacao ? "Configurada" : "-"}</p>
          <p><span className="text-muted-foreground">Exportação:</span> {scope.servicos.exportacao ? "Configurada" : "-"}</p>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-base font-semibold">Contatos</h3>
        {scope.contatos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum contato informado.</p>
        ) : (
          <div className="grid gap-2 text-sm">
            {scope.contatos.map((c, i) => (
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
  const { data: scopeResponse, isLoading: loadingScope, error: scopeError } = useScope(id);
  const { data: versionsResponse, isLoading: loadingVersions } = useScopeVersions(id);

  const [selectedVersion, setSelectedVersion] = useState<string>("draft");

  const versions = useMemo(
    () => [...(versionsResponse ?? [])].sort((a, b) => b.version_number - a.version_number),
    [versionsResponse]
  );

  const selectedScope = useMemo(() => {
    const draft = scopeResponse?.draft;
    if (!draft) return null;
    if (selectedVersion === "draft") return draft;
    const version = versions.find((v) => String(v.version_number) === selectedVersion);
    return version?.data ?? draft;
  }, [scopeResponse?.draft, selectedVersion, versions]);

  if (loadingScope || loadingVersions) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <RotateCw className="h-4 w-4 animate-spin" /> Carregando visualização...
        </div>
      </Card>
    );
  }

  if (scopeError || !selectedScope) {
    return (
      <Card className="p-4">
        <p className="font-medium">Escopo não encontrado.</p>
        <Button asChild className="mt-3">
          <Link href={`/clients/${cnpj}/scopes`}>Voltar para escopos</Link>
        </Button>
      </Card>
    );
  }

  const label = selectedVersion === "draft" ? "Draft atual" : `Versão v${selectedVersion}`;

  return (
    <div className="grid gap-4" id="scope-view-layout">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Visualização do Escopo</h1>
            <p className="text-sm text-muted-foreground">Documento em modo leitura para acompanhamento operacional.</p>
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
          <p className="text-sm text-muted-foreground">Versões disponíveis:</p>
          <Select value={selectedVersion} onValueChange={setSelectedVersion}>
            <SelectTrigger className="w-full md:w-[360px]">
              <SelectValue placeholder="Selecione uma versão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft atual</SelectItem>
              {versions.map((v) => (
                <SelectItem key={v.version_number} value={String(v.version_number)}>
                  v{v.version_number} • {formatISO(v.published_at)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <ScopeDetails scope={selectedScope} versionLabel={label} />

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
