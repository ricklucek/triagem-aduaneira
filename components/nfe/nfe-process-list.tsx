"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CircleAlert,
  Clock3,
  FileCode2,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import {
  useNfeClientGroups,
  useNfeProcesses,
} from "@/lib/api/hooks/use-nfe-api";
import type {
  ImportProcessClientGroup,
  ImportProcessSummary,
} from "@/lib/api/types/nfe-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const statusLabels: Record<string, string> = {
  created: "Criado",
  duimp_fetching: "Capturando DUIMP",
  duimp_fetched: "DUIMP capturada",
  duimp_fetch_failed: "Falha na DUIMP",
  duimp_normalized: "DUIMP normalizada",
  fiscal_draft_created: "Rascunho criado",
  draft_ready: "Rascunho pronto",
  draft_validation_failed: "Requer correção",
  xml_generated: "XML gerado",
  xml_validation_failed: "XSD inválido",
  xml_validated: "XML validado",
  xml_signed: "XML assinado",
  transmission_pending: "Aguardando transmissão",
  transmitted: "Transmitido",
  authorized: "Autorizado",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
  failed: "Falha",
};

const actionLabels: Record<string, string> = {
  fetch_duimp: "Capturar DUIMP",
  configure_fiscal_profile: "Configurar perfil fiscal",
  select_import_purpose: "Definir finalidade",
  configure_tax_rule: "Configurar regra tributária",
  resolve_context: "Completar dados da DUIMP",
  create_draft: "Gerar rascunho",
  configure_number_sequence: "Configurar sequência",
  correct_draft: "Corrigir divergências",
  generate_access_key: "Gerar chave de acesso",
  generate_xml: "Gerar XML",
  validate_xml: "Validar XML no XSD",
  completed: "Checkpoint concluído",
};

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return value;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Sem atualização";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem atualização";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function ProcessStatus({ process }: { process: ImportProcessSummary }) {
  const failed =
    process.status.includes("failed") ||
    process.status === "rejected";

  return (
    <Badge variant={failed ? "destructive" : "secondary"}>
      {statusLabels[process.status] || process.status}
    </Badge>
  );
}

function ClientButton({
  group,
  selected,
  onSelect,
}: {
  group: ImportProcessClientGroup;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition",
        "hover:border-primary/40 hover:bg-muted/40",
        selected && "border-primary bg-primary/5 shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{group.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCnpj(group.cnpj)}
          </p>
        </div>
        <Building2 className="size-5 shrink-0 text-primary" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="block text-muted-foreground">Processos</span>
          <strong className="text-sm">{group.process_count}</strong>
        </div>
        <div>
          <span className="block text-muted-foreground">Pendências</span>
          <strong
            className={cn(
              "text-sm",
              group.pending_count > 0 && "text-destructive",
            )}
          >
            {group.pending_count}
          </strong>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock3 className="size-3.5" />
        Atualizado em {formatDate(group.last_updated_at)}
      </p>
    </button>
  );
}

function ProcessCard({ process }: { process: ImportProcessSummary }) {
  const planned = process.planned_documents_count || 0;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base">
              {process.duimp_number || process.reference_code}
            </CardTitle>
            <CardDescription className="mt-1 break-all">
              {process.reference_code}
            </CardDescription>
          </div>
          <ProcessStatus process={process} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm xl:grid-cols-4">
          <div>
            <span className="block text-muted-foreground">DUIMP</span>
            <strong>{process.duimp_number || "Não capturada"}</strong>
          </div>
          <div>
            <span className="block text-muted-foreground">Itens</span>
            <strong>{process.items_count}</strong>
          </div>
          <div>
            <span className="block text-muted-foreground">
              Notas planejadas
            </span>
            <strong>{planned > 0 ? planned : "A planejar"}</strong>
          </div>
          <div>
            <span className="block text-muted-foreground">
              Último responsável
            </span>
            <strong>
              {process.last_responsible?.is_current_user
                ? "Você"
                : process.last_responsible?.name || "Não informado"}
            </strong>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Próxima ação
            </p>
            <p className="mt-1 font-medium">
              {actionLabels[process.next_action || ""] ||
                "Revisar processo"}
            </p>
          </div>
          <Button asChild>
            <Link href={`/nfe/processes/${process.id}`}>
              Continuar processo
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function NfeProcessList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const selectedClientId = searchParams.get("client");
  const mine = searchParams.get("mine") === "1";
  const [query, setQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery.trim());

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [query]);

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      const suffix = params.toString();
      router.replace(
        suffix ? `/nfe/processes?${suffix}` : "/nfe/processes",
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (debouncedQuery === urlQuery) return;
    updateUrl({ q: debouncedQuery || null });
  }, [debouncedQuery, updateUrl, urlQuery]);

  const {
    data: groups,
    error: groupsError,
    isLoading: groupsLoading,
  } = useNfeClientGroups({
    q: debouncedQuery || undefined,
    created_by_me: mine || undefined,
    limit: 100,
  });

  const selectedGroup = groups?.items.find(
    (group) => group.client_id === selectedClientId,
  );

  const {
    data: processes,
    error: processesError,
    isLoading: processesLoading,
  } = useNfeProcesses(
    selectedClientId
      ? {
          importer_id: selectedClientId,
          q: debouncedQuery || undefined,
          created_by_me: mine || undefined,
          limit: 100,
        }
      : null,
  );

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Operação fiscal</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Processos de NF-e
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulte os processos agrupados pelo cliente importador.
          </p>
        </div>
        <Button asChild>
          <Link href="/nfe/new">
            <Plus /> Nova emissão
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cliente, CNPJ, DUIMP ou referência"
              className="pl-9"
            />
          </div>
          <Button
            variant={mine ? "default" : "outline"}
            aria-pressed={mine}
            onClick={() =>
              updateUrl({ mine: mine ? null : "1" })
            }
          >
            <UserRound />
            {mine ? "Exibindo os meus" : "Criados por mim"}
          </Button>
        </CardContent>
      </Card>

      {(groupsError || processesError) && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Não foi possível carregar o painel de processos.
        </p>
      )}

      <div className="grid min-h-[560px] gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside
          className={cn(
            "min-w-0 flex-col rounded-xl border bg-card",
            selectedClientId ? "hidden lg:flex" : "flex",
          )}
        >
          <div className="border-b p-4">
            <p className="font-medium">Clientes com processos</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {groups?.total || 0} cliente(s) encontrado(s)
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3 lg:max-h-[680px]">
            {groupsLoading && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Carregando clientes…
              </p>
            )}
            {!groupsLoading && groups?.items.length === 0 && (
              <div className="p-8 text-center">
                <Building2 className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="font-medium">Nenhum cliente encontrado</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ajuste a busca ou inicie uma nova emissão.
                </p>
              </div>
            )}
            {groups?.items.map((group) => (
              <ClientButton
                key={group.client_id}
                group={group}
                selected={group.client_id === selectedClientId}
                onSelect={() => updateUrl({ client: group.client_id })}
              />
            ))}
          </div>
        </aside>

        <section
          className={cn(
            "min-w-0 flex-col rounded-xl border bg-card",
            selectedClientId ? "flex" : "hidden lg:flex",
          )}
        >
          {!selectedClientId && (
            <div className="m-auto max-w-md p-8 text-center">
              <Building2 className="mx-auto mb-4 size-10 text-primary" />
              <h2 className="text-lg font-semibold">Selecione um cliente</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Os processos, pendências e próximas ações serão exibidos
                nesta área.
              </p>
            </div>
          )}

          {selectedClientId && (
            <>
              <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 mb-2 lg:hidden"
                    onClick={() => updateUrl({ client: null })}
                  >
                    <ArrowLeft /> Voltar aos clientes
                  </Button>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    Cliente selecionado
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {selectedGroup?.name || "Cliente"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedGroup
                      ? formatCnpj(selectedGroup.cnpj)
                      : selectedClientId}
                  </p>
                </div>
                {selectedGroup && (
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {selectedGroup.process_count} processo(s)
                    </Badge>
                    {selectedGroup.pending_count > 0 && (
                      <Badge variant="destructive">
                        <CircleAlert />
                        {selectedGroup.pending_count} pendência(s)
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4 p-4 sm:p-6">
                {processesLoading && (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    Carregando processos…
                  </p>
                )}
                {!processesLoading && processes?.items.length === 0 && (
                  <div className="rounded-xl border border-dashed p-10 text-center">
                    <FileCode2 className="mx-auto mb-3 size-8 text-muted-foreground" />
                    <p className="font-medium">
                      Nenhum processo encontrado para este filtro
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Limpe a busca ou altere o filtro “Criados por mim”.
                    </p>
                  </div>
                )}
                {processes?.items.map((process) => (
                  <ProcessCard key={process.id} process={process} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
