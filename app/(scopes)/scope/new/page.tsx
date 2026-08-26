"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  FileText,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/form-layout";
import { toast } from "@/components/ui/toast";
import { useClient } from "@/lib/api/hooks/use-clients-api";
import { useScopeTemplates } from "@/lib/api/hooks/use-scope-api";
import { clientsApi } from "@/lib/api/services/clients";
import { scopeApi } from "@/lib/api/services/scopes";
import { AxiosError } from "@/lib/vendor/axios";
import { formatCNPJ } from "@/utils/format";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
    new Date(value),
  );
}

export default function NewScopePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId")?.trim() || null;
  const { data: templates = [], isLoading, mutate } = useScopeTemplates();
  const {
    data: client,
    error: clientError,
    isLoading: isLoadingClient,
  } = useClient(clientId);
  const [creating, setCreating] = useState<string | null>(null);
  const [conflictScopeId, setConflictScopeId] = useState<string | null>(null);
  const existingScopeId = conflictScopeId ?? client?.scope_id ?? null;
  const canCreate =
    !creating && (!clientId || Boolean(client && !existingScopeId));

  async function createScope(templateId?: string) {
    setCreating(templateId ?? "blank");

    try {
      const { id } = await scopeApi.createScope(
        {},
        {
          clientId: clientId ?? undefined,
          templateId,
        },
      );
      router.push(`/scope/${id}?step=SOBRE_EMPRESA`);
    } catch (error) {
      if (error instanceof AxiosError && error.status === 409 && clientId) {
        try {
          const refreshedClient = await clientsApi.getClient(clientId);
          if (refreshedClient.scope_id) {
            setConflictScopeId(refreshedClient.scope_id);
            return;
          }
        } catch {
          // Mantém a mensagem original do conflito se a atualização falhar.
        }
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o escopo.",
      );
    } finally {
      setCreating(null);
    }
  }

  async function deleteTemplate(templateId: string) {
    await scopeApi.deleteScopeTemplate(templateId);
    toast.success("Template excluído com sucesso.");
    await mutate();
  }

  async function createBlankScopeTemplate() {
    setCreating("blank");
    const { id } = await scopeApi.createScopeTemplate();
    router.push(`/scope/templates/${id}?step=CONFIGURACAO_TEMPLATE`);
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 w-full">
      <PageHeader
        title="Novo escopo"
        subtitle={
          clientId
            ? "Escolha como iniciar o escopo do cliente selecionado."
            : "Crie um escopo em branco ou use um template cadastrado para agilizar o preenchimento."
        }
        right={
          <Button
            type="button"
            variant="outline"
            onClick={createBlankScopeTemplate}
          >
            <Plus className="size-4" />
            Novo template
          </Button>
        }
      />

      {clientId ? (
        <Card className="mb-4 rounded-3xl p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Cliente selecionado
                </p>
                {isLoadingClient ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Carregando cliente...
                  </p>
                ) : clientError || !client ? (
                  <p className="mt-1 text-sm text-destructive">
                    Não foi possível carregar o cliente. Volte à lista e tente
                    novamente.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 truncate font-semibold">
                      {client.razao_social}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCNPJ(client.cnpj)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {existingScopeId ? (
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <p className="text-sm text-muted-foreground">
                  Este cliente já possui um escopo.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/scope/view/${existingScopeId}`)}
                >
                  Abrir escopo existente
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <Card className="rounded-3xl p-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="size-6" />
          </div>
          <h2 className="mt-5 text-lg font-semibold">Escopo em branco</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {clientId
              ? "Inicie com os dados cadastrais do cliente já preenchidos."
              : "Inicie um formulário sem dados pré-preenchidos."}
          </p>
          <Button
            className="mt-6 w-full"
            disabled={!canCreate}
            onClick={() => createScope()}
          >
            {creating === "blank" ? "Criando..." : "Criar escopo em branco"}
          </Button>
        </Card>

        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">Templates de escopo</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Carregando templates...
            </p>
          ) : null}
          {!isLoading && templates.length === 0 ? (
            <Card className="rounded-3xl p-6 text-sm text-muted-foreground">
              Nenhum template cadastrado ainda.
            </Card>
          ) : null}
          {templates.map((template) => (
            <Card key={template.id} className="rounded-3xl p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <h3 className="truncate font-semibold">{template.name}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {template.description ?? "Sem descrição"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Criado em {formatDate(template.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={!canCreate}
                    onClick={() => createScope(template.id)}
                  >
                    {creating === template.id ? "Criando..." : "Usar template"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Ações do template"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(
                            `/scope/templates/${template.id}?step=CONFIGURACAO_TEMPLATE`,
                          )
                        }
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="size-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </section>
      </div>

      <Dialog
        open={Boolean(conflictScopeId)}
        onOpenChange={(open) => {
          if (!open) setConflictScopeId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cliente já possui escopo</DialogTitle>
            <DialogDescription>
              Outro escopo foi associado a este cliente antes da conclusão desta
              criação. Nenhum novo registro foi criado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConflictScopeId(null)}
            >
              Fechar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (conflictScopeId)
                  router.push(`/scope/view/${conflictScopeId}`);
              }}
            >
              Abrir escopo existente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
