"use client";

import { useState } from "react";
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

export type ScopeActivityTarget = {
  id: string;
  label: string;
  status: "draft" | "published" | "archived";
};

export default function ScopeActivityDialog({
  target,
  onClose,
  onSuccess,
}: {
  target: ScopeActivityTarget | null;
  onClose: () => void;
  onSuccess: () => Promise<unknown>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reactivating = target?.status === "archived";
  const action = reactivating ? "Reativar" : "Inativar";

  async function confirm() {
    if (!target || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (reactivating) await scopeApi.reactivateScope(target.id);
      else await scopeApi.deactivateScope(target.id);
      await onSuccess();
      toast.success(
        reactivating
          ? "Escopo reativado com sucesso."
          : "Escopo inativado com sucesso.",
      );
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível alterar a situação do escopo.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open && !saving) {
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>{action} escopo</DialogTitle>
          <DialogDescription>
            {reactivating
              ? `Reativar o escopo de "${target?.label}"? Ele voltará ao estado anterior à inativação.`
              : `Inativar o escopo de "${target?.label}"? Ele sairá das listas operacionais e ficará disponível no filtro Inativos. Os dados, versões e histórico serão preservados.`}
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant={reactivating ? "default" : "destructive"}
            disabled={saving}
            onClick={() => void confirm()}
          >
            {saving ? "Salvando..." : `Confirmar ${action.toLowerCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
