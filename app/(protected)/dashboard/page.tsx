"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import CompletenessBadge from "@/components/ui/completeness-badge";
import { PageHeader, PageShell, PrimaryButton, SecondaryButton, Toolbar } from "@/components/ui/form-layout";
import { Card } from "@/components/ui/card";
import { TextInput, Select } from "@/components/ui/form-fields";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScopes } from "@/lib/api/hooks/use-scope-api";

type StatusFilter = "todos" | "draft" | "published" | "archived";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

export default function DashboardPage() {
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [q, setQ] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(
    () => ({
      status: status === "todos" ? undefined : status,
      q: q || undefined,
      cnpj: cnpj || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [cnpj, page, q, status]
  );

  const { data, error, isLoading } = useScopes(params);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <PageShell>
      <PageHeader
        title="Dashboard de Escopos"
        subtitle="Acompanhe rascunhos, publicações e completude do formulário."
        right={<Link href="/scopes/new"><PrimaryButton>Novo Escopo</PrimaryButton></Link>}
      />

      <Card className="rounded-[1.75rem] border-border/80 p-4 shadow-sm sm:p-5">
        <Toolbar
          left={
            <>
              <div className="w-full sm:w-55">
                <Select value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1); }}>
                  <option value="todos">Todos</option>
                  <option value="draft">Draft</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Arquivado</option>
                </Select>
              </div>
              <div className="w-full sm:min-w-70 sm:flex-1">
                <TextInput placeholder="Buscar por razão social ou CNPJ" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
              </div>
              <div className="w-full sm:w-55">
                <TextInput placeholder="CNPJ exato" value={cnpj} onChange={(e) => { setCnpj(e.target.value); setPage(1); }} />
              </div>
            </>
          }
        />
      </Card>

      <div className="h-4" />

      <Card className="overflow-hidden rounded-[1.75rem] border-border/80 p-0 shadow-sm">
        {isLoading ? (
          <div className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
            <RotateCw className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : error ? (
          <div className="p-5 text-sm text-destructive">Falha ao carregar dados.</div>
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
                    <TableHead className="px-5 py-4">Últ. publicação</TableHead>
                    <TableHead className="px-5 py-4">Versões</TableHead>
                    <TableHead className="px-5 py-4 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell className="px-5 py-4">{x.cnpj}</TableCell>
                      <TableCell className="px-5 py-4 font-medium whitespace-normal">{x.razao_social}</TableCell>
                      <TableCell className="px-5 py-4">{x.status}</TableCell>
                      <TableCell className="px-5 py-4"><CompletenessBadge value={x.completeness_score} /></TableCell>
                      <TableCell className="px-5 py-4">{formatDate(x.updated_at)}</TableCell>
                      <TableCell className="px-5 py-4">{formatDate(x.last_published_at)}</TableCell>
                      <TableCell className="px-5 py-4">{x.version_count}</TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        <Link href={x.status === "published" ? `/clients/${x.cnpj}/scopes/view/${x.id}` : `/scopes/${x.id}`}>
                          <SecondaryButton>{x.status === "published" ? "Visualizar" : "Abrir"}</SecondaryButton>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 p-4 md:hidden">
              {items.map((x) => (
                <Card key={x.id} className="gap-4 rounded-2xl border-border/80 p-4 shadow-none">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{x.cnpj}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Razão Social</p>
                    <p className="font-medium">{x.razao_social}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-muted-foreground">Status</p><p>{x.status}</p></div>
                    <div><p className="text-muted-foreground">Completude</p><CompletenessBadge value={x.completeness_score} /></div>
                    <div><p className="text-muted-foreground">Atualizado</p><p>{formatDate(x.updated_at)}</p></div>
                    <div><p className="text-muted-foreground">Últ. publicação</p><p>{formatDate(x.last_published_at)}</p></div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Versões: {x.version_count}</span>
                    <Link href={x.status === "published" ? `/clients/${x.cnpj}/scopes/view/${x.id}` : `/scopes/${x.id}`}>
                      <SecondaryButton>{x.status === "published" ? "Visualizar" : "Abrir"}</SecondaryButton>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>

      <div className="h-4" />

      <Toolbar
        left={<SecondaryButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</SecondaryButton>}
        right={<div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center"><span>Página {page} de {totalPages} — Total: {total}</span><SecondaryButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Próxima</SecondaryButton></div>}
      />
    </PageShell>
  );
}
