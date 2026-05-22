"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Ellipsis, Pencil, RotateCw, Search } from "lucide-react";
import {
    SecondaryButton,
    Toolbar,
} from "@/components/ui/form-layout";
import { TextInput } from "@/components/ui/form-fields";

import { useScopes } from "@/lib/api/hooks/use-scope-api";
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
import { ScopeSummary } from "@/data/scope/ScopeRepo";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBulkAssignmentScopes, useBulkAssignmentSummary, useScopeMetadata } from "@/lib/api/hooks/use-scope-api";
import type { BulkAssignmentGroupBy } from "@/lib/api/types/scope-api";

type StatusFilter = "todos" | "draft" | "published" | "archived";

type ListTableProps = {
    onSelectScope: (scope: ScopeSummary) => void;
    selectedScopeId?: string;
};

const ListTable = ({ onSelectScope, selectedScopeId }: ListTableProps) => {
    const [status, setStatus] = useState<StatusFilter>("published");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [scopeToDelete, setScopeToDelete] = useState<{
        id: string;
        razaoSocial: string;
    } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const pageSize = 10;
    const [bulkOpen, setBulkOpen] = useState(false);
    const [groupBy, setGroupBy] = useState<BulkAssignmentGroupBy | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [checkedScopeIds, setCheckedScopeIds] = useState<string[]>([]);
    const [targetUserId, setTargetUserId] = useState<string>("");
    const [bulkSaving, setBulkSaving] = useState(false);

    const params = useMemo(
        () => ({
            status: status === "todos" ? undefined : status,
            q: isCNPJ(q) ? q.replace(/\D/g, '') : q || undefined,
            limit: pageSize,
            offset: (page - 1) * pageSize,
        }),
        [page, q, status],
    );

    const { data, error, isLoading, mutate } = useScopes(params);
    const { data: scopeMetadata } = useScopeMetadata();
    const { data: summaryData, isLoading: summaryLoading } = useBulkAssignmentSummary(groupBy);
    const { data: scopesData, isLoading: scopesLoading } = useBulkAssignmentScopes(groupBy, selectedUserId);

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

    async function handleConfirmBulkUpdate() {
        if (!groupBy || !selectedUserId || !targetUserId || checkedScopeIds.length === 0) return;
        try {
            setBulkSaving(true);
            const result = await scopeApi.updateBulkAssignment({
                groupBy,
                fromUserId: selectedUserId,
                toUserId: targetUserId,
                scopeIds: checkedScopeIds,
            });
            toast.success(`OK! ${result.impactedScopes} escopo(s) atualizado(s).`);
            setBulkOpen(false);
        } catch {
            toast.error("Falha ao atualizar escopos em massa.");
        } finally {
            setBulkSaving(false);
        }
    }

    return (
        <div>
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
                {hasRole("admin") && (
                    <Button type="button" variant="outline" onClick={() => setBulkOpen(true)}>
                        <Pencil className="size-4 mr-2" />
                        Edição em massa
                    </Button>
                )}
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
                <div className="p-5 text-sm">Nenhum escopo encontrado.</div>
            ) :
                items.map((x) => {
                    const selected = selectedScopeId === x.id;

                    return (
                        <div
                            key={x.id}
                            className={[
                                "border-b transition-colors",
                                selected ? "bg-white/10" : "hover:bg-white/5",
                            ].join(" ")}
                        >
                            <button
                                type="button"
                                className="w-full p-5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                onClick={() => onSelectScope(x)}
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
                            </button>

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
            <Sheet open={bulkOpen} onOpenChange={setBulkOpen}>
                <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Edição em massa de escopos</SheetTitle>
                        <SheetDescription>Apenas administradores podem executar esta operação.</SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                        <Select value={groupBy ?? ""} onValueChange={(value) => {
                            const next = value as BulkAssignmentGroupBy;
                            setGroupBy(next);
                            setSelectedUserId(null);
                            setCheckedScopeIds([]);
                        }}>
                            <SelectTrigger><SelectValue placeholder="Escolha o filtro" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="responsavel_comercial">Responsável Comercial</SelectItem>
                                <SelectItem value="analista_da">Analista DA</SelectItem>
                                <SelectItem value="analista_ae">Analista AE</SelectItem>
                            </SelectContent>
                        </Select>
                        {summaryLoading ? <div>Carregando resumo...</div> : summaryData?.items?.map((item) => (
                            <button key={item.userId} className="w-full border rounded-md p-2 text-left" onClick={() => setSelectedUserId(item.userId)}>
                                <div className="font-medium">{item.userName}</div>
                                <div className="text-xs text-muted-foreground">{item.totalScopes} escopo(s)</div>
                            </button>
                        ))}
                        {scopesLoading ? <div>Carregando escopos...</div> : scopesData && (
                            <div className="space-y-3">
                                <div className="text-sm font-semibold">Escopos selecionados</div>
                                {scopesData.items.map((scope) => {
                                    const checked = checkedScopeIds.includes(scope.id);
                                    return (
                                        <button key={scope.id} className="w-full border rounded-md p-2 flex items-center justify-between" onClick={() => {
                                            setCheckedScopeIds((prev) => checked ? prev.filter((id) => id !== scope.id) : [...prev, scope.id]);
                                        }}>
                                            <span>{scope.clientName}</span>
                                            {checked && <Check className="size-4" />}
                                        </button>
                                    );
                                })}
                                <Select value={targetUserId} onValueChange={setTargetUserId}>
                                    <SelectTrigger><SelectValue placeholder="Novo responsável" /></SelectTrigger>
                                    <SelectContent>
                                        {(scopeMetadata?.responsaveis ?? []).map((user) => (
                                            <SelectItem key={user.id} value={user.id}>{user.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="text-sm">
                                    Impactados: <strong>{checkedScopeIds.length}</strong>
                                </div>
                                <Button onClick={handleConfirmBulkUpdate} disabled={bulkSaving || checkedScopeIds.length === 0 || !targetUserId}>
                                    {bulkSaving ? "Confirmando..." : "Confirmar operação"}
                                </Button>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default ListTable
