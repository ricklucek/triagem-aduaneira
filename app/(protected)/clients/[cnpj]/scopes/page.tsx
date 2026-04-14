"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { RotateCw } from "lucide-react";
import { scopeApi } from "@/lib/api/services/scopes";
import { useClient, useClientScopes } from "@/lib/api/hooks/use-clients-api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { formatCNPJ } from "@/utils/format";

function formatISO(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export default function ScopesPage() {
  const { cnpj: clientId } = useParams<{ cnpj: string }>();
  const { data, error, isLoading, mutate } = useClientScopes(clientId, {
    limit: 500,
    offset: 0,
  });
  const { data: clientData } = useClient(clientId);
  const [scopeToDelete, setScopeToDelete] = useState<{
    id: string;
    razaoSocial: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const items = useMemo(() => data?.items ?? [], [data]);

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
    <div className="grid gap-4">
      <Card className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-lg font-semibold tracking-tight">
              Escopos • {clientData?.razao_social ?? clientId}
            </div>
            <div className="text-sm text-muted-foreground">
              {clientData?.cnpj ? `CNPJ: ${formatCNPJ(clientData.cnpj)} • ` : ""}
              Gestão e manutenção dos formulários de escopo.
            </div>
          </div>

          <Button asChild className="rounded-xl">
            <Link href={`/clients/${clientId}/scopes/new`}>Novo escopo</Link>
          </Button>
        </div>

        <Separator className="my-4" />

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RotateCw className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">
            Falha ao carregar escopos.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão Social</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground">
                    Nenhum escopo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.razao_social || clientData?.razao_social || "(sem razão social)"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.id}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "draft" ? "secondary" : "default"}>
                        {r.status === "draft"
                          ? "Rascunho"
                          : r.status === "published"
                            ? "Publicado"
                            : "Arquivado"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatISO(r.updated_at)}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button asChild variant="secondary" className="rounded-xl">
                        <Link href={`/clients/${clientId}/scopes/view/${r.id}`}>Visualizar</Link>
                      </Button>
                      <Button asChild variant="outline" className="rounded-xl">
                        <Link href={`/clients/${clientId}/scopes/edit/${r.id}`}>Editar</Link>
                      </Button>
                      <Button
                        variant="destructive"
                        className="rounded-xl"
                        onClick={() =>
                          setScopeToDelete({
                            id: r.id,
                            razaoSocial: r.razao_social || r.id,
                          })
                        }
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

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
    </div>
  );
}
