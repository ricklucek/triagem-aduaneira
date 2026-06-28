"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, MoreHorizontal, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/ui/form-layout";
import { toast } from "@/components/ui/toast";
import { useScopeTemplates } from "@/lib/api/hooks/use-scope-api";
import { scopeApi } from "@/lib/api/services/scopes";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

export default function NewScopePage() {
  const router = useRouter();
  const { data: templates = [], isLoading, mutate } = useScopeTemplates();
  const [creating, setCreating] = useState<string | null>(null);

  async function createBlankScope() {
    setCreating("blank");
    const { id } = await scopeApi.createScope();
    router.push(`/scope/${id}?step=SOBRE_EMPRESA`);
  }

  async function createFromTemplate(templateId: string) {
    setCreating(templateId);
    const { id } = await scopeApi.createScope({}, templateId);
    router.push(`/scope/${id}?step=SOBRE_EMPRESA`);
  }

  async function deleteTemplate(templateId: string) {
    await scopeApi.deleteScopeTemplate(templateId);
    toast.success("Template excluído com sucesso.");
    await mutate();
  }

  async function createBlankScopeTemplate() {
    setCreating("blank");
    const {id} = await scopeApi.createScopeTemplate();
    router.push(`/scope/templates/${id}?step=CONFIGURACAO_TEMPLATE`)
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 w-full">
      <PageHeader
        title="Novo escopo"
        subtitle="Crie um escopo em branco ou use um template cadastrado para agilizar o preenchimento."
        right={
          <Button type="button" variant="outline" onClick={createBlankScopeTemplate}>
            <Plus className="size-4" />
            Novo template
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <Card className="rounded-3xl p-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="size-6" />
          </div>
          <h2 className="mt-5 text-lg font-semibold">Escopo em branco</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicie um formulário sem dados pré-preenchidos.
          </p>
          <Button className="mt-6 w-full" disabled={Boolean(creating)} onClick={createBlankScope}>
            Criar escopo em branco
          </Button>
        </Card>

        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">Templates de escopo</h2>
          {isLoading ? <p className="text-sm text-muted-foreground">Carregando templates...</p> : null}
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
                  <Button disabled={Boolean(creating)} onClick={() => createFromTemplate(template.id)}>
                    Usar template
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" aria-label="Ações do template">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/scope/templates/${template.id}?step=CONFIGURACAO_TEMPLATE`)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => deleteTemplate(template.id)}>
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
    </main>
  );
}
