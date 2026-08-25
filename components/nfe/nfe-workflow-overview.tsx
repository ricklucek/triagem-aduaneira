"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  FileCode2,
  Loader2,
  LockKeyhole,
  PencilLine,
  Plus,
  RefreshCw,
} from "lucide-react";
import { nfeApi } from "@/lib/api/services/nfe";
import { useDuimpSnapshots, useNfeDrafts, useNfeWorkflowState } from "@/lib/api/hooks/use-nfe-api";
import type {
  NfeDraftDetailResponse,
  NfeDraftSummary,
  NfeWorkflowState,
  NfeWorkflowStepKey,
  NfeXmlVersionSummary,
  UpdateNfeDraftPayload,
} from "@/lib/api/types/nfe-api";
import { useToast } from "@/components/ui/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { NfeItemClassificationPanel } from "@/components/nfe/nfe-item-classification-panel";
import { NfeDuimpOverview } from "@/components/nfe/nfe-duimp-overview";
import { NfeDocumentPlanPanel } from "@/components/nfe/nfe-document-plan-panel";
import { NfeWorkflowPendingSheet } from "@/components/nfe/nfe-workflow-pending-sheet";

const actionLabels: Record<string, string> = {
  fetch_duimp: "Capturar a DUIMP",
  configure_fiscal_profile: "Cadastrar o perfil fiscal",
  select_import_purpose: "Selecionar a finalidade",
  configure_tax_rule: "Cadastrar a regra tributária",
  resolve_context: "Completar os dados da DUIMP",
  classify_items: "Classificar a finalidade fiscal dos itens",
  create_document_plan: "Gerar o plano de notas por exportador",
  review_document_plan: "Revisar o plano de notas por exportador",
  create_child_drafts: "Gerar os rascunhos das NF-e filhas",
  create_draft: "Gerar o rascunho da NF-e",
  configure_number_sequence: "Configurar a sequência numérica",
  configure_provider_connection: "Configurar o Portal Único",
  correct_draft: "Corrigir as divergências do rascunho",
  correct_child_drafts: "Corrigir as divergências das NF-e filhas",
  generate_child_xmls: "Gerar e validar os XMLs das NF-e filhas",
  validate_child_xmls: "Validar novamente os XMLs das NF-e filhas",
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

const contextFieldLabels: Record<string, string> = {
  clearance_location: "Local de desembaraço",
  clearance_state: "UF do desembaraço",
  clearance_date: "Data de desembaraço",
  transport_mode_code: "Via de transporte",
  "foreign_supplier.country_code": "Código BACEN do país do exportador",
  "foreign_supplier.country_name": "Nome do país do exportador",
  "client.fiscal_profile": "Perfil fiscal do cliente",
  tax_configuration: "Regra tributária",
};

const primaryActionLabels: Record<string, string> = {
  fetch_duimp: "Importar DUIMP",
  configure_fiscal_profile: "Cadastrar perfil fiscal",
  configure_tax_rule: "Cadastrar regra tributária",
  configure_number_sequence: "Configurar sequência numérica",
  configure_provider_connection: "Configurar Portal Único",
  resolve_context: "Completar dados da importação",
  classify_items: "Classificar itens",
  create_document_plan: "Gerar plano de notas",
  review_document_plan: "Revisar plano de notas",
  create_child_drafts: "Gerar rascunhos das filhas",
  create_draft: "Gerar rascunho da NF-e",
  correct_draft: "Revisar divergências",
  correct_child_drafts: "Revisar filhas com divergências",
  generate_child_xmls: "Gerar e validar XMLs",
  validate_child_xmls: "Validar XMLs novamente",
  generate_access_key: "Gerar chave e XML",
  generate_xml: "Gerar XML",
  validate_xml: "Validar XML",
  completed: "Baixar XML validado",
};

function contextValue(
  context: NfeWorkflowState["context"],
  field: string,
) {
  const value = context?.fields?.[field]?.value;
  return value === null || value === undefined ? "" : String(value);
}

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

function issueLocation(issue: Record<string, unknown>) {
  const line = issue.line ? `linha ${issue.line}` : "";
  const column = issue.column ? `coluna ${issue.column}` : "";
  return [line, column].filter(Boolean).join(", ");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function nestedText(value: unknown, ...path: string[]) {
  let current: unknown = value;
  for (const key of path) current = asRecord(current)[key];
  return current === null || current === undefined ? "" : String(current);
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

export function NfeWorkflowOverview({ processId }: { processId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const series = "1";
  const [refreshDuimp, setRefreshDuimp] = useState(false);
  const [newDraftOpen, setNewDraftOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [pendingSheetOpen, setPendingSheetOpen] = useState(false);
  const [setupAction, setSetupAction] = useState<string | null>(null);
  const [correctionDetail, setCorrectionDetail] = useState<NfeDraftDetailResponse | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const workflow = useNfeWorkflowState(processId);
  const drafts = useNfeDrafts(processId);
  const snapshots = useDuimpSnapshots(processId);
  const requestedStep = searchParams.get("step");

  useEffect(() => {
    const workflowData = workflow.data;
    if (!workflowData?.steps?.length) return;
    const requested = workflowData.steps.find(
      (step) => step.key === requestedStep && step.can_view,
    );
    const target = requested?.key || workflowData.current_step;
    if (requestedStep === target) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", target);
    router.replace(
      "/nfe/processes/" + processId + "?" + params.toString(),
      { scroll: false },
    );
  }, [processId, requestedStep, router, searchParams, workflow.data]);

  if (workflow.isLoading) {
    return <div className="flex min-h-80 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" /> Carregando o fluxo…</div>;
  }
  if (workflow.error || !workflow.data) {
    return <div className="p-8"><Alert variant="destructive"><CircleAlert /><AlertTitle>Não foi possível abrir o processo</AlertTitle><AlertDescription>Confira se ele pertence à sua organização e tente novamente.</AlertDescription></Alert></div>;
  }

  const data = workflow.data;
  const draftItems = drafts.data?.items ?? [];
  const snapshotItems = snapshots.data ?? [];
  const workflowSteps = data.steps;
  const requestedWorkflowStep = workflowSteps.find(
    (step) => step.key === requestedStep && step.can_view,
  );
  const activeStep = (
    requestedWorkflowStep?.key || data.current_step
  ) as NfeWorkflowStepKey;
  const activeStepIndex = workflowSteps.findIndex(
    (step) => step.key === activeStep,
  );
  const currentStepIndex = workflowSteps.findIndex(
    (step) => step.key === data.current_step,
  );
  const previousStep = [...workflowSteps]
    .slice(0, activeStepIndex)
    .reverse()
    .find((step) => step.can_view);
  const nextStep = workflowSteps[activeStepIndex + 1];
  const accessibleNextStep = nextStep?.can_view ? nextStep : null;

  function goToStep(step: NfeWorkflowStepKey) {
    const target = workflowSteps.find(
      (candidate) => candidate.key === step && candidate.can_view,
    );
    if (!target) {
      toast.info("Conclua a etapa atual antes de avançar.");
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", target.key);
    router.replace(
      "/nfe/processes/" + processId + "?" + params.toString(),
      { scroll: false },
    );
  }
  const canCreateDraft = Boolean(
    data.latest_snapshot &&
    data.prerequisites.has_fiscal_profile &&
    data.prerequisites.has_active_tax_rule &&
    data.prerequisites.item_classification_ready &&
    data.prerequisites.has_document_plan &&
    data.prerequisites.planned_documents_count === 1 &&
    data.context?.ready_for_draft,
  );
  const latestDraft = draftItems[0];
  const latestXml = latestDraft?.xml_versions[0];
  const primaryActionLabel = primaryActionLabels[data.next_action];
  const primaryActionSupported = Boolean(
    primaryActionLabel &&
    (
      data.next_action === "resolve_context" ||
      data.next_action === "fetch_duimp" ||
      data.next_action === "configure_fiscal_profile" ||
      data.next_action === "configure_tax_rule" ||
      data.next_action === "configure_number_sequence" ||
      data.next_action === "configure_provider_connection" ||
      data.next_action === "classify_items" ||
      data.next_action === "create_document_plan" ||
      data.next_action === "review_document_plan" ||
      data.next_action === "create_child_drafts" ||
      data.next_action === "create_draft" ||
      data.next_action === "correct_child_drafts" ||
      data.next_action === "generate_child_xmls" ||
      data.next_action === "validate_child_xmls" ||
      (data.next_action === "correct_draft" && latestDraft) ||
      (["generate_access_key", "generate_xml", "validate_xml"].includes(data.next_action) && latestDraft) ||
      (data.next_action === "completed" && latestDraft && latestXml)
    ),
  );
  const correctionPayload = correctionDetail?.draft.fiscal_payload || {};
  const correctionErrors = correctionDetail?.draft.validation_errors || [];
  const correctionWarnings = correctionDetail?.draft.validation_warnings || [];

  async function captureDuimp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const duimpNumber = String(form.get("duimp_number") || "").replace(/\s/g, "").toUpperCase();
    if (!duimpNumber) return;
    setBusyAction("fetch-duimp");
    try {
      await nfeApi.updateProcess(processId, { duimp_number: duimpNumber });
      await nfeApi.fetchDuimp(processId);
      await Promise.all([workflow.mutate(), snapshots.mutate(), drafts.mutate()]);
      toast.success("DUIMP importada do Portal Único. O contexto fiscal foi liberado.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function createNewDraft() {
    if (!canCreateDraft) {
      toast.info("Resolva os pré-requisitos e pendências fiscais antes de criar outro rascunho.");
      return;
    }
    setBusyAction("new-draft");
    try {
      let snapshotId = data.latest_snapshot?.id;
      if (refreshDuimp) {
        const refreshed = await nfeApi.fetchDuimp(processId);
        snapshotId = refreshed.snapshot.id;
      }
      await nfeApi.createDraft(processId, {
        series,
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
      const xsdValidation = await nfeApi.validateXml(draft.id, version.id);
      await Promise.all([workflow.mutate(), drafts.mutate()]);
      if (!xsdValidation.valid) {
        const firstError = xsdValidation.errors?.[0]
          ? issueLabel(xsdValidation.errors[0])
          : "Consulte os erros apresentados na versão do XML.";
        toast.error(`XML v${version.version_number} gerado, mas reprovado no XSD: ${firstError}`);
        document.getElementById(`xml-version-${version.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      toast.success(`XML v${version.version_number} gerado e aprovado no XSD.`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function openDraftCorrection(draft: NfeDraftSummary) {
    setBusyAction(`load-correction:${draft.id}`);
    try {
      const detail = await nfeApi.getDraft(draft.id);
      setCorrectionDetail(detail);
      setCorrectionOpen(true);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function saveDraftCorrections(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!correctionDetail) return;

    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    const address = Object.fromEntries(
      ["street", "number", "complement", "district", "city_name"]
        .map((field) => [field, value(`supplier_${field}`)])
        .filter(([, fieldValue]) => fieldValue),
    );
    const carrier = Object.fromEntries(
      ["tax_id", "name", "state_registration", "address", "city_name", "state"]
        .map((field) => [field, value(`carrier_${field}`)])
        .filter(([, fieldValue]) => fieldValue),
    );
    const volumeEntries: Array<[string, string | number]> = [];
    const volumeQuantity = value("volume_quantity");
    if (volumeQuantity) volumeEntries.push(["quantity", Number(volumeQuantity)]);
    for (const field of ["species", "brand", "numbering", "net_weight", "gross_weight"]) {
      const fieldValue = value(`volume_${field}`);
      if (fieldValue) volumeEntries.push([field, fieldValue]);
    }

    const supplierLegalName = value("supplier_legal_name");
    const supplierForeignId = value("supplier_foreign_id");
    const supplierCountryIso = value("supplier_country_iso_alpha_2").toUpperCase();
    const payload: UpdateNfeDraftPayload = {
      issuer: {
        state_registration: value("issuer_state_registration"),
      },
      foreign_supplier: {
        ...(supplierLegalName ? { legal_name: supplierLegalName } : {}),
        foreign_id: supplierForeignId || null,
        country_code: value("supplier_country_code"),
        country_name: value("supplier_country_name"),
        ...(supplierCountryIso ? { country_iso_alpha_2: supplierCountryIso } : {}),
        ...(Object.keys(address).length ? { address } : {}),
      },
      transport: {
        freight_mode: value("freight_mode"),
        ...(Object.keys(carrier).length ? { carrier } : {}),
        ...(volumeEntries.length ? { volume: Object.fromEntries(volumeEntries) } : {}),
      },
      additional_info: {
        automatic_summary: true,
        legal_text: value("legal_text"),
      },
    };

    setBusyAction(`save-correction:${correctionDetail.draft.id}`);
    try {
      const result = await nfeApi.updateDraft(correctionDetail.draft.id, payload);
      await Promise.all([workflow.mutate(), drafts.mutate()]);
      if (result.validation.valid) {
        setCorrectionOpen(false);
        setCorrectionDetail(null);
        toast.success(
          result.requires_new_xml
            ? "Dados atualizados. A versão XML anterior foi preservada; gere uma nova versão."
            : "Rascunho corrigido e validado. A geração do XML foi liberada.",
        );
      } else {
        const detail = await nfeApi.getDraft(correctionDetail.draft.id);
        setCorrectionDetail(detail);
        toast.info(`Ainda existem ${result.validation.errors?.length || 0} correção(ões) obrigatória(s).`);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function validateExistingXml(
    draftId: string,
    version: NfeXmlVersionSummary,
  ) {
    setBusyAction(`validate-xml:${version.id}`);
    try {
      const result = await nfeApi.validateXml(draftId, version.id);
      await Promise.all([workflow.mutate(), drafts.mutate()]);
      if (!result.valid) {
        const firstError = result.errors?.[0]
          ? issueLabel(result.errors[0])
          : "Consulte os erros apresentados abaixo da versão do XML.";
        toast.error(`XML reprovado no XSD: ${firstError}`);
        document.getElementById(`xml-version-${version.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
      toast.success("XML aprovado no XSD oficial da NF-e 4.00.");
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
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


  async function resolveContext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data.latest_snapshot) return;

    const form = new FormData(event.currentTarget);
    const overrides: Record<string, unknown> = {};
    const directFields = [
      "clearance_location",
      "clearance_state",
      "clearance_date",
      "transport_mode_code",
    ];

    for (const field of directFields) {
      const value = String(form.get(field) || "").trim();
      if (value) overrides[field] = field === "clearance_state" ? value.toUpperCase() : value;
    }

    const countryCode = String(form.get("foreign_supplier_country_code") || "").trim();
    const countryName = String(form.get("foreign_supplier_country_name") || "").trim();
    if (countryCode || countryName) {
      overrides.foreign_supplier = {
        ...(countryCode ? { country_code: countryCode } : {}),
        ...(countryName ? { country_name: countryName } : {}),
      };
    }

    setBusyAction("resolve-context");
    try {
      const result = await nfeApi.resolveContext(processId, {
        duimp_snapshot_id: data.latest_snapshot.id,
        refresh_external: true,
        overrides,
      });
      await Promise.all([workflow.mutate(), snapshots.mutate()]);
      if (result.ready_for_draft) {
        setContextOpen(false);
        toast.success("Dados da importação completos. O rascunho já pode ser gerado.");
      } else {
        toast.info(`Ainda existem ${result.missing_fields.length} pendência(s) para completar.`);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function retryAutomaticContext() {
    if (!data.latest_snapshot) return;
    setBusyAction("refresh-context");
    try {
      const result = await nfeApi.resolveContext(processId, {
        duimp_snapshot_id: data.latest_snapshot.id,
        refresh_external: true,
        overrides: {},
      });
      await Promise.all([workflow.mutate(), snapshots.mutate()]);
      if (result.ready_for_draft) {
        setContextOpen(false);
        toast.success("Portal Único completou os dados necessários.");
      } else {
        toast.info("A consulta terminou, mas alguns campos ainda precisam ser informados.");
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function generateDocumentPlan() {
    if (!data.latest_snapshot) return;
    setBusyAction("document-plan");
    try {
      const plan = await nfeApi.createDocumentPlan(processId, {
        duimp_snapshot_id: data.latest_snapshot.id,
      });
      await workflow.mutate();
      toast.success(
        plan.documents.length > 1
          ? `Plano criado com ${plan.documents.length} NF-e filhas, uma por exportador.`
          : "Plano criado. A geração do rascunho da NF-e foi liberada.",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function generateChildDrafts() {
    if (!data.latest_snapshot) return;
    setBusyAction("child-drafts");
    try {
      const result = await nfeApi.generateChildDrafts(processId, {
        duimp_snapshot_id: data.latest_snapshot.id,
        series,
      });
      await Promise.all([workflow.mutate(), drafts.mutate()]);
      toast.success(
        result.created_draft_ids.length
          ? `${result.created_draft_ids.length} rascunho(s) de NF-e filha criado(s).`
          : "Os rascunhos das NF-e filhas já estavam disponíveis.",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function generateChildXmls() {
    if (!data.latest_snapshot) return;
    setBusyAction("child-xmls");
    try {
      const result = await nfeApi.generateChildXmls(processId, data.latest_snapshot.id);
      await Promise.all([workflow.mutate(), drafts.mutate()]);
      if (result.all_valid) {
        toast.success(`${result.results.length} XML(s) gerado(s) e aprovado(s) no XSD.`);
        return;
      }
      const failures = result.results.filter((item) => !item.success);
      toast.info(`${failures.length} NF-e filha(s) ainda exigem correção ou nova validação.`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function downloadChildXmls() {
    if (!data.latest_snapshot) return;
    setBusyAction("child-download");
    try {
      const file = await nfeApi.downloadChildXmls(processId, data.latest_snapshot.id);
      saveBlob(file.blob, file.filename);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function continueWorkflow() {
    if (data.next_action === "fetch_duimp") {
      goToStep("duimp");
      document.getElementById("duimp-import")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (data.next_action === "classify_items") {
      document.getElementById("item-classification")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (data.next_action === "resolve_context") {
      setContextOpen(true);
      return;
    }
    if (data.next_action === "create_document_plan") {
      await generateDocumentPlan();
      return;
    }
    if (data.next_action === "review_document_plan") {
      goToStep("planning");
      document.getElementById("document-plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (data.next_action === "create_child_drafts") {
      await generateChildDrafts();
      return;
    }
    if (data.next_action === "create_draft") {
      setNewDraftOpen(true);
      return;
    }
    if (data.next_action === "correct_draft" && latestDraft) {
      await openDraftCorrection(latestDraft);
      return;
    }
    if (data.next_action === "correct_child_drafts") {
      const draftWithErrors = draftItems.find((draft) => draft.validation_errors.length > 0);
      if (draftWithErrors) await openDraftCorrection(draftWithErrors);
      return;
    }
    if (["generate_child_xmls", "validate_child_xmls"].includes(data.next_action)) {
      await generateChildXmls();
      return;
    }
    if (data.next_action === "validate_xml" && latestDraft && latestXml) {
      await validateExistingXml(latestDraft.id, latestXml);
      return;
    }
    if (
      ["generate_access_key", "generate_xml"].includes(data.next_action) &&
      latestDraft
    ) {
      await generateDiagnosticXml(latestDraft);
      return;
    }
    if (data.next_action === "completed" && data.document_plan?.documents.length && data.document_plan.documents.length > 1) {
      await downloadChildXmls();
      return;
    }
    if (data.next_action === "completed" && latestDraft && latestXml) {
      await downloadXml(latestDraft.id, latestXml.id);
    }
  }

  const sheetActions = [
    "configure_fiscal_profile",
    "configure_tax_rule",
    "configure_number_sequence",
    "configure_provider_connection",
    "resolve_context",
    "classify_items",
    "correct_draft",
    "review_document_plan",
  ];

  async function triggerPrimaryAction() {
    if (sheetActions.includes(data.next_action)) {
      setSetupAction(null);
      setPendingSheetOpen(true);
      return;
    }
    await continueWorkflow();
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <Button variant="ghost" asChild><Link href="/nfe/processes"><ChevronLeft /> Voltar aos processos</Link></Button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{data.process.reference_code}</p>
          <h1 className="text-2xl font-semibold">{data.process.duimp_number ? `DUIMP ${data.process.duimp_number}` : (data.process.importer?.name || data.process.importer?.legal_name || "Processo de NF-e")}</h1>
          <p className="text-sm text-muted-foreground">{data.process.importer?.cnpj}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={data.next_action === "completed" ? "default" : "secondary"}>{actionLabels[data.next_action] || data.next_action}</Badge>
          {primaryActionSupported && (
            <Button onClick={() => void triggerPrimaryAction()} disabled={Boolean(busyAction)}>
              {busyAction && <Loader2 className="animate-spin" />}
              {primaryActionLabel}
            </Button>
          )}
          {data.next_action !== "create_draft" && (
            <Button variant="outline" onClick={() => setNewDraftOpen(true)} disabled={!canCreateDraft || Boolean(busyAction)}><Plus /> Novo rascunho</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Etapas da emissão</CardTitle>
          <CardDescription>
            Consulte etapas concluídas e avance somente quando os pré-requisitos estiverem resolvidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={((currentStepIndex + 1) / workflowSteps.length) * 100} />
          <nav aria-label="Etapas da emissão" className="flex gap-2 overflow-x-auto pb-1">
            {workflowSteps.map((step, index) => {
              const selected = step.key === activeStep;
              const completed = step.status === "completed";
              return (
                <button
                  key={step.key}
                  type="button"
                  disabled={!step.can_view}
                  onClick={() => goToStep(step.key)}
                  aria-current={selected ? "step" : undefined}
                  title={!step.can_view ? "Conclua a etapa atual para liberar esta seção." : step.label}
                  className={[
                    "flex min-w-[145px] items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : step.can_view
                        ? "hover:border-primary/40 hover:bg-muted/40"
                        : "cursor-not-allowed bg-muted/30 text-muted-foreground",
                  ].join(" ")}
                >
                  <span className={[
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    completed || selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}>
                    {completed ? <Check className="size-3.5" /> : !step.can_view ? <LockKeyhole className="size-3.5" /> : index + 1}
                  </span>
                  <span>
                    <span className="block text-xs text-muted-foreground">Etapa {index + 1}</span>
                    <strong className="whitespace-nowrap">{step.label}</strong>
                  </span>
                </button>
              );
            })}
          </nav>
        </CardContent>
      </Card>

      {activeStep === "client" && (
        <Card>
          <CardHeader><CardTitle>Configuração do cliente</CardTitle><CardDescription>Revise os cadastros reutilizados nas notas deste cliente antes de importar a DUIMP.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ["Perfil fiscal", data.prerequisites.has_fiscal_profile, "configure_fiscal_profile"],
              ["Regra tributária", data.prerequisites.has_active_tax_rule, "configure_tax_rule"],
              ["Sequência numérica", data.prerequisites.has_number_sequence, "configure_number_sequence"],
              ["Portal Único", data.prerequisites.has_provider_connection, "configure_provider_connection"],
            ].map(([label, ready, action]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-lg border p-4">
                <div><span className="block text-sm font-medium">{label}</span><span className={`text-xs font-medium ${ready ? "text-emerald-700" : "text-amber-700"}`}>{ready ? "Configurado" : "Pendente"}</span></div>
                <Button type="button" size="sm" variant="outline" onClick={() => { setSetupAction(String(action)); setPendingSheetOpen(true); }}>{ready ? "Revisar" : "Configurar"}</Button>
              </div>
            ))}
            {data.current_step === "client" && primaryActionSupported && (
              <Button className="sm:col-span-2" onClick={() => void triggerPrimaryAction()} disabled={Boolean(busyAction)}>{primaryActionLabel}</Button>
            )}
          </CardContent>
        </Card>
      )}

      {activeStep === "duimp" && (
        data.latest_snapshot ? <NfeDuimpOverview snapshots={snapshotItems} /> : (
          <Card id="duimp-import">
            <CardHeader><CardTitle>Importar DUIMP do Portal Único</CardTitle><CardDescription>Informe o número da declaração para capturar e normalizar os dados que alimentarão as próximas etapas.</CardDescription></CardHeader>
            <CardContent>
              <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={captureDuimp}>
                <div className="flex-1 space-y-1.5"><Label htmlFor="duimp_number">Número da DUIMP</Label><Input id="duimp_number" name="duimp_number" defaultValue={data.process.duimp_number || ""} placeholder="26BR0000000000-1" required /></div>
                <Button disabled={Boolean(busyAction)}>{busyAction === "fetch-duimp" && <Loader2 className="animate-spin" />} Importar DUIMP</Button>
              </form>
            </CardContent>
          </Card>
        )
      )}

      {activeStep === "context" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Contexto fiscal da importação</CardTitle>
                <CardDescription>
                  Dados utilizados para selecionar regras e preparar os documentos fiscais.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setContextOpen(true)}>
                <PencilLine /> Editar dados
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><p className="text-xs text-muted-foreground">Local de desembaraço</p><strong className="text-sm">{contextValue(data.context, "clearance_location") || "Não informado"}</strong></div>
            <div><p className="text-xs text-muted-foreground">UF do desembaraço</p><strong className="text-sm">{contextValue(data.context, "clearance_state") || "Não informada"}</strong></div>
            <div><p className="text-xs text-muted-foreground">Data de desembaraço</p><strong className="text-sm">{contextValue(data.context, "clearance_date") || "Não informada"}</strong></div>
            <div><p className="text-xs text-muted-foreground">Via de transporte</p><strong className="text-sm">{contextValue(data.context, "transport_mode_code") || "Não informada"}</strong></div>
            <div><p className="text-xs text-muted-foreground">País do exportador</p><strong className="text-sm">{contextValue(data.context, "foreign_supplier.country_name") || "Não informado"}</strong></div>
            <div><p className="text-xs text-muted-foreground">Código BACEN</p><strong className="text-sm">{contextValue(data.context, "foreign_supplier.country_code") || "Não informado"}</strong></div>
          </CardContent>
        </Card>
      )}

      {activeStep === data.current_step && (
        <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
          <Card>
            <CardHeader><CardTitle>Próxima ação</CardTitle><CardDescription>{actionLabels[data.next_action] || data.next_action}</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {data.next_action === "completed" ? (
                <Alert className="border-emerald-500/30 bg-emerald-500/5"><Check /><AlertTitle>Checkpoint concluído</AlertTitle><AlertDescription>O XML não assinado foi validado. Você pode baixá-lo ou criar outro rascunho preservando o histórico.</AlertDescription></Alert>
              ) : (
                <Alert><CircleAlert /><AlertTitle>Próxima etapa disponível</AlertTitle><AlertDescription>Preencha ou confirme os dados solicitados para continuar o processo até o XML.</AlertDescription></Alert>
              )}
              {data.context?.missing_fields?.length ? <div className="flex flex-wrap gap-2">{data.context.missing_fields.map((field) => <Badge key={field} variant="outline">{contextFieldLabels[field] || field}</Badge>)}</div> : null}
              {primaryActionSupported && (
                <Button onClick={() => void triggerPrimaryAction()} disabled={Boolean(busyAction)}>
                  {busyAction && <Loader2 className="animate-spin" />}
                  {primaryActionLabel}
                </Button>
              )}
            </CardContent>
          </Card>
  
          <Card>
            <CardHeader><CardTitle className="text-base">Resumo técnico</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Snapshots DUIMP</span><strong>{snapshotItems.length}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Perfil fiscal</span><strong>{data.prerequisites.has_fiscal_profile ? "Configurado" : "Pendente"}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Regra tributária</span><strong>{data.prerequisites.has_active_tax_rule ? "Aplicada" : "Pendente"}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sequência</span><strong>{data.prerequisites.has_number_sequence ? "Configurada" : "Pendente"}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dados da importação</span><strong>{data.context?.ready_for_draft ? "Completos" : `${data.context?.missing_fields?.length || 0} pendência(s)`}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Itens classificados</span><strong>{data.item_classification ? data.item_classification.classified_count + "/" + data.item_classification.total_items : "Pendente"}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">NF-e filhas planejadas</span><strong>{data.prerequisites.planned_documents_count || 0}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Rascunhos</span><strong>{draftItems.length}</strong></div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeStep === "purposes" && data.item_classification && (
        <NfeItemClassificationPanel
          clientId={data.process.importer_id}
          processId={processId}
          state={data.item_classification}
          onSaved={async () => {
            await Promise.all([workflow.mutate(), drafts.mutate()]);
          }}
        />
      )}

      {(activeStep === "planning" || (Boolean(data.document_plan?.documents.length && data.document_plan.documents.length > 1) && ["drafts", "xml", "review"].includes(activeStep))) && (
        <NfeDocumentPlanPanel
          plan={data.document_plan}
          busyAction={busyAction}
          onGenerate={generateDocumentPlan}
          onGenerateDrafts={generateChildDrafts}
          onGenerateXmls={generateChildXmls}
          onDownloadXmls={downloadChildXmls}
        />
      )}

      {["drafts", "xml", "review"].includes(activeStep) && (
        <Card id="drafts-and-xmls">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><CardTitle>Rascunhos e XMLs</CardTitle><CardDescription>Histórico auditável; nenhuma geração substitui um XML anterior.</CardDescription></div>
              <Button variant="outline" onClick={() => void drafts.mutate()}><RefreshCw /> Atualizar</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {drafts.isLoading && <p className="text-sm text-muted-foreground">Carregando rascunhos…</p>}
            {drafts.error && <Alert variant="destructive"><CircleAlert /><AlertDescription>Não foi possível consultar o histórico de rascunhos.</AlertDescription></Alert>}
            {draftItems.map((draft, index) => (
              <div id={`draft-${draft.id}`} key={draft.id} className="rounded-xl border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Rascunho {draft.number ? `NF-e nº ${draft.number}` : `#${draftItems.length - index}`}</h3><Badge variant={draft.validation_errors.length ? "destructive" : "secondary"}>{draftStatusLabels[draft.status] || draft.status}</Badge></div>
                    <p className="mt-1 text-xs text-muted-foreground">{draft.exporter_code ? `Exportador ${draft.exporter_code} · ` : ""}Criado em {dateLabel(draft.created_at)} · {draft.items_count} itens · Série {draft.series}</p>
                    {draft.access_key && <p className="mt-1 break-all font-mono text-xs text-muted-foreground">Chave: {draft.access_key}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!["signed", "transmitted", "authorized", "cancelled"].includes(draft.status) && (
                      <Button variant={draft.validation_errors.length ? "default" : "outline"} onClick={() => void openDraftCorrection(draft)} disabled={Boolean(busyAction)}>
                        {busyAction === `load-correction:${draft.id}` ? <Loader2 className="animate-spin" /> : <PencilLine />}
                        {draft.validation_errors.length ? "Corrigir rascunho" : "Editar dados"}
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => void generateDiagnosticXml(draft)} disabled={Boolean(busyAction) || draft.validation_errors.length > 0}>
                      {busyAction === `xml:${draft.id}` ? <Loader2 className="animate-spin" /> : <FileCode2 />}
                      {draft.xml_versions.length ? "Gerar nova versão XML" : "Gerar XML diagnóstico"}
                    </Button>
                  </div>
                </div>
  
                {(draft.validation_errors.length || draft.validation_warnings.length) ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {draft.validation_errors.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-destructive">Correções obrigatórias</p>
                        {draft.validation_errors.map((issue, issueIndex) => <p key={`e-${issueIndex}`} className="rounded-md bg-destructive/5 p-2 text-xs text-destructive">{issueLabel(issue)}</p>)}
                      </div>
                    )}
                    {draft.validation_warnings.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Alertas de conferência — não bloqueiam o XML diagnóstico</p>
                        {draft.validation_warnings.slice(0, 4).map((issue, issueIndex) => <p key={`w-${issueIndex}`} className="rounded-md bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300">{issueLabel(issue)}</p>)}
                      </div>
                    )}
                  </div>
                ) : null}
  
                <div className="mt-4 space-y-2">
                  {draft.xml_versions.length === 0 && <p className="text-sm text-muted-foreground">Nenhum XML gerado para este rascunho.</p>}
                  {draft.xml_versions.map((version) => {
                    const xmlOutdated = Boolean(
                      draft.updated_at &&
                      version.generated_at &&
                      new Date(draft.updated_at).getTime() > new Date(version.generated_at).getTime()
                    );
                    const xsdApproved = version.xsd_valid === true && !xmlOutdated;
                    const xsdRejected = version.xsd_valid === false && !xmlOutdated;
                    const xsdErrors = version.xsd_errors || [];
                    return (
                      <div id={`xml-version-${version.id}`} key={version.id} className="space-y-3 rounded-lg bg-muted/50 p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <FileCode2 className="size-4" />
                            <span className="text-sm font-medium">XML {version.xml_type === "unsigned" ? "não assinado" : version.xml_type} v{version.version_number}</span>
                            <Badge variant={xsdApproved ? "default" : xsdRejected ? "destructive" : "outline"}>
                              {xmlOutdated ? "Versão anterior" : xsdApproved ? "XSD válido" : xsdRejected ? "XSD inválido" : "Ainda não validado"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {!xsdApproved && !xmlOutdated && (
                              <Button size="sm" variant={xsdRejected ? "destructive" : "outline"} onClick={() => void validateExistingXml(draft.id, version)} disabled={Boolean(busyAction)}>
                                {busyAction === `validate-xml:${version.id}` ? <Loader2 className="animate-spin" /> : <Check />}
                                {xsdRejected ? "Validar novamente" : "Validar XML"}
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => void downloadXml(draft.id, version.id)} disabled={busyAction === `download:${version.id}`}>
                              {busyAction === `download:${version.id}` ? <Loader2 className="animate-spin" /> : <Download />} Baixar XML
                            </Button>
                          </div>
                        </div>
                        {xmlOutdated && (
                          <Alert>
                            <CircleAlert />
                            <AlertTitle>XML preservado apenas para histórico</AlertTitle>
                            <AlertDescription>Os dados do rascunho foram alterados depois desta geração. Gere uma nova versão XML antes de validar ou assinar.</AlertDescription>
                          </Alert>
                        )}
                        {xsdRejected && (
                          <Alert variant="destructive">
                            <CircleAlert />
                            <AlertTitle>XML reprovado pelo XSD da NF-e 4.00</AlertTitle>
                            <AlertDescription>
                              {xsdErrors.length > 0 ? (
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                  {xsdErrors.map((issue, index) => (
                                    <li key={index}>
                                      {issueLabel(issue)}
                                      {issueLocation(issue) ? <span className="text-muted-foreground"> — {issueLocation(issue)}</span> : null}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                "A API marcou esta versão como inválida, mas não retornou detalhes do XSD."
                              )}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {!drafts.isLoading && draftItems.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Ainda não há rascunhos para este processo.</p>}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col-reverse gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          disabled={!previousStep}
          onClick={() => previousStep && goToStep(previousStep.key)}
        >
          <ChevronLeft /> {previousStep ? previousStep.label : "Etapa anterior"}
        </Button>
        <div className="text-center text-xs text-muted-foreground">
          Visualizando {workflowSteps[activeStepIndex]?.label}
        </div>
        <Button
          variant={accessibleNextStep ? "default" : "outline"}
          disabled={!accessibleNextStep}
          onClick={() => accessibleNextStep && goToStep(accessibleNextStep.key)}
        >
          {accessibleNextStep
            ? "Avançar para " + accessibleNextStep.label
            : nextStep
              ? "Próxima etapa bloqueada"
              : "Última etapa"}
          <ChevronRight />
        </Button>
      </div>

      <Dialog open={contextOpen} onOpenChange={setContextOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Completar dados da importação</DialogTitle>
            <DialogDescription>O sistema consulta novamente o Portal Único e registra como intervenção do operador somente os campos preenchidos abaixo.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={resolveContext}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="clearance_location">Local de desembaraço</Label><Input id="clearance_location" name="clearance_location" defaultValue={contextValue(data.context, "clearance_location")} required={data.context?.missing_fields.includes("clearance_location")} placeholder="Ex.: ALF/PORTO DE ITAJAI" /></div>
              <div className="space-y-1.5"><Label htmlFor="clearance_state">UF do desembaraço</Label><Input id="clearance_state" name="clearance_state" defaultValue={contextValue(data.context, "clearance_state")} required={data.context?.missing_fields.includes("clearance_state")} maxLength={2} placeholder="SC" /></div>
              <div className="space-y-1.5"><Label htmlFor="clearance_date">Data de desembaraço</Label><Input id="clearance_date" name="clearance_date" type="date" defaultValue={contextValue(data.context, "clearance_date").slice(0, 10)} required={data.context?.missing_fields.includes("clearance_date")} /></div>
              <div className="space-y-1.5"><Label htmlFor="transport_mode_code">Código da via de transporte</Label><Input id="transport_mode_code" name="transport_mode_code" defaultValue={contextValue(data.context, "transport_mode_code")} required={data.context?.missing_fields.includes("transport_mode_code")} placeholder="Ex.: 4 para aérea" /></div>
              <div className="space-y-1.5"><Label htmlFor="foreign_supplier_country_code">Código BACEN do país do exportador</Label><Input id="foreign_supplier_country_code" name="foreign_supplier_country_code" defaultValue={contextValue(data.context, "foreign_supplier.country_code")} required={data.context?.missing_fields.includes("foreign_supplier.country_code")} placeholder="Ex.: 2496" /></div>
              <div className="space-y-1.5"><Label htmlFor="foreign_supplier_country_name">Nome do país do exportador</Label><Input id="foreign_supplier_country_name" name="foreign_supplier_country_name" defaultValue={contextValue(data.context, "foreign_supplier.country_name")} required={data.context?.missing_fields.includes("foreign_supplier.country_name")} placeholder="Ex.: ESTADOS UNIDOS" /></div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => void retryAutomaticContext()} disabled={Boolean(busyAction)}>
                {busyAction === "refresh-context" && <Loader2 className="animate-spin" />} Consultar novamente
              </Button>
              <Button type="submit" disabled={Boolean(busyAction)}>
                {busyAction === "resolve-context" && <Loader2 className="animate-spin" />} Salvar e continuar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <NfeWorkflowPendingSheet
        open={pendingSheetOpen}
        onOpenChange={(open) => { setPendingSheetOpen(open); if (!open) setSetupAction(null); }}
        workflow={data}
        actionOverride={setupAction}
        series={series}
        onResolved={async () => {
          await Promise.all([workflow.mutate(), drafts.mutate(), snapshots.mutate()]);
        }}
        onContinue={async () => {
          setPendingSheetOpen(false);
          await continueWorkflow();
        }}
      />

      <Dialog open={correctionOpen} onOpenChange={(open) => {
        setCorrectionOpen(open);
        if (!open) setCorrectionDetail(null);
      }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Corrigir rascunho da NF-e</DialogTitle>
            <DialogDescription>
              Revise os dados do rascunho em qualquer etapa anterior à assinatura. Se já houver XML, ele será preservado no histórico e uma nova versão deverá ser gerada.
            </DialogDescription>
          </DialogHeader>
          {correctionDetail && (
            <form className="space-y-6" onSubmit={saveDraftCorrections}>
              {correctionErrors.length > 0 && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertTitle>{correctionErrors.length} correção(ões) obrigatória(s)</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {correctionErrors.map((issue, index) => <li key={index}>{issueLabel(issue)}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <section className="space-y-3">
                <div>
                  <h3 className="font-semibold">Emitente da NF-e</h3>
                  <p className="text-xs text-muted-foreground">A inscrição estadual não deve receber o CNPJ. Informe ISENTO ou de 2 a 14 dígitos, conforme o cadastro fiscal do emitente.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor="issuer_cnpj">CNPJ do emitente</Label><Input id="issuer_cnpj" value={nestedText(correctionPayload, "issuer", "cnpj")} disabled /></div>
                  <div className="space-y-1.5"><Label htmlFor="issuer_state_registration">Inscrição estadual do emitente</Label><Input id="issuer_state_registration" name="issuer_state_registration" defaultValue={nestedText(correctionPayload, "issuer", "state_registration")} required placeholder="Somente números ou ISENTO" /></div>
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="font-semibold">Exportador estrangeiro</h3>
                  <p className="text-xs text-muted-foreground">O código BACEN e o nome do país são obrigatórios para o XML.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="supplier_legal_name">Nome do exportador</Label><Input id="supplier_legal_name" name="supplier_legal_name" defaultValue={nestedText(correctionPayload, "recipient", "legal_name")} /></div>
                  <div className="space-y-1.5"><Label htmlFor="supplier_country_code">Código BACEN do país</Label><Input id="supplier_country_code" name="supplier_country_code" defaultValue={nestedText(correctionPayload, "recipient", "address", "country_code")} required /></div>
                  <div className="space-y-1.5"><Label htmlFor="supplier_country_name">Nome do país</Label><Input id="supplier_country_name" name="supplier_country_name" defaultValue={nestedText(correctionPayload, "recipient", "address", "country_name")} required /></div>
                  <div className="space-y-1.5"><Label htmlFor="supplier_country_iso_alpha_2">ISO do país</Label><Input id="supplier_country_iso_alpha_2" name="supplier_country_iso_alpha_2" defaultValue={nestedText(correctionPayload, "recipient", "address", "country_iso_alpha_2")} maxLength={2} placeholder="US" /></div>
                  <div className="space-y-1.5"><Label htmlFor="supplier_foreign_id">Identificador estrangeiro</Label><Input id="supplier_foreign_id" name="supplier_foreign_id" defaultValue={nestedText(correctionPayload, "recipient", "foreign_id")} placeholder="Deixe em branco quando não existir" /><p className="text-xs text-muted-foreground">Ao deixar em branco, o campo idEstrangeiro será removido do próximo XML.</p></div>
                  <div className="space-y-1.5"><Label htmlFor="supplier_street">Endereço</Label><Input id="supplier_street" name="supplier_street" defaultValue={nestedText(correctionPayload, "recipient", "address", "street")} /></div>
                  <div className="space-y-1.5"><Label htmlFor="supplier_number">Número</Label><Input id="supplier_number" name="supplier_number" defaultValue={nestedText(correctionPayload, "recipient", "address", "number")} /></div>
                  <div className="space-y-1.5"><Label htmlFor="supplier_district">Bairro/distrito</Label><Input id="supplier_district" name="supplier_district" defaultValue={nestedText(correctionPayload, "recipient", "address", "district")} /></div>
                  <div className="space-y-1.5"><Label htmlFor="supplier_city_name">Cidade</Label><Input id="supplier_city_name" name="supplier_city_name" defaultValue={nestedText(correctionPayload, "recipient", "address", "city_name")} /></div>
                  <input type="hidden" name="supplier_complement" value={nestedText(correctionPayload, "recipient", "address", "complement")} />
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="font-semibold">Transporte e volumes</h3>
                  <p className="text-xs text-muted-foreground">Estes campos atendem aos alertas de transportadora e volumes exibidos no rascunho.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="freight_mode">Modalidade do frete</Label>
                    <select id="freight_mode" name="freight_mode" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue={nestedText(correctionPayload, "transport", "freight_mode") || "9"}>
                      <option value="0">0 — Por conta do emitente</option>
                      <option value="1">1 — Por conta do destinatário</option>
                      <option value="2">2 — Por conta de terceiros</option>
                      <option value="3">3 — Transporte próprio do emitente</option>
                      <option value="4">4 — Transporte próprio do destinatário</option>
                      <option value="9">9 — Sem ocorrência de transporte</option>
                    </select>
                  </div>
                  <div className="space-y-1.5"><Label htmlFor="carrier_name">Transportadora</Label><Input id="carrier_name" name="carrier_name" defaultValue={nestedText(correctionPayload, "transport", "carrier", "name")} /></div>
                  <div className="space-y-1.5"><Label htmlFor="carrier_tax_id">CNPJ/CPF da transportadora</Label><Input id="carrier_tax_id" name="carrier_tax_id" defaultValue={nestedText(correctionPayload, "transport", "carrier", "tax_id")} /></div>
                  <div className="space-y-1.5"><Label htmlFor="carrier_state_registration">Inscrição estadual</Label><Input id="carrier_state_registration" name="carrier_state_registration" defaultValue={nestedText(correctionPayload, "transport", "carrier", "state_registration")} /></div>
                  <div className="space-y-1.5"><Label htmlFor="carrier_address">Endereço da transportadora</Label><Input id="carrier_address" name="carrier_address" defaultValue={nestedText(correctionPayload, "transport", "carrier", "address")} /></div>
                  <div className="space-y-1.5"><Label htmlFor="carrier_city_name">Município</Label><Input id="carrier_city_name" name="carrier_city_name" defaultValue={nestedText(correctionPayload, "transport", "carrier", "city_name")} /></div>
                  <div className="space-y-1.5"><Label htmlFor="carrier_state">UF</Label><Input id="carrier_state" name="carrier_state" defaultValue={nestedText(correctionPayload, "transport", "carrier", "state")} maxLength={2} /></div>
                  <div className="space-y-1.5"><Label htmlFor="volume_quantity">Quantidade de volumes</Label><Input id="volume_quantity" name="volume_quantity" type="number" min={1} defaultValue={nestedText(correctionPayload, "transport", "volume", "quantity")} /></div>
                  <div className="space-y-1.5"><Label htmlFor="volume_species">Espécie</Label><Input id="volume_species" name="volume_species" defaultValue={nestedText(correctionPayload, "transport", "volume", "species")} placeholder="Ex.: CAIXA" /></div>
                  <div className="space-y-1.5"><Label htmlFor="volume_gross_weight">Peso bruto</Label><Input id="volume_gross_weight" name="volume_gross_weight" inputMode="decimal" defaultValue={nestedText(correctionPayload, "transport", "volume", "gross_weight")} /></div>
                  <div className="space-y-1.5"><Label htmlFor="volume_net_weight">Peso líquido</Label><Input id="volume_net_weight" name="volume_net_weight" inputMode="decimal" defaultValue={nestedText(correctionPayload, "transport", "volume", "net_weight")} /></div>
                  <input type="hidden" name="volume_brand" value={nestedText(correctionPayload, "transport", "volume", "brand")} />
                  <input type="hidden" name="volume_numbering" value={nestedText(correctionPayload, "transport", "volume", "numbering")} />
                </div>
              </section>

              <section className="space-y-2">
                <Label htmlFor="legal_text">Fundamentação legal/TTD nas informações complementares</Label>
                <textarea id="legal_text" name="legal_text" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" defaultValue={nestedText(correctionPayload, "additional_info", "fiscal")} />
              </section>

              {correctionWarnings.length > 0 && (
                <Alert>
                  <CircleAlert />
                  <AlertTitle>Alertas de conferência</AlertTitle>
                  <AlertDescription>Esses alertas permanecem para revisão fiscal, mas não bloqueiam a geração do XML diagnóstico quando não houver erros obrigatórios.</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setCorrectionOpen(false)} disabled={Boolean(busyAction)}>Cancelar</Button>
                <Button type="submit" disabled={Boolean(busyAction)}>
                  {busyAction === `save-correction:${correctionDetail.draft.id}` && <Loader2 className="animate-spin" />}
                  Salvar, validar e continuar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={newDraftOpen} onOpenChange={setNewDraftOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar novo rascunho</DialogTitle><DialogDescription>A versão anterior e seus XMLs continuarão disponíveis.</DialogDescription></DialogHeader>
          <p className="text-sm text-muted-foreground">As finalidades e os CFOPs serão reaproveitados da classificação item a item já salva.</p>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm"><input className="mt-1" type="checkbox" checked={refreshDuimp} onChange={(event) => setRefreshDuimp(event.target.checked)} /><span><strong className="block">Atualizar a DUIMP antes de criar</strong><span className="text-muted-foreground">Use somente quando precisar recapturar. Um novo snapshot poderá exigir nova conferência dos dados da importação.</span></span></label>
          <Alert><CircleAlert /><AlertDescription>A numeração da NF-e só será reservada quando a chave de acesso for gerada.</AlertDescription></Alert>
          <Button onClick={() => void createNewDraft()} disabled={busyAction === "new-draft"}>{busyAction === "new-draft" && <Loader2 className="animate-spin" />} Criar novo rascunho</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
