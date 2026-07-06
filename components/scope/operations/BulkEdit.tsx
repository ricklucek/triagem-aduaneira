"use client";

import { useEffect, useState } from "react";
import { Check, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

import { scopeApi } from "@/lib/api/services/scopes";
import { toast } from "@/components/ui/toast";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBulkAssignmentScopes, useBulkAssignmentSummary, useScopeMetadata } from "@/lib/api/hooks/use-scope-api";
import type { BulkAssignmentGroupBy } from "@/lib/api/types/scope-api";
import { hasRole } from "@/lib/auth/guard";

const BulkEdit = () => {

    const [groupBy, setGroupBy] = useState<BulkAssignmentGroupBy | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [checkedScopeIds, setCheckedScopeIds] = useState<string[]>([]);
    const [targetUserId, setTargetUserId] = useState<string>("");
    const [bulkSaving, setBulkSaving] = useState(false);

    const { data: scopeMetadata } = useScopeMetadata();
    const { data: summaryData, isLoading: summaryLoading } = useBulkAssignmentSummary(groupBy);
    const { data: scopesData, isLoading: scopesLoading } = useBulkAssignmentScopes(groupBy, selectedUserId);

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
        } catch {
            toast.error("Falha ao atualizar escopos em massa.");
        } finally {
            setBulkSaving(false);
        }
    }

    useEffect(() => {
        if (selectedUserId && scopesData) {
            setCheckedScopeIds(scopesData.items.map((scope) => scope.id));
        }
    }, [selectedUserId, scopesData]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button type="button" variant="outline" className="rounded-full size-10">
                    <Pencil className="size-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                <SheetHeader className="mb-4 border-b">
                    <SheetTitle>Alteração em massa</SheetTitle>
                </SheetHeader>

                <div className="space-y-4 p-4">
                    <Select value={groupBy ?? ""} onValueChange={(value) => {
                        const next = value as BulkAssignmentGroupBy;
                        setGroupBy(next);
                        setSelectedUserId(null);
                        setCheckedScopeIds([]);
                    }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Escolha o filtro" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
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
    )
}

export default BulkEdit;