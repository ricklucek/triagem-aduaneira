"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Ellipsis, RotateCw } from "lucide-react";
import CompletenessBadge from "@/components/ui/completeness-badge";
import {
  PageHeader,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  Toolbar,
  ToolbarField,
  ToolbarGroup,
  ToolbarSearchField,
} from "@/components/ui/form-layout";
import { Card } from "@/components/ui/card";
import { TextInput, Select } from "@/components/ui/form-fields";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useScopes } from "@/lib/api/hooks/use-scope-api";
import { formatCNPJ } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { scopeApi } from "@/lib/api/services/scopes";
import { toast } from "@/components/ui/toast";

type StatusFilter = "todos" | "draft" | "published" | "archived";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

export default function DashboardPage() {
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [scopeToDelete, setScopeToDelete] = useState<{
    id: string;
    razaoSocial: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const params = useMemo(
    () => ({
      status: status === "todos" ? undefined : status,
      q: q || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [page, q, status],
  );

  const { data, error, isLoading, mutate } = useScopes(params);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function handleDeleteScope() {
    if (!scopeToDelete) return;
    try {
      setDeleting(true);
      await scopeApi.deleteScope(scopeToDelete.id);
      await mutate();
      setScopeToDelete(null);
      toast.success("Escopo excluído com sucesso.");
    } catch {
      toast.error("Falha ao excluir escopo.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        subtitle="Acompanhe seus formulários de escopos."
        right={
          <Link href="/scopes/new">
            <PrimaryButton>Novo Escopo</PrimaryButton>
          </Link>
        }
      />

      <Toolbar
        title="Filtros"
        description="Refine os resultados da tabela por status ou por texto."
        left={
          <ToolbarGroup>
            <ToolbarField className="sm:w-55">
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as StatusFilter);
                  setPage(1);
                }}
              >
                <option value="todos">Todos</option>
                <option value="draft">Draft</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </Select>
            </ToolbarField>

            <ToolbarSearchField>
              <TextInput
                placeholder="Buscar por razão social ou CNPJ"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </ToolbarSearchField>
          </ToolbarGroup>
        }
      />

      <div className="h-4" />

      <Card className="overflow-hidden border-border/80 p-0 shadow-sm">
        {isLoading ? (
          <div className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
            <RotateCw className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : error ? (
          <div className="p-5 text-sm text-destructive">
            Falha ao carregar dados.
          </div>
        ) : items.length === 0 ? (
          <div className="p-5 text-sm">Nenhum escopo encontrado.</div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="px-5 py-4">CNPJ</TableHead>
                    <TableHead className="px-5 py-4">Razão Social</TableHead>
                    <TableHead className="px-5 py-4">Status</TableHead>
                    <TableHead className="px-5 py-4">Completude</TableHead>
                    <TableHead className="px-5 py-4">Atualizado em</TableHead>
                    <TableHead className="px-5 py-4 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell className="px-5 py-4">
                        {x.cnpj ? formatCNPJ(x.cnpj) : "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 font-medium whitespace-normal">
                        {x.razao_social}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <Badge
                          variant={x.status === "draft" ? "secondary" : "default"}
                        >
                          {x.status === "draft"
                            ? "Rascunho"
                            : x.status === "published"
                              ? "Publicado"
                              : "Arquivado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <CompletenessBadge value={x.completeness_score} />
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        {formatDate(x.updated_at)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className="inline-flex size-8 items-center justify-center rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
                              aria-label="Abrir menu de opções"
                            >
                              <Ellipsis className="h-5 w-5 text-white-light" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="popover-menu-container right-0 w-56">
                            <div className="flex w-full flex-col gap-4">
                              <div className="popover-menu-item">
                                <Link className="cursor-pointer" href={`/clients/${x.client_id ?? x.cnpj ?? ""}/scopes/view/${x.id}`}>
                                  <button className="w-full">Visualizar</button>
                                </Link>
                              </div>
                              <Link className="cursor-pointer" href={`/scopes/${x.id}?step=SOBRE_EMPRESA`}>
                                <button className="w-full">Editar</button>
                              </Link>
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  setScopeToDelete({
                                    id: x.id,
                                    razaoSocial: x.razao_social || x.id,
                                  })
                                }
                              >
                                <span>Excluir</span>
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 p-4 md:hidden">
              {items.map((x) => (
                <Card
                  key={x.id}
                  className="gap-4 rounded-2xl border-border/80 p-4 shadow-none"
                >
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{x.cnpj ? formatCNPJ(x.cnpj) : "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Razão Social</p>
                    <p className="font-medium">{x.razao_social}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p>{x.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completude</p>
                      <CompletenessBadge value={x.completeness_score} />
                    </div>
                    <div>
                      <p className="text-muted-foreground">Atualizado</p>
                      <p>{formatDate(x.updated_at)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 bg-red-500">
                    <Link href={`/clients/${x.client_id ?? x.cnpj ?? ""}/scopes/view/${x.id}`}>
                      <SecondaryButton>Visualizar</SecondaryButton>
                    </Link>
                    <Link href={`/clients/${x.client_id ?? x.cnpj ?? ""}/scopes/edit/${x.id}`}>
                      <SecondaryButton>Editar</SecondaryButton>
                    </Link>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        setScopeToDelete({
                          id: x.id,
                          razaoSocial: x.razao_social || x.id,
                        })
                      }
                    >
                      Excluir
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>

      <div className="h-4" />

      <Toolbar
        left={
          <SecondaryButton
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Anterior
          </SecondaryButton>
        }
        right={
          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center">
            <span>
              Página {page} de {totalPages} — Total: {total}
            </span>
            <SecondaryButton
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Próxima
            </SecondaryButton>
          </div>
        }
      />

      <Dialog
        open={Boolean(scopeToDelete)}
        onOpenChange={(open) => {
          if (!open) setScopeToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir escopo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o escopo
              {scopeToDelete ? ` "${scopeToDelete.razaoSocial}"` : ""}? Essa ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScopeToDelete(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteScope}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Confirmar exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
