"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useClients } from "@/lib/api/hooks/use-clients-api";
import { formatCNPJ } from "@/utils/format";

export default function ClientsPage() {
  const { data, isLoading, error } = useClients({ limit: 100, offset: 0 });
  const items = data?.items ?? [];

  return (
    <Card className="rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Clientes</div>
          <div className="text-sm text-muted-foreground">
            Lista de clientes da organização atual
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RotateCw className="h-4 w-4 animate-spin" /> Carregando clientes...
        </div>
      ) : error ? (
        <div className="text-sm text-destructive">
          Falha ao carregar clientes.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razão Social</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              items.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.razao_social}</TableCell>
                  <TableCell>{formatCNPJ(client.cnpj)}</TableCell>
                  <TableCell>
                    <Badge variant={client.ativo ? "default" : "secondary"}>
                      {client.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href={`/clients/${client.id}/scopes`}>Ver escopos</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
