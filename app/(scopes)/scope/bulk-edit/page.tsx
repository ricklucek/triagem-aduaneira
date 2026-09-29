"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  UsersRound,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { toast } from "@/components/ui/toast";
import { UserTagBadge } from "@/components/settings/user-tag-badge";
import { useResponsibles, useUserTags } from "@/lib/api/hooks/use-dashboards";
import {
  useBulkScopeCandidates,
  useBulkScopeUpdateOptions,
} from "@/lib/api/hooks/use-scope-api";
import { scopeApi } from "@/lib/api/services/scopes";
import type {
  BulkScopeCandidateFilters,
  BulkScopeUpdateField,
  BulkScopeUpdatePreview,
} from "@/lib/api/types/scope-api";
import { useAuthSession } from "@/lib/auth/session-storage";
import { formatCNPJ } from "@/utils/format";

const ALL = "__all__";
const PAGE_SIZE = 50;
const APPLY_BATCH_SIZE = 50;
const MAX_SELECTION = 500;

const steps = [
  "Selecionar escopos",
  "Definir alteração",
  "Revisar impactos",
  "Executar",
];

const fieldShortLabels: Record<BulkScopeUpdateField, string> = {
  responsavel_comercial: "Comercial",
  analista_da_importacao: "DA Importação",
  analista_ae_importacao: "AE Importação",
  analista_da_exportacao: "DA Exportação",
  analista_ae_exportacao: "AE Exportação",
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

function statusLabel(status: string) {
  if (status === "published") return "Publicado";
  if (status === "draft") return "Rascunho";
  return "Arquivado";
}

function skippedReason(reason: string) {
  if (reason === "operation_not_enabled") return "Operação não habilitada no escopo";
  if (reason === "already_assigned") return "Já possui o valor selecionado";
  return "Escopo indisponível ou sem permissão";
}

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

export default function BulkScopeUpdatePage() {
  const session = useAuthSession();

  if (!session) {
    return (
      <main className="flex w-full items-center justify-center p-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Validando acesso...
      </main>
    );
  }

  return <BulkScopeUpdateWorkflow />;
}

function BulkScopeUpdateWorkflow() {
  const [step, setStep] = useState(1);
  const [queryInput, setQueryInput] = useState("");
  const [filters, setFilters] = useState<BulkScopeCandidateFilters>({
    limit: PAGE_SIZE,
    offset: 0,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [field, setField] = useState<BulkScopeUpdateField | null>(null);
  const [targetUserId, setTargetUserId] = useState("");
  const [preview, setPreview] = useState<BulkScopeUpdatePreview | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [executionSummary, setExecutionSummary] = useState<{
    impacted: number;
    skipped: number;
  } | null>(null);

  const candidates = useBulkScopeCandidates(filters);
  const options = useBulkScopeUpdateOptions();
  const { data: tags = [] } = useUserTags();
  const responsibles = useResponsibles();
  const selectedField = options.data?.fields.find((item) => item.value === field);
  const requiredTag = tags.find((tag) => tag.code === selectedField?.requiredTagCode);
  const users = useMemo(
    () => (responsibles.data ?? []).filter(
      (user) => requiredTag && user.tags.some((tag) => tag.id === requiredTag.id),
    ),
    [requiredTag, responsibles.data],
  );

  const items = candidates.data?.items ?? [];
  const total = candidates.data?.total ?? 0;
  const page = Math.floor((filters.offset ?? 0) / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageIds = items.map((item) => item.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const targetUser = users.find((user) => user.id === targetUserId);

  const assignmentColumns = useMemo(
    () => options.data?.fields.map((item) => item.value) ?? [],
    [options.data?.fields],
  );

  function applyFilters(next?: Partial<BulkScopeCandidateFilters>) {
    setFilters((current) => ({
      ...current,
      ...next,
      q: queryInput.trim() || undefined,
      limit: PAGE_SIZE,
      offset: 0,
    }));
  }

  function toggleScope(scopeId: string) {
    setSelectedIds((current) => {
      if (current.includes(scopeId)) return current.filter((id) => id !== scopeId);
      if (current.length >= MAX_SELECTION) {
        toast.error(`Selecione no máximo ${MAX_SELECTION} escopos por operação.`);
        return current;
      }
      return [...current, scopeId];
    });
    setPreview(null);
  }

  function toggleCurrentPage() {
    setSelectedIds((current) => {
      if (allPageSelected) return current.filter((id) => !pageIds.includes(id));
      const merged = Array.from(new Set([...current, ...pageIds]));
      if (merged.length > MAX_SELECTION) {
        toast.error(`A seleção não pode ultrapassar ${MAX_SELECTION} escopos.`);
        return current;
      }
      return merged;
    });
    setPreview(null);
  }

  async function buildPreview() {
    if (!field || !targetUserId || selectedIds.length === 0) return;
    try {
      setReviewing(true);
      const result = await scopeApi.previewBulkScopeUpdate({
        field,
        targetUserId,
        scopeIds: selectedIds,
      });
      setPreview(result);
      setStep(3);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setReviewing(false);
    }
  }

  async function executeUpdate() {
    if (!field || !targetUserId || !preview?.changes.length) return;
    const eligibleIds = preview.changes.map((change) => change.scopeId);
    const batches = chunk(eligibleIds, APPLY_BATCH_SIZE);
    let impacted = 0;
    let skipped = preview.skippedScopes;

    setStep(4);
    setExecuting(true);
    setProgress(0);
    setExecutionSummary(null);
    try {
      for (let index = 0; index < batches.length; index += 1) {
        const result = await scopeApi.applyBulkScopeUpdate({
          field,
          targetUserId,
          scopeIds: batches[index],
        });
        impacted += result.impactedScopes;
        skipped += result.skippedScopes;
        setProgress(Math.round(((index + 1) / batches.length) * 100));
      }
      setExecutionSummary({ impacted, skipped });
      toast.success(`${impacted} escopo(s) atualizado(s) com sucesso.`);
    } catch (error) {
      setExecutionSummary({ impacted, skipped });
      toast.error(
        `${errorMessage(error)} ${impacted} escopo(s) já haviam sido atualizados antes da interrupção.`,
      );
    } finally {
      setExecuting(false);
    }
  }

  function confirmExecution() {
    if (confirmationText.trim().toUpperCase() !== "ALTERAR") return;
    setConfirmOpen(false);
    setConfirmationText("");
    void executeUpdate();
  }

  return (
    <main className="w-full min-w-0 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Alteração em massa de escopos</h1>
            <p className="text-sm text-muted-foreground">
              Pesquise, filtre e revise os escopos antes de aplicar uma atribuição coletiva.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/scope/list"><ArrowLeft /> Voltar para escopos</Link>
          </Button>
        </div>

        <Card className="gap-4 py-4">
          <CardContent className="grid gap-3 px-4 sm:grid-cols-4">
            {steps.map((label, index) => {
              const number = index + 1;
              const active = number === step;
              const complete = number < step;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${active ? "border-primary bg-primary/5" : ""}`}
                >
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${complete || active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {complete ? <Check className="size-4" /> : number}
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {step === 1 ? (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Filter className="size-5" /> Filtros dos escopos</CardTitle>
                <CardDescription>
                  A pesquisa procura cada palavra na razão social, nome resumido, CNPJ e em todo o conteúdo preenchido no escopo.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    value={queryInput}
                    onChange={(event) => setQueryInput(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") applyFilters(); }}
                    placeholder="Ex.: madeira Curitiba importação"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filters.status ?? ALL}
                  onValueChange={(value) => applyFilters({ status: value === ALL ? undefined : value as BulkScopeCandidateFilters["status"] })}
                >
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos os status</SelectItem>
                    <SelectItem value="published">Publicados</SelectItem>
                    <SelectItem value="draft">Rascunhos</SelectItem>
                    <SelectItem value="archived">Arquivados</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.operation ?? ALL}
                  onValueChange={(value) => applyFilters({ operation: value === ALL ? undefined : value as BulkScopeCandidateFilters["operation"] })}
                >
                  <SelectTrigger><SelectValue placeholder="Operação" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Importação e exportação</SelectItem>
                    <SelectItem value="IMPORTACAO">Importação</SelectItem>
                    <SelectItem value="EXPORTACAO">Exportação</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.tagId ?? ALL}
                  onValueChange={(value) => applyFilters({ tagId: value === ALL ? undefined : value })}
                >
                  <SelectTrigger><SelectValue placeholder="Tag vinculada" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todas as tags</SelectItem>
                    {tags.map((tag) => <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={() => applyFilters()} className="xl:col-start-5">
                  <Search /> Pesquisar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Escopos encontrados</CardTitle>
                    <CardDescription>{total} resultado(s) · {selectedIds.length} selecionado(s)</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={toggleCurrentPage} disabled={!items.length}>
                      {allPageSelected ? "Desmarcar página" : "Selecionar página"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} disabled={!selectedIds.length}>
                      Limpar seleção
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-0">
                {candidates.isLoading ? (
                  <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Carregando escopos...</div>
                ) : candidates.error ? (
                  <div className="p-8 text-center text-sm text-destructive">Não foi possível carregar os escopos.</div>
                ) : !items.length ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Nenhum escopo corresponde aos filtros informados.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Operação</TableHead>
                        <TableHead>Responsáveis atuais</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((scope) => {
                        const selected = selectedIds.includes(scope.id);
                        return (
                          <TableRow key={scope.id} data-state={selected ? "selected" : undefined}>
                            <TableCell>
                              <input
                                type="checkbox"
                                className="size-4 accent-primary"
                                checked={selected}
                                onChange={() => toggleScope(scope.id)}
                                aria-label={`Selecionar ${scope.clientName ?? scope.id}`}
                              />
                            </TableCell>
                            <TableCell className="min-w-64 whitespace-normal">
                              <div className="font-medium">{scope.clientName ?? "Cliente sem nome"}</div>
                              {scope.clientShortName ? <div className="text-xs text-muted-foreground">{scope.clientShortName}</div> : null}
                              <div className="text-xs text-muted-foreground">{scope.clientCnpj ? formatCNPJ(scope.clientCnpj) : "CNPJ não informado"}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {scope.operations.map((operation) => <Badge key={operation} variant="outline">{operation === "IMPORTACAO" ? "Importação" : "Exportação"}</Badge>)}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-72 whitespace-normal">
                              <div className="space-y-1 text-xs">
                                {assignmentColumns.map((column) => {
                                  const names = scope.assignments[column]?.map((user) => user.name) ?? [];
                                  if (!names.length) return null;
                                  return <div key={column}><span className="font-medium">{fieldShortLabels[column]}:</span> {names.join(", ")}</div>;
                                })}
                              </div>
                            </TableCell>
                            <TableCell><Badge variant={scope.status === "published" ? "default" : "secondary"}>{statusLabel(scope.status)}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
                <div className="flex flex-col gap-3 border-t px-6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilters((current) => ({ ...current, offset: Math.max(0, (current.offset ?? 0) - PAGE_SIZE) }))}>Anterior</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setFilters((current) => ({ ...current, offset: (current.offset ?? 0) + PAGE_SIZE }))}>Próxima</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button disabled={!selectedIds.length} onClick={() => setStep(2)}>
                Definir alteração ({selectedIds.length}) <ArrowRight />
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Qual informação deve ser substituída?</CardTitle>
                <CardDescription>
                  Importação e exportação são tratadas separadamente para não alterar atribuições que não fazem parte da operação escolhida.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {options.data?.fields.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setField(option.value); setTargetUserId(""); setPreview(null); }}
                    className={`rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 ${field === option.value ? "border-primary bg-primary/5" : ""}`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {option.operation ? `Somente escopos de ${option.operation === "IMPORTACAO" ? "importação" : "exportação"}` : "Todos os tipos de operação"}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {selectedField ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><UsersRound className="size-5" /> Novo responsável</CardTitle>
                  <CardDescription>
                    Somente usuários ativos com a tag exigida para este campo são apresentados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {requiredTag ? <UserTagBadge tag={requiredTag} /> : null}
                  <Select value={targetUserId} onValueChange={(value) => { setTargetUserId(value); setPreview(null); }}>
                    <SelectTrigger className="max-w-xl"><SelectValue placeholder="Selecione o usuário de destino" /></SelectTrigger>
                    <SelectContent>
                      {users.map((user) => <SelectItem key={user.id} value={user.id}>{user.nome} · {user.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!responsibles.isLoading && requiredTag && !users.length ? (
                    <Alert>
                      <ShieldAlert />
                      <AlertTitle>Nenhum usuário disponível</AlertTitle>
                      <AlertDescription>Cadastre a tag {requiredTag.name} em um usuário ativo antes de continuar.</AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft /> Voltar</Button>
              <Button disabled={!field || !targetUserId || reviewing} onClick={() => void buildPreview()}>
                {reviewing ? <Loader2 className="animate-spin" /> : null}
                Revisar {selectedIds.length} escopo(s) <ArrowRight />
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 && preview ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardHeader><CardDescription>Selecionados</CardDescription><CardTitle className="text-3xl">{preview.requestedScopes}</CardTitle></CardHeader></Card>
              <Card><CardHeader><CardDescription>Serão alterados</CardDescription><CardTitle className="text-3xl text-primary">{preview.eligibleScopes}</CardTitle></CardHeader></Card>
              <Card><CardHeader><CardDescription>Ignorados</CardDescription><CardTitle className="text-3xl">{preview.skippedScopes}</CardTitle></CardHeader></Card>
            </div>

            <Alert>
              <CheckCircle2 />
              <AlertTitle>{preview.fieldLabel}</AlertTitle>
              <AlertDescription>
                O novo valor será <strong>{preview.targetUser.name}</strong>. Escopos publicados receberão uma nova versão e terão o snapshot publicado atualizado.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader><CardTitle>Alterações previstas</CardTitle></CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Valor atual</TableHead><TableHead>Novo valor</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {preview.changes.map((change) => (
                      <TableRow key={change.scopeId}>
                        <TableCell className="whitespace-normal"><div className="font-medium">{change.clientName ?? change.scopeId}</div><div className="text-xs text-muted-foreground">{change.clientCnpj ? formatCNPJ(change.clientCnpj) : ""}</div></TableCell>
                        <TableCell className="whitespace-normal">{change.fromUsers.map((user) => user.name).join(", ") || "Não atribuído"}</TableCell>
                        <TableCell className="font-medium">{change.toUser.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {preview.skipped.length ? (
              <Card>
                <CardHeader><CardTitle>Escopos ignorados</CardTitle><CardDescription>Eles não serão modificados.</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  {preview.skipped.map((item) => <div key={item.scopeId} className="flex justify-between gap-4 rounded-lg border p-3 text-sm"><span>{item.clientName ?? item.scopeId}</span><span className="text-muted-foreground">{skippedReason(item.reason)}</span></div>)}
                </CardContent>
              </Card>
            ) : null}

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft /> Ajustar alteração</Button>
              <Button disabled={!preview.eligibleScopes} onClick={() => setConfirmOpen(true)}>
                Confirmar {preview.eligibleScopes} alteração(ões) <ArrowRight />
              </Button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <Card>
            <CardHeader>
              <CardTitle>{executing ? "Aplicando alterações" : executionSummary ? "Alteração concluída" : "Alteração interrompida"}</CardTitle>
              <CardDescription>
                {executing ? "Os escopos estão sendo processados em lotes seguros de 50 registros." : "O resultado abaixo considera somente os escopos validados na etapa anterior."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Progress value={progress} />
              <div className="text-sm text-muted-foreground">Progresso: {progress}%</div>
              {executionSummary ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border bg-primary/5 p-5"><div className="text-sm text-muted-foreground">Escopos atualizados</div><div className="text-3xl font-semibold text-primary">{executionSummary.impacted}</div></div>
                  <div className="rounded-xl border p-5"><div className="text-sm text-muted-foreground">Escopos ignorados</div><div className="text-3xl font-semibold">{executionSummary.skipped}</div></div>
                </div>
              ) : null}
              {!executing ? (
                <div className="flex flex-wrap gap-3">
                  <Button asChild><Link href="/scope/list">Voltar para escopos</Link></Button>
                  <Button variant="outline" onClick={() => { setStep(1); setSelectedIds([]); setField(null); setTargetUserId(""); setPreview(null); setProgress(0); setExecutionSummary(null); void candidates.mutate(); }}>Nova alteração em massa</Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {step > 1 && step < 4 ? (
          <div className="text-sm text-muted-foreground">
            {selectedIds.length} escopo(s) selecionado(s){targetUser ? ` · destino: ${targetUser.nome}` : ""}
          </div>
        ) : null}

        <Dialog
          open={confirmOpen}
          onOpenChange={(open) => {
            setConfirmOpen(open);
            if (!open) setConfirmationText("");
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar alteração em massa</DialogTitle>
              <DialogDescription>
                Esta operação modificará {preview?.eligibleScopes ?? 0} escopo(s). Confira os dados antes de continuar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                <div><span className="font-medium">Campo:</span> {preview?.fieldLabel ?? selectedField?.label}</div>
                <div><span className="font-medium">Novo valor:</span> {preview?.targetUser.name ?? targetUser?.nome}</div>
                <div><span className="font-medium">Escopos alterados:</span> {preview?.eligibleScopes ?? 0}</div>
                <div><span className="font-medium">Escopos ignorados:</span> {preview?.skippedScopes ?? 0}</div>
              </div>
              <Alert variant="destructive">
                <ShieldAlert />
                <AlertTitle>Confirmação obrigatória</AlertTitle>
                <AlertDescription>
                  Digite <strong>ALTERAR</strong> para autorizar a aplicação das mudanças.
                </AlertDescription>
              </Alert>
              <Input
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") confirmExecution();
                }}
                placeholder="Digite ALTERAR"
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
              <Button
                onClick={confirmExecution}
                disabled={confirmationText.trim().toUpperCase() !== "ALTERAR"}
              >
                Aplicar alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
