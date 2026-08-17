"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Check,
  ChevronLeft,
  CircleAlert,
  Download,
  FileCode2,
  FileJson,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { nfeApi } from "@/lib/api/services/nfe";
import { useDuimpSnapshots, useNfeDrafts, useNfeWorkflowState } from "@/lib/api/hooks/use-nfe-api";
import type { FiscalEnvironment, ImportPurpose, NfeDraftSummary } from "@/lib/api/types/nfe-api";
import { useToast } from "@/components/ui/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const actionLabels: Record<string, string> = {
  fetch_duimp: "Capturar a DUIMP",
  configure_fiscal_profile: "Cadastrar o perfil fiscal",
  select_import_purpose: "Selecionar a finalidade",
  configure_tax_rule: "Cadastrar a regra tributária",
  resolve_context: "Completar os dados da DUIMP",
  create_draft: "Gerar o rascunho da NF-e",
  configure_number_sequence: "Configurar a sequência numérica",
  correct_draft: "Corrigir as divergências do rascunho",
  generate_access_key: "Gerar a chave de acesso",
  generate_xml: "Gerar o XML não assinado",
  validate_xml: "Validar o XML no XSD",
  completed: "XML não assinado validado",
};

const draftStatusLabels: Record<string, string> = {
  draft: "Rascunho",
  validation_failed: "Requer correção",
  ready_for_xml: "Pronto para XML",
  xml_generated: "XML gerado",
  signed: "Assinado",
  transmitted: "Transmitido",
  authorized: "Autorizado",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
};

const steps = ["DUIMP", "Contexto fiscal", "Rascunho", "XML", "Conferência"];

function errorMessage(error: unknown) {
  const candidate = error as { response?: { data?: { message?: string } }; message?: string };
  return candidate.response?.data?.message || candidate.message || "Não foi possível concluir a operação.";
}

function dateLabel(value?: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
}

function issueLabel(issue: Record<string, unknown>) {
  return String(issue.message || issue.code || issue.field || "Revisão necessária");
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function saveJson(value: Record<string, unknown>, filename: string) {
  saveBlob(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }), filename);
}

export function NfeWorkflowOverview({ processId }: { processId: string }) {
  const searchParams = useSearchParams();
  const toast = useToast();
  const initialPurpose = (searchParams.get("importPurpose") || "resale") as ImportPurpose;
  const initialEnvironment = (searchParams.get("environment") || "homologation") as FiscalEnvironment;
  const initialSeries = searchParams.get("series") || "1";
  const [purpose, setPurpose] = useState<ImportPurpose>(initialPurpose);
  const [environment, setEnvironment] = useState<FiscalEnvironment>(initialEnvironment);
  const [series, setSeries] = useState(initialSeries);
  const [refreshDuimp, setRefreshDuimp] = useState(true);
  const [newDraftOpen, setNewDraftOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const workflow = useNfeWorkflowState(processId, { import_purpose: purpose, environment, series });
  const drafts = useNfeDrafts(processId);
  const snapshots = useDuimpSnapshots(processId);

  if (workflow.isLoading) {
    return <div className="flex min-h-80 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" /> Carregando o fluxo…</div>;
  }
  if (workflow.error || !workflow.data) {
    return <div className="p-8"><Alert variant="destructive"><CircleAlert /><AlertTitle>Não foi possível abrir o processo</AlertTitle><AlertDescription>Confira se ele pertence à sua organização e tente novamente.</AlertDescription></Alert></div>;
  }

  const data = workflow.data;
  const completedSteps = data.latest_draft
    ? data.latest_draft.xmlVersions.length
      ? data.latest_draft.xmlVersions[0]?.xsd_valid ? 5 : 4
      : 3
    : data.context?.ready_for_draft ? 2 : data.latest_snapshot ? 1 : 0;
  const canCreateDraft = Boolean(
    data.latest_snapshot &&
    data.prerequisites.has_fiscal_profile &&
    data.prerequisites.has_active_tax_rule &&
    data.context?.ready_for_draft,
  );

  async function createNewDraft() {
    if (!canCreateDraft) {
      toast.info("Resolva os pré-requisitos e pendências fiscais antes de criar outro rascunho.");
      return;
    }
    setBusyAction("new-draft");
    try {
      let snapshotId = data.latest_snapshot?.id;
      if (refreshDuimp) {
        const refreshed = await nfeApi.fetchDuimp(processId, environment);
        snapshotId = refreshed.snapshot.id;
      }
      await nfeApi.createDraft(processId, {
        environment,
        series,
        import_purpose: purpose,
        duimp_snapshot_id: snapshotId,
      });
      await Promise.all([workflow.mutate(), drafts.mutate(), snapshots.mutate()]);
      setNewDraftOpen(false);
      toast.success("Novo rascunho criado sem alterar as versões anteriores.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function generateDiagnosticXml(draft: NfeDraftSummary) {
    setBusyAction(`xml:${draft.id}`);
    try {
      const validation = await nfeApi.validateDraft(draft.id);
      if (!validation.valid) {
        throw new Error("O rascunho possui erros bloqueantes. Revise as pendências antes de gerar o XML.");
      }
      if (!draft.access_key) await nfeApi.generateAccessKey(draft.id);
      const version = await nfeApi.generateXml(draft.id);
      await nfeApi.validateXml(draft.id, version.id);
      await Promise.all([workflow.mutate(), drafts.mutate()]);
      toast.success(`XML v${version.version_number} gerado e validado no XSD.`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function downloadXml(draftId: string, versionId: string) {
    setBusyAction(`download:${versionId}`);
    try {
      const file = await nfeApi.downloadXml(draftId, versionId);
      saveBlob(file.blob, file.filename);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <Button variant="ghost" asChild><Link href="/nfe/processes"><ChevronLeft /> Voltar aos processos</Link></Button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{data.process.reference_code}</p>
          <h1 className="text-2xl font-semibold">DUIMP {data.process.duimp_number}</h1>
          <p className="text-sm text-muted-foreground">Ambiente {environment === "homologation" ? "de homologação" : "de produção"} · Série {series}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={data.next_action === "completed" ? "default" : "secondary"}>{actionLabels[data.next_action] || data.next_action}</Badge>
          <Button onClick={() => setNewDraftOpen(true)} disabled={!canCreateDraft}><Plus /> Novo rascunho</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Progresso da emissão</CardTitle><CardDescription>O processo permanece retomável e cada rascunho conserva seus próprios XMLs.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Progress value={(completedSteps / steps.length) * 100} />
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {steps.map((step, index) => <div key={step} className={index < completedSteps ? "font-medium text-primary" : "text-muted-foreground"}>{index < completedSteps && <Check className="mx-auto mb-1 size-4" />}{step}</div>)}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <Card>
          <CardHeader><CardTitle>Próxima ação</CardTitle><CardDescription>{actionLabels[data.next_action] || data.next_action}</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {data.next_action === "completed" ? (
              <Alert className="border-emerald-500/30 bg-emerald-500/5"><Check /><AlertTitle>Checkpoint concluído</AlertTitle><AlertDescription>O XML não assinado foi validado. Você pode baixar a versão ou atualizar a DUIMP e criar outro rascunho.</AlertDescription></Alert>
            ) : (
              <Alert><CircleAlert /><AlertTitle>Fluxo protegido por validações</AlertTitle><AlertDescription>Conclua as pendências abaixo antes de gerar um novo rascunho.</AlertDescription></Alert>
            )}
            {data.context?.missing_fields?.length ? <div className="flex flex-wrap gap-2">{data.context.missing_fields.map((field) => <Badge key={field} variant="outline">{field}</Badge>)}</div> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Resumo técnico</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Snapshots DUIMP</span><strong>{snapshots.data?.length || 0}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Perfil fiscal</span><strong>{data.prerequisites.has_fiscal_profile ? "Configurado" : "Pendente"}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Regra tributária</span><strong>{data.prerequisites.has_active_tax_rule ? "Aplicada" : "Pendente"}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Sequência</span><strong>{data.prerequisites.has_number_sequence ? "Configurada" : "Pendente"}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rascunhos</span><strong>{drafts.data?.items.length || 0}</strong></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle>Rascunhos e XMLs</CardTitle><CardDescription>Histórico auditável; nenhuma geração substitui um XML anterior.</CardDescription></div>
            <Button variant="outline" onClick={() => void drafts.mutate()}><RefreshCw /> Atualizar</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {drafts.isLoading && <p className="text-sm text-muted-foreground">Carregando rascunhos…</p>}
          {drafts.error && <Alert variant="destructive"><CircleAlert /><AlertDescription>Não foi possível consultar o histórico de rascunhos.</AlertDescription></Alert>}
          {drafts.data?.items.map((draft, index) => (
            <div key={draft.id} className="rounded-xl border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Rascunho {draft.number ? `NF-e nº ${draft.number}` : `#${drafts.data.items.length - index}`}</h3><Badge variant={draft.validation_errors.length ? "destructive" : "secondary"}>{draftStatusLabels[draft.status] || draft.status}</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">Criado em {dateLabel(draft.created_at)} · {draft.items_count} itens · Série {draft.series}</p>
                  {draft.access_key && <p className="mt-1 break-all font-mono text-xs text-muted-foreground">Chave: {draft.access_key}</p>}
                </div>
                <Button variant="outline" onClick={() => void generateDiagnosticXml(draft)} disabled={Boolean(busyAction)}>
                  {busyAction === `xml:${draft.id}` ? <Loader2 className="animate-spin" /> : <FileCode2 />}
                  {draft.xml_versions.length ? "Gerar nova versão XML" : "Gerar XML diagnóstico"}
                </Button>
              </div>

              {(draft.validation_errors.length || draft.validation_warnings.length) ? (
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {draft.validation_errors.map((issue, issueIndex) => <p key={`e-${issueIndex}`} className="rounded-md bg-destructive/5 p-2 text-xs text-destructive">{issueLabel(issue)}</p>)}
                  {draft.validation_warnings.slice(0, 4).map((issue, issueIndex) => <p key={`w-${issueIndex}`} className="rounded-md bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300">{issueLabel(issue)}</p>)}
                </div>
              ) : null}

              <div className="mt-4 space-y-2">
                {draft.xml_versions.length === 0 && <p className="text-sm text-muted-foreground">Nenhum XML gerado para este rascunho.</p>}
                {draft.xml_versions.map((version) => (
                  <div key={version.id} className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2"><FileCode2 className="size-4" /><span className="text-sm font-medium">XML {version.xml_type} v{version.version_number}</span><Badge variant={version.xsd_valid ? "default" : "outline"}>{version.xsd_valid ? "XSD válido" : "Não validado"}</Badge></div>
                    <Button size="sm" variant="ghost" onClick={() => void downloadXml(draft.id, version.id)} disabled={busyAction === `download:${version.id}`}>
                      {busyAction === `download:${version.id}` ? <Loader2 className="animate-spin" /> : <Download />} Baixar XML
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!drafts.isLoading && drafts.data?.items.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Ainda não há rascunhos para este processo.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Documentos da origem</CardTitle><CardDescription>Baixe os dados recebidos do Portal Único para conferência e auditoria.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {snapshots.data?.map((snapshot, index) => (
            <div key={snapshot.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><FileJson className="size-5 text-primary" /><div><p className="text-sm font-medium">Snapshot {snapshots.data.length - index} · DUIMP {snapshot.duimp_number}</p><p className="text-xs text-muted-foreground">Capturado em {dateLabel(snapshot.fetched_at || snapshot.created_at)}</p></div></div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => saveJson(snapshot.normalized_payload, `DUIMP-${snapshot.duimp_number}-normalizado.json`)}><Download /> Normalizado</Button>
                <Button size="sm" variant="ghost" onClick={() => saveJson(snapshot.raw_payload, `DUIMP-${snapshot.duimp_number}-original.json`)}><Download /> Original</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={newDraftOpen} onOpenChange={setNewDraftOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar novo rascunho</DialogTitle><DialogDescription>A versão anterior e seus XMLs continuarão disponíveis.</DialogDescription></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="draft-purpose">Finalidade</Label><select id="draft-purpose" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={purpose} onChange={(event) => setPurpose(event.target.value as ImportPurpose)}><option value="resale">Revenda</option><option value="industrialization">Industrialização</option><option value="fixed_asset">Ativo imobilizado</option><option value="use_consumption">Uso e consumo</option></select></div>
            <div className="space-y-1.5"><Label htmlFor="draft-environment">Ambiente</Label><select id="draft-environment" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={environment} onChange={(event) => setEnvironment(event.target.value as FiscalEnvironment)}><option value="homologation">Homologação</option><option value="production">Produção</option></select></div>
            <div className="space-y-1.5"><Label htmlFor="draft-series">Série</Label><Input id="draft-series" value={series} onChange={(event) => setSeries(event.target.value)} /></div>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm"><input className="mt-1" type="checkbox" checked={refreshDuimp} onChange={(event) => setRefreshDuimp(event.target.checked)} /><span><strong className="block">Atualizar a DUIMP antes de criar</strong><span className="text-muted-foreground">Consulta novamente o Portal Único e vincula o rascunho ao snapshot mais recente.</span></span></label>
          <Alert><CircleAlert /><AlertDescription>A numeração da NF-e só será reservada quando a chave de acesso for gerada.</AlertDescription></Alert>
          <Button onClick={() => void createNewDraft()} disabled={busyAction === "new-draft"}>{busyAction === "new-draft" && <Loader2 className="animate-spin" />} Criar novo rascunho</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
