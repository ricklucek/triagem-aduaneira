"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClientApi } from "@/lib/api/types/client-api";
import { formatCNPJ } from "@/utils/format";

type Props = {
  client: ClientApi | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenScope: (scopeId: string) => void;
};

export default function ExistingClientScopeDialog({
  client,
  open,
  onOpenChange,
  onOpenScope,
}: Props) {
  const scopeId = client?.scope_id ?? null;

  return (
    <Dialog open={open && Boolean(scopeId)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle>Cliente já possui escopo</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              O CNPJ {client?.cnpj ? formatCNPJ(client.cnpj) : "informado"} já
              está vinculado ao escopo de{" "}
              {client?.razao_social || "outro cliente"}.
            </span>
            <span className="block">
              Corrija o CNPJ neste formulário ou abra o escopo existente. Os
              dados preenchidos aqui não serão sobrescritos.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Permanecer neste formulário
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (scopeId) onOpenScope(scopeId);
            }}
          >
            Abrir escopo existente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
