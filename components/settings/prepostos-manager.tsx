"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeDollarSign,
  ChevronDown,
  ChevronUp,
  MapPin,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import { PrepostoEditor } from "@/components/settings/preposto-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { prepostosApi } from "@/lib/api/services/prepostos";
import type {
  PrepostoAdmin,
  PrepostoCredential,
  PrepostoListResponse,
} from "@/lib/api/types/preposto-api";

const emptySummary: PrepostoListResponse["summary"] = {
  prepostos: 0,
  localidades: 0,
  tarifas: 0,
  credenciados: 0,
};

function apiError(error: unknown) {
  const candidate = error as {
    response?: {
      data?: { message?: string; errors?: Record<string, string[]> };
    };
    message?: string;
  };
  const errors = candidate.response?.data?.errors;
  return (
    (errors && Object.values(errors).flat()[0]) ||
    candidate.response?.data?.message ||
    candidate.message ||
    "Não foi possível concluir a operação."
  );
}

export function PrepostosManager() {
  const toast = useToast();
  const [items, setItems] = useState<PrepostoAdmin[]>([]);
  const [credentials, setCredentials] = useState<PrepostoCredential[]>([]);
  const [summary, setSummary] = useState(emptySummary);
  const [query, setQuery] = useState("");
  const [uf, setUf] = useState("");
  const [operation, setOperation] = useState("TODAS");
  const [status, setStatus] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<PrepostoAdmin | null | undefined>();

  const loadCredentials = useCallback(async () => {
    const response = await prepostosApi.listCredentials();
    setCredentials(response.items);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await prepostosApi.list({
        q: query.trim() || undefined,
        uf: uf.trim().toUpperCase() || undefined,
        operacao: operation === "TODAS" ? undefined : operation,
        ativo: status === "TODOS" ? undefined : status === "ATIVOS",
      });
      setItems(response.items);
      setSummary(response.summary);
      await loadCredentials();
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setLoading(false);
    }
  }, [loadCredentials, operation, query, status, toast, uf]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function remove(item: PrepostoAdmin) {
    if (!window.confirm(`Excluir definitivamente o preposto ${item.nome}?`))
      return;
    try {
      await prepostosApi.remove(item.id);
      toast.success("Preposto excluído.");
      await load();
    } catch (error) {
      toast.error(apiError(error));
    }
  }

  return (
    <div className="w-full space-y-6 p-6 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Prepostos</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Consulte e mantenha contatos, localidades, tarifas condicionais e
            despachantes credenciados utilizados nos escopos.
          </p>
        </div>
        <Button onClick={() => setEditing(null)}>
          <Plus /> Novo preposto
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Users} label="Prepostos" value={summary.prepostos} />
        <SummaryCard
          icon={MapPin}
          label="Localidades"
          value={summary.localidades}
        />
        <SummaryCard
          icon={BadgeDollarSign}
          label="Tarifas"
          value={summary.tarifas}
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Credenciados"
          value={summary.credenciados}
        />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Catálogo completo</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={loading ? "animate-spin" : ""} /> Atualizar
            </Button>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_120px_190px_150px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Nome, cidade, contato, tarifa ou credenciado"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Input
              aria-label="Filtrar por UF"
              maxLength={2}
              placeholder="UF"
              value={uf}
              onChange={(event) => setUf(event.target.value)}
            />
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas as operações</SelectItem>
                <SelectItem value="IMPORTACAO">Importação</SelectItem>
                <SelectItem value="EXPORTACAO">Exportação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVOS">Ativos</SelectItem>
                <SelectItem value="INATIVOS">Inativos</SelectItem>
                <SelectItem value="TODOS">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>Preposto</TableHead>
                  <TableHead>Contato principal</TableHead>
                  <TableHead>Localidades</TableHead>
                  <TableHead>Operações</TableHead>
                  <TableHead>Tarifas</TableHead>
                  <TableHead>Credenciados</TableHead>
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const open = expanded === item.id;
                  const primary =
                    item.contatos.find((contact) => contact.principal) ??
                    item.contatos[0];
                  const tariffs = item.localidades.reduce(
                    (total, locality) => total + locality.tarifas.length,
                    0,
                  );
                  const imports = item.localidades.some(
                    (locality) => locality.atende_importacao,
                  );
                  const exports = item.localidades.some(
                    (locality) => locality.atende_exportacao,
                  );
                  return (
                    <FragmentRows
                      key={item.id}
                      item={item}
                      open={open}
                      primary={primary}
                      tariffs={tariffs}
                      imports={imports}
                      exports={exports}
                      onToggle={() => setExpanded(open ? null : item.id)}
                      onEdit={() => setEditing(item)}
                      onRemove={() => void remove(item)}
                    />
                  );
                })}
                {!loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : null}
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Carregando catálogo...
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PrepostoEditor
        open={editing !== undefined}
        initial={editing ?? null}
        credentials={credentials}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        onChanged={load}
        onCredentialsChanged={loadCredentials}
      />
    </div>
  );
}

function FragmentRows({
  item,
  open,
  primary,
  tariffs,
  imports,
  exports,
  onToggle,
  onEdit,
  onRemove,
}: {
  item: PrepostoAdmin;
  open: boolean;
  primary: PrepostoAdmin["contatos"][number] | undefined;
  tariffs: number;
  imports: boolean;
  exports: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <>
      <TableRow>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label="Exibir detalhes"
          >
            {open ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </TableCell>
        <TableCell>
          <div className="font-medium">{item.nome}</div>
          <div className="text-xs text-muted-foreground">
            {item.razao_social || "Razão social não informada"}
          </div>
          <Badge
            className="mt-1"
            variant={item.ativo ? "secondary" : "outline"}
          >
            {item.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </TableCell>
        <TableCell>
          <div>{primary?.nome || "—"}</div>
          <div className="text-xs text-muted-foreground">
            {primary?.email || primary?.telefone || "Sem contato"}
          </div>
        </TableCell>
        <TableCell>{item.localidades.length}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {imports && <Badge variant="outline">Importação</Badge>}
            {exports && <Badge variant="outline">Exportação</Badge>}
          </div>
        </TableCell>
        <TableCell>{tariffs}</TableCell>
        <TableCell>{item.credenciados.length}</TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="Editar"
          >
            <PencilLine />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label="Excluir"
            className="text-destructive"
          >
            <Trash2 />
          </Button>
        </TableCell>
      </TableRow>
      {open ? (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/25 p-5">
            <div className="grid gap-5 xl:grid-cols-3">
              <DetailSection title="Contatos">
                {item.contatos.length ? (
                  item.contatos.map((contact) => (
                    <div
                      key={contact.id}
                      className="rounded-md border p-3 text-sm"
                    >
                      <div className="font-medium">
                        {contact.nome}{" "}
                        {contact.principal && (
                          <Badge variant="secondary">Principal</Badge>
                        )}
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {[contact.email, contact.telefone, contact.whatsapp]
                          .filter(Boolean)
                          .join(" · ") || "Sem canais informados"}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyText />
                )}
              </DetailSection>
              <DetailSection title="Localidades e tarifas">
                {item.localidades.length ? (
                  item.localidades.map((locality) => (
                    <div
                      key={locality.id}
                      className="rounded-md border p-3 text-sm"
                    >
                      <div className="font-medium">
                        {locality.cidade}
                        {locality.uf ? ` / ${locality.uf}` : ""}
                      </div>
                      <div className="text-muted-foreground">
                        {locality.descricao_local ||
                          locality.tipo_local ||
                          "Local sem descrição"}
                      </div>
                      <div className="mt-2 space-y-1">
                        {locality.tarifas.map((tariff) => (
                          <div key={tariff.id}>
                            <Badge
                              variant={
                                tariff.principal ? "secondary" : "outline"
                              }
                            >
                              {tariff.operacao}
                            </Badge>{" "}
                            {tariff.condicao || tariff.tipo}:{" "}
                            {formatMoney(
                              tariff.valor,
                              tariff.moeda,
                              tariff.valor_descricao,
                            )}
                          </div>
                        ))}
                        {!locality.tarifas.length && (
                          <span className="text-muted-foreground">
                            Sem tarifas adicionais
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyText />
                )}
              </DetailSection>
              <DetailSection title="Despachantes credenciados">
                {item.credenciados.length ? (
                  item.credenciados.map((credential) => (
                    <div
                      key={credential.id}
                      className="rounded-md border p-3 text-sm"
                    >
                      <div className="font-medium">{credential.nome}</div>
                      <div className="text-muted-foreground">
                        {[
                          credential.cpf_mascarado,
                          credential.registro_rfb,
                          credential.categoria,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Vinculado a {credential.localidade_ids.length}{" "}
                        localidade(s)
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyText />
                )}
              </DetailSection>
            </div>
            {item.observacoes ? (
              <p className="mt-4 rounded-md border bg-background p-3 text-sm">
                <strong>Observações:</strong> {item.observacoes}
              </p>
            ) : null}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon />
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function EmptyText() {
  return (
    <p className="text-sm text-muted-foreground">Nenhum registro informado.</p>
  );
}

function formatMoney(
  value: number | null,
  currency: string,
  description: string | null,
) {
  if (description) return description;
  if (value === null) return "Valor não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(Number(value));
}
