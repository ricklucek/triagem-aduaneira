"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Ellipsis, RotateCw, Search } from "lucide-react";
import {
  SecondaryButton,
  Toolbar,
} from "@/components/ui/form-layout";
import { TextInput } from "@/components/ui/form-fields";

import { useCountUserAssignments, useScopes } from "@/lib/api/hooks/use-scope-api";
import { formatCNPJ, isCNPJ } from "@/utils/format";
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
import { hasRole } from "@/lib/auth/guard";
import { format } from 'date-fns';
import { ptBR } from "date-fns/locale";
import { useCurrentUser } from "@/lib/api/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyScopesPage() {
  const { data: userData } = useCurrentUser();

  const { data: userAssignments, isLoading: isCountingUserAssignments } = useCountUserAssignments();

  const countCreatedByMe = userAssignments?.find(x => x.type === "created_by_id")?.count ?? 0;
  const countMeAsAnalist = userAssignments?.find(x => x.type === "assigned_user_id")?.count ?? 0;
  const countMeAsComercialResponsible = userAssignments?.find(x => x.type === "responsible_user_id")?.count ?? 0;

  const [createdByMe, setCreatedByMe] = useState(false);
  const [meAsAnalist, setMeAsAnalist] = useState(false);
  const [meAsComercialResponsible, setMeAsComercialResponsible] = useState(false);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [scopeToDelete, setScopeToDelete] = useState<{
    id: string;
    razaoSocial: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const hasAnyFilter = createdByMe || meAsAnalist || meAsComercialResponsible;

  const params = useMemo(
    () => ({
      q: (isCNPJ(q) ? q.replace(/\D/g, '') : q || ''),
      created_by_id: createdByMe ? userData?.id : undefined,
      assigned_user_id: meAsAnalist ? userData?.id : undefined,
      responsible_user_id: meAsComercialResponsible ? userData?.id : undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [page, q, createdByMe, meAsAnalist, meAsComercialResponsible, userData],
  );

  const { data, error, isLoading, mutate } = useScopes(params);
  const items = hasAnyFilter ? (data?.items ?? []) : [];
  const total = hasAnyFilter ? (data?.total ?? 0) : 0;
  const totalPages = hasAnyFilter ? Math.max(1, Math.ceil(total / pageSize)) : 0;

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
    <main className="w-full min-h-screen">
      <div className="flex flex-col bg-background/80 p-2 md:p-4 gap-4 border-b">
        <div className="flex flex-row items-center gap-2">
          <Search size={20} />
          <h2 className="text-sm font-semibold tracking-tight">Filtros</h2>
        </div>

        <TextInput
          placeholder="Buscar por razão social ou CNPJ"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="pl-10 bg-zinc-800 rounded-md"
        />

        <div className="flex gap-3 flex-row items-center flex-wrap">
          {
            isCountingUserAssignments ? (
              <>
              <Skeleton className="w-32 h-6" />
              <Skeleton className="w-32 h-6" />
              <Skeleton className="w-32 h-6" />
              </>
            ) : (
              <>
                <Button size="sm" variant={createdByMe ? "default" : "outline"} onClick={() => setCreatedByMe(v => !v)}>
                  <span>Criados por mim ({countCreatedByMe})</span>
                </Button>

                <Button size="sm" variant={meAsAnalist ? "default" : "outline"} onClick={() => setMeAsAnalist(v => !v)}>
                  <span>Meus como analista ({countMeAsAnalist})</span>
                </Button>

                <Button size="sm" variant={meAsComercialResponsible ? "default" : "outline"} onClick={() => setMeAsComercialResponsible(v => !v)}>
                  <span>Meus como comercial ({countMeAsComercialResponsible})</span>
                </Button>
              </>
            )
          }
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 p-5 justify-center">
          <RotateCw className="size-5 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-5 text-sm text-destructive">
          Falha ao carregar dados.
        </div>
      ) : items.length === 0 ? (
        hasAnyFilter ? (
          <div className="p-5 text-sm text-muted-foreground">
            Nenhum resultado encontrado.
          </div>
        ) : (
          <div className="p-5 text-sm text-muted-foreground">
            Escolha um filtro para apresentar resultados.
          </div>
        )
      ) :
        items.map((x) => {
          return (
            <div
              key={x.id}
              className="border-b transition-colors"
            >
              <div
                className="w-full p-5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <div className="flex flex-row items-center justify-between">
                  <div>{x.client_cnpj ? formatCNPJ(x.client_cnpj) : "-"}</div>

                  <Badge variant={x.status === "draft" ? "secondary" : "default"}>
                    {x.status === "draft"
                      ? "Rascunho"
                      : x.status === "published"
                        ? "Publicado"
                        : "Arquivado"}
                  </Badge>
                </div>

                <div className="py-4 font-medium whitespace-normal flex items-start">
                  {x.razao_social}
                </div>
              </div>

              <div className="flex flex-row items-center justify-between px-5 pb-5">
                <span className="text-xs">
                  Atualizado em{" "}
                  {format(x.updated_at ?? new Date(), "dd MMM • HH:mm", {
                    locale: ptBR,
                  })}
                </span>

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex size-8 items-center justify-center rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
                      aria-label="Abrir menu de opções"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Ellipsis className="h-5 w-5 text-white-light" />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent className="popover-menu-container right-0 w-56">
                    <div className="flex w-full flex-col gap-4">
                      <Link
                        className="popover-menu-item cursor-pointer items-center justify-center flex"
                        href={`/scope/view/${x.id}`}
                      >
                        Visualizar
                      </Link>

                      {hasRole(["comercial", "admin"]) && (
                        <Link
                          className="popover-menu-item cursor-pointer items-center justify-center flex"
                          href={`/scope/${x.id}?step=SOBRE_EMPRESA`}
                        >
                          Editar
                        </Link>
                      )}

                      {hasRole(["comercial", "admin"]) && (
                        <Button
                          type="button"
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
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          );
        })}

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
    </main>
  );
}