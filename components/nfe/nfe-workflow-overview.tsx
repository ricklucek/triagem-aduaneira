"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, ChevronLeft, CircleAlert, FileCode2, Loader2 } from "lucide-react";
import { useNfeWorkflowState } from "@/lib/api/hooks/use-nfe-api";
import type { FiscalEnvironment, ImportPurpose } from "@/lib/api/types/nfe-api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const steps = ["DUIMP", "Contexto fiscal", "Rascunho", "XML", "Conferência"];

export function NfeWorkflowOverview({ processId }: { processId: string }) {
  const searchParams = useSearchParams();
  const importPurpose = (searchParams.get("importPurpose") || "resale") as ImportPurpose;
  const environment = (searchParams.get("environment") || "homologation") as FiscalEnvironment;
  const series = searchParams.get("series") || "1";
  const { data, error, isLoading } = useNfeWorkflowState(processId, {
    import_purpose: importPurpose,
    environment,
    series,
  });

  if (isLoading) return <div className="flex min-h-80 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" /> Carregando o fluxo…</div>;
  if (error || !data) return <div className="p-8"><Alert variant="destructive"><CircleAlert /><AlertTitle>Não foi possível abrir o processo</AlertTitle><AlertDescription>Confira se ele pertence à sua organização e tente novamente.</AlertDescription></Alert></div>;

  const completedSteps = data.latest_draft
    ? data.latest_draft.xmlVersions.length
      ? data.latest_draft.xmlVersions[0]?.xsd_valid ? 5 : 4
      : 3
    : data.context?.ready_for_draft ? 2 : data.latest_snapshot ? 1 : 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <Button variant="ghost" asChild><Link href="/nfe/processes"><ChevronLeft /> Voltar aos processos</Link></Button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-sm font-medium text-primary">{data.process.reference_code}</p><h1 className="text-2xl font-semibold">DUIMP {data.process.duimp_number}</h1><p className="text-sm text-muted-foreground">Ambiente {environment === "homologation" ? "de homologação" : "de produção"} · Série {series}</p></div>
        <Badge variant={data.next_action === "completed" ? "default" : "secondary"}>{actionLabels[data.next_action] || data.next_action}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Progresso da emissão</CardTitle><CardDescription>O sistema retoma automaticamente a partir do último checkpoint persistido.</CardDescription></CardHeader>
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
              <Alert className="border-emerald-500/30 bg-emerald-500/5"><Check /><AlertTitle>Checkpoint concluído</AlertTitle><AlertDescription>O XML não assinado foi gerado e validado no XSD. A assinatura continuará bloqueada até a etapa específica.</AlertDescription></Alert>
            ) : (
              <Alert><CircleAlert /><AlertTitle>Fluxo protegido por validações</AlertTitle><AlertDescription>A próxima tela do assistente usará as pendências e avisos retornados pela API para solicitar somente os campos necessários.</AlertDescription></Alert>
            )}
            {data.context?.missing_fields?.length ? <div><p className="mb-2 text-sm font-medium">Pendências encontradas</p><div className="flex flex-wrap gap-2">{data.context.missing_fields.map((field) => <Badge key={field} variant="outline">{field}</Badge>)}</div></div> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Resumo técnico</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Snapshot DUIMP</span><strong>{data.latest_snapshot ? "Disponível" : "Pendente"}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Perfil fiscal</span><strong>{data.prerequisites.has_fiscal_profile ? "Configurado" : "Pendente"}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Regra tributária</span><strong>{data.prerequisites.has_active_tax_rule ? "Aplicada" : "Pendente"}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Sequência</span><strong>{data.prerequisites.has_number_sequence ? "Configurada" : "Pendente"}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Itens no rascunho</span><strong>{data.latest_draft?.items.length || 0}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Versões de XML</span><strong>{data.latest_draft?.xmlVersions.length || 0}</strong></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"><FileCode2 className="size-5" /> Neste primeiro checkpoint, cliente, perfil fiscal, regra, sequência, criação do processo e captura da DUIMP já estão integrados.</div>
    </div>
  );
}
