"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  History,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { useAuditEventOptions, useAuditEvents } from "@/lib/api/hooks/use-audit-api";
import { auditApi } from "@/lib/api/services/audit";
import type {
  AuditChange,
  AuditEvent,
  AuditEventFilters,
  AuditReversalPreview,
} from "@/lib/api/types/audit-api";
import { useAuthSession } from "@/lib/auth/session-storage";

const PAGE_SIZE = 30;

const actionLabels: Record<string, string> = {
  "scope.created": "Escopo criado",
  "scope.updated": "Escopo atualizado",
  "scope.published": "Escopo publicado",
  "scope.deleted": "Escopo excluído",
  "scope.bulk_updated": "Alteração em massa",
  "scope.reversed": "Reversão de escopo",
  "user.created": "Usuário criado",
  "user.updated": "Usuário atualizado",
  "user.activated": "Usuário reativado",
  "user.deactivated": "Usuário inativado",
  "user_tag.created": "Tag criada",
  "user_tag.updated": "Tag atualizada",
};

const fieldLabels: Record<string, string> = {
  status: "Status",
  draft: "Rascunho",
  publishedSnapshot: "Versão publicada",
  responsibleUserId: "Responsável comercial",
  clientId: "Cliente",
  version: "Versão",
  lastPublishedAt: "Última publicação",
  name: "Nome",
  email: "E-mail",
  role: "Nível de acesso",
  department: "Setor",
  active: "Ativo",
  tags: "Tags",
  credentialsChanged: "Credenciais alteradas",
};

function actionLabel(action: string) {
  return actionLabels[action] ?? action;
}

function actionBadge(action: string) {
  if (action.includes("deleted") || action.includes("deactivated")) return "destructive";
  if (action.includes("published") || action.includes("created")) return "default";
  return "secondary";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getPath(source: Record<string, unknown> | null | undefined, path: string) {
  if (!source) return undefined;
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "string" || typeof value === "number") return String(value);
  const serialized = JSON.stringify(value, null, 2);
  return serialized.length > 600 ? `${serialized.slice(0, 600)}…` : serialized;
}

function fieldLabel(path: string) {
  const segments = path.split(".");
  const key = segments.at(-1) ?? path;
  return fieldLabels[key] ?? path;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

export default function AuditHistoryPage() {
  const session = useAuthSession();
  const [draftFilters, setDraftFilters] = useState<AuditEventFilters>({});
  const [filters, setFilters] = useState<AuditEventFilters>({
    limit: PAGE_SIZE,
    offset: 0,
  });
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reversalOpen, setReversalOpen] = useState(false);
  const [reversalPreview, setReversalPreview] = useState<AuditReversalPreview | null>(null);
  const [reversalLoading, setReversalLoading] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const events = useAuditEvents(filters);
  const options = useAuditEventOptions();
  const isAdmin = session?.user.role === "admin";
  const total = events.data?.total ?? 0;
  const page = Math.floor((filters.offset ?? 0) / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const actors = useMemo(
    () => (options.data?.actors ?? []).filter((actor) => actor.id),
    [options.data?.actors],
  );

  function applyFilters() {
    setFilters({
      ...draftFilters,
      q: draftFilters.q?.trim() || undefined,
      limit: PAGE_SIZE,
      offset: 0,
    });
  }

  function clearFilters() {
    setDraftFilters({});
    setFilters({ limit: PAGE_SIZE, offset: 0 });
  }

  async function openDetail(event: AuditEvent) {
    setSelected(event);
    setDetailLoading(true);
    try {
      setSelected(await auditApi.getEvent(event.id));
    } catch (error) {
      toast.error(errorMessage(error));
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function openReversal() {
    if (!selected) return;
    setReversalOpen(true);
    setReversalLoading(true);
    setReversalPreview(null);
    setConfirmation("");
    try {
      setReversalPreview(await auditApi.previewReversal(selected.id));
    } catch (error) {
      toast.error(errorMessage(error));
      setReversalOpen(false);
    } finally {
      setReversalLoading(false);
    }
  }

  async function confirmReversal() {
    if (!selected || confirmation.trim().toUpperCase() !== "REVERTER") return;
    setReversalLoading(true);
    try {
      const result = await auditApi.reverseEvent(selected.id);
      toast.success(`${result.result.reverted} alteração(ões) revertida(s).`);
      setReversalOpen(false);
      setSelected(result.event);
      await events.mutate();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setReversalLoading(false);
    }
  }

  if (!session) {
    return (
      <main className="flex w-full items-center justify-center p-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Validando acesso...
      </main>
    );
  }

  return (
    <main className="w-full min-w-0 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <History className="size-6" /> Histórico da plataforma
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulte quem alterou cada registro, compare os valores e acompanhe operações em massa.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={draftFilters.q ?? ""}
                onChange={(event) => setDraftFilters((current) => ({ ...current, q: event.target.value }))}
                onKeyDown={(event) => { if (event.key === "Enter") applyFilters(); }}
                placeholder="Ação, cliente ou responsável"
                className="pl-9"
              />
            </div>
            <Select
              value={draftFilters.module ?? "all"}
              onValueChange={(value) => setDraftFilters((current) => ({ ...current, module: value === "all" ? undefined : value }))}
            >
              <SelectTrigger><SelectValue placeholder="Módulo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os módulos</SelectItem>
                {(options.data?.modules ?? []).map((module) => (
                  <SelectItem key={module} value={module}>{module === "scopes" ? "Escopos" : "Usuários"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={draftFilters.action ?? "all"}
              onValueChange={(value) => setDraftFilters((current) => ({ ...current, action: value === "all" ? undefined : value }))}
            >
              <SelectTrigger><SelectValue placeholder="Ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {(options.data?.actions ?? []).map((action) => (
                  <SelectItem key={action} value={action}>{actionLabel(action)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={draftFilters.actorUserId ?? "all"}
              onValueChange={(value) => setDraftFilters((current) => ({ ...current, actorUserId: value === "all" ? undefined : value }))}
            >
              <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as pessoas</SelectItem>
                {actors.map((actor) => (
                  <SelectItem key={actor.id!} value={actor.id!}>{actor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="flex-1"><Search /> Filtrar</Button>
              <Button variant="outline" onClick={clearFilters}>Limpar</Button>
            </div>
            <label className="space-y-1 text-xs text-muted-foreground xl:col-start-1">
              <span className="flex items-center gap-1"><CalendarDays className="size-3" /> De</span>
              <Input type="date" value={draftFilters.dateFrom ?? ""} onChange={(event) => setDraftFilters((current) => ({ ...current, dateFrom: event.target.value || undefined }))} />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Até</span>
              <Input type="date" value={draftFilters.dateTo ?? ""} onChange={(event) => setDraftFilters((current) => ({ ...current, dateTo: event.target.value || undefined }))} />
            </label>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between border-b">
            <div>
              <CardTitle>Operações registradas</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{total} evento(s) encontrado(s)</p>
            </div>
            {isAdmin ? <Badge variant="outline"><ShieldCheck /> Visão administrativa</Badge> : null}
          </CardHeader>
          <CardContent className="p-0">
            {events.isLoading ? (
              <div className="flex items-center justify-center p-12 text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" /> Carregando histórico...</div>
            ) : events.error ? (
              <Alert variant="destructive" className="m-5"><AlertTriangle /><AlertTitle>Não foi possível carregar</AlertTitle><AlertDescription>{errorMessage(events.error)}</AlertDescription></Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-center">Impactados</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(events.data?.items ?? []).map((event) => (
                    <TableRow key={event.id} className="cursor-pointer" onClick={() => void openDetail(event)}>
                      <TableCell className="text-muted-foreground">{formatDate(event.createdAt)}</TableCell>
                      <TableCell><Badge variant={actionBadge(event.action)}>{actionLabel(event.action)}</Badge></TableCell>
                      <TableCell className="max-w-sm whitespace-normal">
                        <div className="font-medium">{event.targetLabel ?? event.title}</div>
                        {event.operationId ? <div className="text-xs text-muted-foreground">Operação agrupada</div> : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" /><div><div>{event.actor.name}</div><div className="text-xs text-muted-foreground">{event.actor.email}</div></div></div>
                      </TableCell>
                      <TableCell className="text-center">{event.affectedCount}</TableCell>
                      <TableCell><ChevronRight className="size-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  ))}
                  {!events.data?.items.length ? (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Nenhum evento corresponde aos filtros.</TableCell></TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setFilters((current) => ({ ...current, offset: Math.max((current.offset ?? 0) - PAGE_SIZE, 0) }))}><ArrowLeft /> Anterior</Button>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setFilters((current) => ({ ...current, offset: (current.offset ?? 0) + PAGE_SIZE }))}>Próxima <ArrowRight /></Button>
          </div>
        </div>
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader className="border-b pr-12">
            <SheetTitle>{selected?.title}</SheetTitle>
            <SheetDescription>{selected ? `${formatDate(selected.createdAt)} · ${selected.actor.name}` : ""}</SheetDescription>
          </SheetHeader>
          {detailLoading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" /> Carregando detalhes...</div>
          ) : selected ? (
            <div className="space-y-5 px-4 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={actionBadge(selected.action)}>{actionLabel(selected.action)}</Badge>
                <Badge variant="outline">{selected.affectedCount} registro(s)</Badge>
                {selected.reversed ? <Badge variant="outline"><CheckCircle2 /> Já revertido</Badge> : null}
              </div>
              {selected.summary ? <p className="text-sm text-muted-foreground">{selected.summary}</p> : null}
              {isAdmin && selected.reversible && !selected.reversed ? (
                <Alert>
                  <RotateCcw />
                  <AlertTitle>Reversão disponível</AlertTitle>
                  <AlertDescription className="flex flex-col gap-3">
                    <span>A operação será revertida somente nos registros que não sofreram alterações posteriores.</span>
                    <Button size="sm" variant="outline" className="w-fit" onClick={() => void openReversal()}><RotateCcw /> Analisar reversão</Button>
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="space-y-4">
                {(selected.changes ?? []).map((change) => <ChangeCard key={change.id} change={change} />)}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={reversalOpen} onOpenChange={setReversalOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar reversão</DialogTitle>
            <DialogDescription>Esta é uma nova operação auditada. O evento original não será alterado ou apagado.</DialogDescription>
          </DialogHeader>
          {reversalLoading && !reversalPreview ? (
            <div className="flex items-center justify-center p-8 text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" /> Verificando conflitos...</div>
          ) : reversalPreview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <StatusMetric label="Elegíveis" value={reversalPreview.eligible} tone="success" />
                <StatusMetric label="Conflitos" value={reversalPreview.conflicts} tone="warning" />
                <StatusMetric label="Ignorados" value={reversalPreview.skipped} tone="neutral" />
              </div>
              {reversalPreview.conflicts ? (
                <Alert><AlertTriangle /><AlertTitle>Há alterações posteriores</AlertTitle><AlertDescription>Escopos com conflito serão preservados e ignorados pela reversão.</AlertDescription></Alert>
              ) : null}
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border p-2">
                {reversalPreview.items.map((item) => (
                  <div key={item.changeId} className="flex items-start justify-between gap-3 rounded-md p-2 text-sm">
                    <div><div className="font-medium">{item.label}</div>{item.reason ? <div className="text-xs text-muted-foreground">{item.reason}</div> : null}</div>
                    <Badge variant={item.status === "eligible" ? "default" : "outline"}>{item.status === "eligible" ? "Será revertido" : "Ignorado"}</Badge>
                  </div>
                ))}
              </div>
              <label className="space-y-2 text-sm font-medium">
                <span>Digite <strong>REVERTER</strong> para confirmar</span>
                <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReversalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" disabled={reversalLoading || !reversalPreview?.eligible || confirmation.trim().toUpperCase() !== "REVERTER"} onClick={() => void confirmReversal()}>
              {reversalLoading ? <Loader2 className="animate-spin" /> : <RotateCcw />} Reverter elegíveis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ChangeCard({ change }: { change: AuditChange }) {
  const fields = change.changedFields.slice(0, 100);
  return (
    <Card>
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">{change.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {fields.map((field) => (
          <div key={field} className="grid gap-2 rounded-lg border p-3 text-sm md:grid-cols-[minmax(0,10rem)_1fr_1fr]">
            <div className="font-medium">{fieldLabel(field)}</div>
            <div className="min-w-0"><div className="mb-1 text-xs uppercase text-muted-foreground">Antes</div><pre className="whitespace-pre-wrap break-words font-sans text-xs">{formatValue(getPath(change.before, field))}</pre></div>
            <div className="min-w-0"><div className="mb-1 text-xs uppercase text-muted-foreground">Depois</div><pre className="whitespace-pre-wrap break-words font-sans text-xs">{formatValue(getPath(change.after, field))}</pre></div>
          </div>
        ))}
        {change.changedFields.length > fields.length ? <p className="text-xs text-muted-foreground">Mais {change.changedFields.length - fields.length} campo(s) alterado(s).</p> : null}
      </CardContent>
    </Card>
  );
}

function StatusMetric({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "neutral" }) {
  const colors = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100" : "bg-muted";
  return <div className={`rounded-lg border p-3 text-center ${colors}`}><div className="text-2xl font-semibold">{value}</div><div className="text-xs">{label}</div></div>;
}
