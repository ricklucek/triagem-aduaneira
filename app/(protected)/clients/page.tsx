"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSearchField,
} from "@/components/ui/form-layout";
import { TextInput } from "@/components/ui/form-fields";
import { Badge } from "@/components/ui/badge";
import { useClients } from "@/lib/api/hooks/use-clients-api";
import { formatCNPJ, isCNPJ } from "@/utils/format";
import { useMemo, useState } from "react";

export default function ClientsPage() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      q: isCNPJ(q) ? undefined : q,
      cnpj: isCNPJ(q) ? q.replace(/\D/g, "") : undefined,
      limit: 100,
      offset: page - 1,
    }),
    [page, q],
  );

  const { data, isLoading, error } = useClients(params);
  const items = data?.items ?? [];

  function handleRowNavigation(href: string) {
    router.push(href);
  }

  function handleRowKeyDown(
    event: React.KeyboardEvent<HTMLTableRowElement>,
    href: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(href);
    }
  }

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

      <Toolbar
        title="Filtros"
        left={
          <ToolbarGroup>
            <ToolbarSearchField>
              <TextInput
                placeholder="Buscar por razão social ou CNPJ"
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </ToolbarSearchField>
          </ToolbarGroup>
        }
      />

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RotateCw className="h-4 w-4 animate-spin" />
          Carregando clientes...
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
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-sm text-muted-foreground"
                >
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              items.map((client) => {
                const href = `/clients/${client.id}/scopes`;

                return (
                  <TableRow
                    key={client.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => handleRowNavigation(href)}
                    onKeyDown={(event) => handleRowKeyDown(event, href)}
                    className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={href}
                        onClick={(event) => event.stopPropagation()}
                        className="hover:underline"
                      >
                        {client.razao_social}
                      </Link>
                    </TableCell>

                    <TableCell>{formatCNPJ(client.cnpj)}</TableCell>

                    <TableCell>
                      <Badge variant={client.ativo ? "default" : "secondary"}>
                        {client.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}