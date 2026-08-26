"use client";

import { FormEvent, useState } from "react";
import { Archive, CircleAlert, Loader2, RotateCcw, Save, Trash2 } from "lucide-react";

import { CountryReferenceSearch } from "@/components/nfe/fiscal-reference-search";
import { NfeCarrierSelector } from "@/components/nfe/nfe-carrier-selector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { nfeApi } from "@/lib/api/services/nfe";
import type { NfeDraftDetailResponse, UpdateNfeDraftPayload } from "@/lib/api/types/nfe-api";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, ...path: string[]) {
  let current: unknown = value;
  for (const key of path) current = record(current)[key];
  return current === null || current === undefined ? "" : String(current);
}

function money(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number)
    ? number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";
}

function issueLabel(issue: Record<string, unknown>) {
  return String(issue.message || issue.code || issue.field || "Revisão necessária");
}

function apiError(error: unknown) {
  const candidate = error as { response?: { data?: { message?: string } }; message?: string };
  return candidate.response?.data?.message || candidate.message || "Não foi possível salvar a alteração.";
}

const tabNames = [
  ["general", "Dados gerais"],
  ["parties", "Emitente e exportador"],
  ["items", "Itens"],
  ["taxes", "Tributos"],
  ["costs", "Importação e despesas"],
  ["transport", "Transporte e volumes"],
  ["additional", "Informações complementares"],
  ["validation", "Validação e reconciliação"],
] as const;

export function NfeDraftEditor({
  initialDetail,
  onChanged,
  onRemoved,
}: {
  initialDetail: NfeDraftDetailResponse;
  onChanged: () => Promise<void>;
  onRemoved: () => Promise<void>;
}) {
  const toast = useToast();
  const [detail, setDetail] = useState(initialDetail);
  const [busy, setBusy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const payload = detail.draft.fiscal_payload;
  const totals = record(payload.totals);
  const reconciliation = record(payload.reconciliation);
  const checks = Array.isArray(reconciliation.checks)
    ? reconciliation.checks as Array<Record<string, unknown>>
    : [];
  const immutable = ["signed", "transmitted", "authorized", "cancelled"].includes(detail.draft.status);

  async function reload() {
    const next = await nfeApi.getDraft(detail.draft.id);
    setDetail(next);
    await onChanged();
    return next;
  }

  async function saveMetadata(section: string, update: UpdateNfeDraftPayload) {
    setBusy(section);
    try {
      const result = await nfeApi.updateDraft(detail.draft.id, update);
      const next = await reload();
      toast.success(
        result.requires_new_xml
          ? "Alteração salva. Gere uma nova versão do XML para refletir os dados atuais."
          : "Alteração salva e rascunho recalculado.",
      );
      return next;
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setBusy(null);
    }
  }

  async function saveGeneral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await saveMetadata("general", {
      document: {
        operation_nature: String(form.get("operation_nature") || ""),
        presence_indicator: String(form.get("presence_indicator") || "9"),
        intermediary_indicator: String(form.get("intermediary_indicator") || "0"),
      },
    });
  }

  async function saveParties(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    await saveMetadata("parties", {
      issuer: { state_registration: value("issuer_state_registration") },
      foreign_supplier: {
        legal_name: value("supplier_legal_name"),
        foreign_id: value("supplier_foreign_id") || null,
        country_code: value("supplier_country_code"),
        country_name: value("supplier_country_name"),
        country_iso_alpha_2: value("supplier_country_iso_alpha_2").toUpperCase(),
        address: {
          street: value("supplier_street"),
          number: value("supplier_number"),
          complement: value("supplier_complement"),
          district: value("supplier_district"),
          city_name: value("supplier_city_name"),
        },
      },
    });
  }

  async function saveItem(event: FormEvent<HTMLFormElement>, itemId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    setBusy(`item:${itemId}`);
    try {
      await nfeApi.updateDraftItem(detail.draft.id, itemId, {
        product_code: value("product_code"),
        description: value("description"),
        ncm: value("ncm").replace(/\D/g, ""),
        cfop: value("cfop"),
        commercial_unit: value("commercial_unit"),
        commercial_quantity: value("commercial_quantity"),
        commercial_unit_value: value("commercial_unit_value"),
        taxable_unit: value("taxable_unit"),
        taxable_quantity: value("taxable_quantity"),
        taxable_unit_value: value("taxable_unit_value"),
        product_value: value("product_value"),
        freight_value: value("freight_value") || "0",
        insurance_value: value("insurance_value") || "0",
        discount_value: value("discount_value") || "0",
        other_value: value("other_value") || "0",
      });
      await reload();
      toast.success("Item salvo; os totais e a reconciliação foram atualizados.");
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setBusy(null);
    }
  }

  async function saveTax(event: FormEvent<HTMLFormElement>, itemId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    setBusy(`tax:${itemId}`);
    try {
      const result = await nfeApi.adjustDraftItemTax(detail.draft.id, itemId, {
        source: "manual_adjustment",
        reason: value("reason"),
        cfop: value("cfop"),
        icms: {
          cst: value("cst"),
          base: value("base"),
          rate: value("rate") || null,
          reduction_rate: value("reduction_rate") || null,
          deferment_rate: value("deferment_rate") || null,
        },
      });
      await reload();
      toast.success(
        result.requires_new_xml
          ? "Ajuste auditado. O XML anterior foi preservado; gere uma nova versão."
          : "Ajuste tributário registrado e totais recalculados.",
      );
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setBusy(null);
    }
  }

  async function restoreTax(itemId: string) {
    const reason = window.prompt("Informe o motivo para reaplicar a regra tributária (mínimo 10 caracteres):")?.trim();
    if (!reason) return;
    setBusy(`tax:${itemId}`);
    try {
      await nfeApi.adjustDraftItemTax(detail.draft.id, itemId, {
        source: "tax_rule",
        reason,
      });
      await reload();
      toast.success("Regra tributária reaplicada e operação registrada na auditoria.");
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setBusy(null);
    }
  }

  async function saveCosts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "0").trim();
    await saveMetadata("costs", {
      additional_costs: {
        afrmm: value("afrmm"),
        siscomex_fee: value("siscomex_fee"),
        thc: value("thc"),
        other: value("other"),
      },
    });
  }

  async function saveTransport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    const carrierMode = value("carrier_mode");
    const carrierId = value("registered_carrier_id");
    if (carrierMode === "registered" && !carrierId) {
      toast.info("Selecione uma transportadora cadastrada.");
      return;
    }
    const manualCarrier = Object.fromEntries(
      ["tax_id", "name", "state_registration", "address", "city_name", "state"]
        .map((field) => [field, value(`carrier_${field}`)])
        .filter(([, fieldValue]) => fieldValue),
    );
    const volumeQuantity = Number(value("volume_quantity") || 0);
    const volume: Record<string, string | number> = {
      species: value("volume_species"),
      brand: value("volume_brand"),
      numbering: value("volume_numbering"),
      net_weight: value("volume_net_weight") || "0",
      gross_weight: value("volume_gross_weight") || "0",
    };
    if (volumeQuantity > 0) volume.quantity = volumeQuantity;
    await saveMetadata("transport", {
      transport: {
        freight_mode: value("freight_mode"),
        ...(carrierMode === "registered" ? { carrier_id: carrierId } : {}),
        ...(carrierMode === "manual" ? { carrier: Object.keys(manualCarrier).length ? manualCarrier : null } : {}),
        volume,
      },
    });
  }

  async function saveAdditionalInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await saveMetadata("additional", {
      additional_info: {
        automatic_summary: false,
        fiscal: String(form.get("fiscal") || "").trim(),
        complementary: String(form.get("complementary") || "").trim(),
      },
    });
  }

  async function removeDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get("deletion_reason") || "").trim();
    const action = detail.draft.number || detail.draft.access_key ? "arquivar" : "excluir";
    if (!window.confirm(`Confirma ${action} este rascunho? Esta ação não remove o histórico fiscal.`)) return;
    setBusy("remove");
    try {
      const result = await nfeApi.removeDraft(detail.draft.id, reason);
      toast.success(result.message);
      await onRemoved();
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Série {detail.draft.series}</Badge>
        <Badge variant={detail.draft.validation_errors.length ? "destructive" : "secondary"}>
          {detail.draft.validation_errors.length ? "Com pendências" : "Validado"}
        </Badge>
        {detail.draft.access_key && <Badge variant="outline">Chave reservada</Badge>}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max flex-wrap justify-start">
            {tabNames.map(([key, label]) => <TabsTrigger key={key} value={key}>{label}</TabsTrigger>)}
          </TabsList>
        </div>

        <TabsContent value="general">
          <form className="space-y-4" onSubmit={saveGeneral}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5"><Label>Modelo</Label><Input value={text(payload, "document", "model") || "55"} disabled /></div>
              <div className="space-y-1.5"><Label>Ambiente</Label><Input value="Produção" disabled /></div>
              <div className="space-y-1.5"><Label>Número</Label><Input value={detail.draft.number || "Ainda não reservado"} disabled /></div>
              <div className="space-y-1.5 md:col-span-3"><Label htmlFor="operation_nature">Natureza da operação</Label><Input id="operation_nature" name="operation_nature" defaultValue={text(payload, "document", "operation_nature")} required /></div>
              <div className="space-y-1.5"><Label>Indicador de presença</Label><select name="presence_indicator" defaultValue={text(payload, "document", "presence_indicator") || "9"} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="0">0 — Não se aplica</option><option value="9">9 — Outros</option></select></div>
              <div className="space-y-1.5"><Label>Intermediador</Label><select name="intermediary_indicator" defaultValue={text(payload, "document", "intermediary_indicator") || "0"} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="0">0 — Sem intermediador</option><option value="1">1 — Com intermediador</option></select></div>
            </div>
            <Button disabled={immutable || busy === "general"}>{busy === "general" && <Loader2 className="animate-spin" />}<Save /> Salvar dados gerais</Button>
          </form>
        </TabsContent>

        <TabsContent value="parties">
          <form className="space-y-6" onSubmit={saveParties}>
            <section className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label>CNPJ do emitente</Label><Input value={text(payload, "issuer", "cnpj")} disabled /></div>
              <div className="space-y-1.5"><Label>Inscrição estadual</Label><Input name="issuer_state_registration" defaultValue={text(payload, "issuer", "state_registration")} required /></div>
            </section>
            <section className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2"><Label>Exportador</Label><Input name="supplier_legal_name" defaultValue={text(payload, "recipient", "legal_name")} required /></div>
              <CountryReferenceSearch initialBacenCode={text(payload, "recipient", "address", "country_code")} initialName={text(payload, "recipient", "address", "country_name")} initialIsoAlpha2={text(payload, "recipient", "address", "country_iso_alpha_2")} bacenCodeName="supplier_country_code" countryName="supplier_country_name" isoAlpha2Name="supplier_country_iso_alpha_2" activeOn={text(payload, "document", "issue_datetime").slice(0, 10) || undefined} />
              <div className="space-y-1.5"><Label>Identificador estrangeiro</Label><Input name="supplier_foreign_id" defaultValue={text(payload, "recipient", "foreign_id")} /></div>
              {(["street", "number", "complement", "district", "city_name"] as const).map((field) => <div key={field} className="space-y-1.5"><Label>{({ street: "Endereço", number: "Número", complement: "Complemento", district: "Distrito", city_name: "Cidade" })[field]}</Label><Input name={`supplier_${field}`} defaultValue={text(payload, "recipient", "address", field)} /></div>)}
            </section>
            <Button disabled={immutable || busy === "parties"}>{busy === "parties" && <Loader2 className="animate-spin" />}<Save /> Salvar participantes</Button>
          </form>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          {detail.items.map((item) => (
            <form key={item.id} className="rounded-lg border p-4" onSubmit={(event) => saveItem(event, item.id)}>
              <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Item {String(item.item_number || "")}</h3><Badge variant="outline">NCM {String(item.ncm || "")}</Badge></div>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-1.5"><Label>Código</Label><Input name="product_code" defaultValue={String(item.product_code || "")} required /></div>
                <div className="space-y-1.5 md:col-span-3"><Label>Descrição</Label><Input name="description" defaultValue={String(item.description || "")} required /></div>
                {(["ncm", "cfop", "commercial_unit", "commercial_quantity", "commercial_unit_value", "taxable_unit", "taxable_quantity", "taxable_unit_value", "product_value", "freight_value", "insurance_value", "discount_value", "other_value"] as const).map((field) => <div key={field} className="space-y-1.5"><Label>{field.replaceAll("_", " ")}</Label><Input name={field} defaultValue={String(item[field] ?? "")} required /></div>)}
              </div>
              <Button className="mt-4" size="sm" disabled={immutable || busy === `item:${item.id}`}>{busy === `item:${item.id}` && <Loader2 className="animate-spin" />} Salvar item</Button>
            </form>
          ))}
        </TabsContent>

        <TabsContent value="taxes" className="space-y-4">
          <Alert><CircleAlert /><AlertTitle>Totais não são editáveis</AlertTitle><AlertDescription>Informe base, alíquota, redução ou tratamento. O valor do ICMS, os totais e a reconciliação serão calculados pela API. Todo ajuste exige motivo e fica associado ao usuário e à data.</AlertDescription></Alert>
          {detail.items.map((item) => {
            const taxes = record(item.tax_payload);
            const icms = record(taxes.icms);
            const source = String(icms.calculation_source || (item.tax_rule_id ? "tax_rule" : "request_configuration"));
            return (
              <form key={item.id} className="rounded-lg border p-4" onSubmit={(event) => saveTax(event, item.id)}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">Item {String(item.item_number || "")} — {String(item.description || "")}</h3><p className="text-xs text-muted-foreground">CFOP {String(item.cfop || "")}</p></div><Badge variant={source === "manual_adjustment" ? "destructive" : "secondary"}>{source === "manual_adjustment" ? "Ajuste manual" : "Regra tributária"}</Badge></div>
                {source === "manual_adjustment" && <Alert className="mb-4 border-amber-500/40 bg-amber-500/5"><CircleAlert /><AlertDescription>A regra tributária foi sobrescrita especificamente neste item.</AlertDescription></Alert>}
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1.5"><Label>CFOP</Label><Input name="cfop" defaultValue={String(item.cfop || "")} required /></div>
                  <div className="space-y-1.5"><Label>CST ICMS</Label><select name="cst" defaultValue={String(icms.cst || "90")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{["00", "40", "41", "50", "51", "90"].map((cst) => <option key={cst}>{cst}</option>)}</select></div>
                  <div className="space-y-1.5"><Label>Base de cálculo</Label><Input name="base" defaultValue={String(icms.base || "0.00")} inputMode="decimal" required /></div>
                  <div className="space-y-1.5"><Label>Alíquota (%)</Label><Input name="rate" defaultValue={String(icms.rate || "")} inputMode="decimal" /></div>
                  <div className="space-y-1.5"><Label>Redução (%)</Label><Input name="reduction_rate" defaultValue={String(icms.base_reduction_rate || "")} inputMode="decimal" /></div>
                  <div className="space-y-1.5"><Label>Diferimento (%)</Label><Input name="deferment_rate" defaultValue={String(icms.deferment_rate || "")} inputMode="decimal" /></div>
                  <div className="space-y-1.5"><Label>Valor calculado</Label><Input value={money(icms.value)} disabled /></div>
                  <div className="space-y-1.5"><Label>Valor informado pela DUIMP</Label><Input value={money(icms.duimp_value)} disabled /></div>
                  <div className="space-y-1.5"><Label>Diferença</Label><Input value={money(icms.difference)} disabled /></div>
                  <div className="space-y-1.5 md:col-span-3"><Label>Motivo obrigatório</Label><Textarea name="reason" minLength={10} maxLength={500} required placeholder="Descreva a conferência fiscal que justifica o ajuste." /></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" disabled={immutable || busy === `tax:${item.id}`}>{busy === `tax:${item.id}` && <Loader2 className="animate-spin" />} Salvar ajuste auditado</Button>{Boolean(item.tax_rule_id) && <Button type="button" size="sm" variant="outline" onClick={() => void restoreTax(item.id)} disabled={immutable || busy === `tax:${item.id}`}><RotateCcw /> Reaplicar regra</Button>}</div>
                <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">{["ii", "ipi", "pis", "cofins"].map((tax) => <span key={tax} className="rounded bg-muted p-2"><strong className="uppercase">{tax}</strong><br />Base {money(record(taxes[tax]).base)} · Valor {money(record(taxes[tax]).value)}</span>)}</div>
              </form>
            );
          })}
        </TabsContent>

        <TabsContent value="costs">
          <form className="space-y-5" onSubmit={saveCosts}>
            <Alert><CircleAlert /><AlertTitle>Rateio e ICMS recalculados pela API</AlertTitle><AlertDescription>AFRMM, Siscomex, THC e outras despesas são rateados novamente entre os itens. Diferenças como a despesa aduaneira de R$ 4.922,23 passam a aparecer na reconciliação abaixo.</AlertDescription></Alert>
            <div className="grid gap-3 md:grid-cols-4">{(["afrmm", "siscomex_fee", "thc", "other"] as const).map((field) => <div key={field} className="space-y-1.5"><Label>{({ afrmm: "AFRMM", siscomex_fee: "Taxa Siscomex", thc: "THC", other: "Outras despesas aduaneiras" })[field]}</Label><Input name={field} defaultValue={text(payload, "additional_costs", field) || "0.00"} inputMode="decimal" required /></div>)}</div>
            <div className="grid gap-3 md:grid-cols-4"><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Produtos</CardTitle></CardHeader><CardContent className="font-semibold">{money(totals.products_value)}</CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">ICMS</CardTitle></CardHeader><CardContent className="font-semibold">{money(totals.icms_value)}</CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Outras despesas</CardTitle></CardHeader><CardContent className="font-semibold">{money(totals.other_value)}</CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total da NF-e</CardTitle></CardHeader><CardContent className="font-semibold">{money(totals.invoice_value)}</CardContent></Card></div>
            <Button disabled={immutable || busy === "costs"}>{busy === "costs" && <Loader2 className="animate-spin" />} Salvar despesas e recalcular</Button>
          </form>
        </TabsContent>

        <TabsContent value="transport">
          <form className="space-y-5" onSubmit={saveTransport}>
            <div className="space-y-1.5"><Label>Modalidade do frete</Label><select name="freight_mode" defaultValue={text(payload, "transport", "freight_mode") || "9"} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="0">0 — Emitente</option><option value="1">1 — Destinatário</option><option value="2">2 — Terceiros</option><option value="3">3 — Próprio do emitente</option><option value="4">4 — Próprio do destinatário</option><option value="9">9 — Sem transporte</option></select></div>
            <NfeCarrierSelector key={detail.draft.updated_at || detail.draft.id} initialCarrier={record(record(payload.transport).carrier)} />
            <div className="grid gap-3 md:grid-cols-3">{(["quantity", "species", "brand", "numbering", "net_weight", "gross_weight"] as const).map((field) => <div key={field} className="space-y-1.5"><Label>{field.replaceAll("_", " ")}</Label><Input name={`volume_${field}`} type={field === "quantity" ? "number" : "text"} defaultValue={text(payload, "transport", "volume", field)} /></div>)}</div>
            <Button disabled={immutable || busy === "transport"}>{busy === "transport" && <Loader2 className="animate-spin" />} Salvar transporte</Button>
          </form>
        </TabsContent>

        <TabsContent value="additional">
          <form className="space-y-4" onSubmit={saveAdditionalInfo}><div className="space-y-1.5"><Label>Informações fiscais</Label><Textarea name="fiscal" className="min-h-32" defaultValue={text(payload, "additional_info", "fiscal")} /></div><div className="space-y-1.5"><Label>Informações complementares</Label><Textarea name="complementary" className="min-h-40" defaultValue={text(payload, "additional_info", "complementary")} /></div><Button disabled={immutable || busy === "additional"}>{busy === "additional" && <Loader2 className="animate-spin" />} Salvar informações</Button></form>
        </TabsContent>

        <TabsContent value="validation" className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="text-base">Validação do rascunho</CardTitle></CardHeader><CardContent className="space-y-2">{detail.draft.validation_errors.length === 0 && <p className="text-sm text-emerald-700">Nenhum erro bloqueante.</p>}{detail.draft.validation_errors.map((issue, index) => <p key={index} className="rounded bg-destructive/5 p-2 text-sm text-destructive">{issueLabel(issue)}</p>)}{detail.draft.validation_warnings.map((issue, index) => <p key={index} className="rounded bg-amber-500/10 p-2 text-sm text-amber-800 dark:text-amber-300">{issueLabel(issue)}</p>)}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Reconciliação</CardTitle></CardHeader><CardContent className="space-y-2"><Badge variant={String(reconciliation.status) === "balanced" ? "secondary" : "destructive"}>{String(reconciliation.status || "Não calculada")}</Badge>{checks.map((check, index) => <div key={index} className="grid grid-cols-4 gap-2 rounded border p-2 text-xs"><strong>{String(check.name || "")}</strong><span>Esperado {money(check.expected)}</span><span>Calculado {money(check.calculated)}</span><span className={check.matches ? "text-emerald-700" : "text-destructive"}>Dif. {money(check.difference)}</span></div>)}</CardContent></Card></div>
          <Card><CardHeader><CardTitle className="text-base">Trilha de auditoria</CardTitle></CardHeader><CardContent className="space-y-2">{detail.auditTrail.length === 0 && <p className="text-sm text-muted-foreground">Nenhum ajuste manual registrado.</p>}{detail.auditTrail.map((event, index) => <div key={`${event.changed_at}-${index}`} className="rounded border p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{event.section === "taxes" ? `Tributos · item ${event.item_number}` : event.section}</strong><span className="text-xs text-muted-foreground">{new Date(event.changed_at).toLocaleString("pt-BR")}</span></div><p>{event.reason}</p><p className="text-xs text-muted-foreground">{event.changed_by_name || "Usuário não identificado"} · {event.source === "manual_adjustment" ? "ajuste manual" : event.source === "tax_rule" ? "regra reaplicada" : "alteração do rascunho"}</p></div>)}</CardContent></Card>
          {!immutable && <Card className="border-destructive/30"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-destructive">{detail.draft.number || detail.draft.access_key ? <Archive /> : <Trash2 />}{detail.draft.number || detail.draft.access_key ? "Arquivar rascunho" : "Excluir rascunho"}</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={removeDraft}><p className="text-sm text-muted-foreground">{detail.draft.number || detail.draft.access_key ? "A numeração já foi reservada. O rascunho será arquivado e marcado para possível inutilização; o número não retornará à sequência." : "A exclusão será lógica e permanecerá registrada no histórico do processo."}</p><Textarea name="deletion_reason" minLength={10} maxLength={500} required placeholder="Informe o motivo obrigatório." /><Button variant="destructive" disabled={busy === "remove"}>{busy === "remove" && <Loader2 className="animate-spin" />}{detail.draft.number || detail.draft.access_key ? "Arquivar" : "Excluir logicamente"}</Button></form></CardContent></Card>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
