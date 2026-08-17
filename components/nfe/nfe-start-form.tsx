"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Loader2, Plus, Search, Settings2 } from "lucide-react";
import { clientsApi } from "@/lib/api/services/clients";
import { nfeApi } from "@/lib/api/services/nfe";
import { useClients } from "@/lib/api/hooks/use-clients-api";
import type { ClientApi } from "@/lib/api/types/client-api";
import type { FiscalEnvironment, ImportPurpose } from "@/lib/api/types/nfe-api";
import { useToast } from "@/components/ui/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SetupState = {
  fiscalProfile: boolean;
  taxRule: boolean;
  numberSequence: boolean;
  checking: boolean;
};

function errorMessage(error: unknown) {
  const candidate = error as { response?: { data?: { message?: string } }; message?: string };
  return candidate.response?.data?.message || candidate.message || "Não foi possível concluir a operação.";
}

function normalizeApiEnum(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized.split(".").at(-1) ?? "";
}

function normalizeSeries(value: unknown) {
  return String(value ?? "").trim().replace(/^0+(?=\d)/, "");
}

function matchesNumberSequence(
  sequence: Record<string, unknown>,
  environment: FiscalEnvironment,
  series: string,
) {
  return (
    normalizeApiEnum(sequence.environment) === environment &&
    normalizeSeries(sequence.series) === normalizeSeries(series) &&
    normalizeApiEnum(sequence.status) === "active"
  );
}

function Field({ label, name, defaultValue, required = true, type = "text", placeholder }: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} required={required} type={type} placeholder={placeholder} />
    </div>
  );
}

export function NfeStartForm() {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientApi | null>(null);
  const [duimpNumber, setDuimpNumber] = useState("");
  const [purpose, setPurpose] = useState<ImportPurpose>("resale");
  const [environment, setEnvironment] = useState<FiscalEnvironment>("homologation");
  const [series, setSeries] = useState("1");
  const [setupDialog, setSetupDialog] = useState<"client" | "profile" | "rule" | "sequence" | null>(null);
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<SetupState>({ fiscalProfile: false, taxRule: false, numberSequence: false, checking: false });
  const { data: clients, mutate: refreshClients } = useClients({ q: search || undefined, ativo: true, limit: 20 });

  const normalizedDuimp = useMemo(() => duimpNumber.replace(/\s/g, "").toUpperCase(), [duimpNumber]);

  const checkSetup = useCallback(async (client: ClientApi) => {
    setSetup((current) => ({ ...current, checking: true }));
    const [profile, rules, sequences] = await Promise.allSettled([
      nfeApi.getFiscalProfile(client.id),
      nfeApi.listTaxRules(client.id),
      nfeApi.listNumberSequences(client.id),
    ]);
    setSetup({
      fiscalProfile: profile.status === "fulfilled",
      taxRule:
        rules.status === "fulfilled" &&
        rules.value.some((rule) => rule.active && rule.import_purpose === purpose),
      numberSequence:
        sequences.status === "fulfilled" &&
        sequences.value.some((row) =>
          matchesNumberSequence(row, environment, series),
        ),
      checking: false,
    });
  }, [environment, purpose, series]);

  useEffect(() => {
    if (!selectedClient) return;
    const timeout = window.setTimeout(() => void checkSetup(selectedClient), 0);
    return () => window.clearTimeout(timeout);
  }, [checkSetup, selectedClient]);

  async function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const client = await clientsApi.createClient({
        cnpj: String(form.get("cnpj")),
        razao_social: String(form.get("razao_social")),
        nome_resumido: String(form.get("nome_resumido") || "") || null,
        inscricao_estadual: String(form.get("inscricao_estadual") || "") || null,
        regime_tributacao: String(form.get("regime_tributacao") || "REGIME_NORMAL"),
        ativo: true,
      });
      await refreshClients();
      setSelectedClient(client);
      setSetupDialog(null);
      toast.success("Cliente cadastrado e selecionado.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClient) return;
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      await nfeApi.saveFiscalProfile(selectedClient.id, {
        legal_name: String(form.get("legal_name")),
        trade_name: String(form.get("trade_name") || "") || null,
        cnpj: selectedClient.cnpj,
        state_registration: String(form.get("state_registration") || "") || null,
        tax_regime: String(form.get("tax_regime")) as "1" | "2" | "3",
        street: String(form.get("street")),
        number: String(form.get("number")),
        complement: String(form.get("complement") || "") || null,
        district: String(form.get("district")),
        city_code: String(form.get("city_code")),
        city_name: String(form.get("city_name")),
        state: String(form.get("state")).toUpperCase(),
        zip_code: String(form.get("zip_code")).replace(/\D/g, ""),
        country_code: "1058",
        country_name: "Brasil",
        phone: String(form.get("phone") || "") || null,
        email: String(form.get("email") || "") || null,
      });
      await checkSetup(selectedClient);
      setSetupDialog(null);
      toast.success("Perfil fiscal salvo.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClient) return;
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const cst = String(form.get("icms_cst"));
      if (!form.get("icms_cst")) {
        toast.info("Selecione o CST de ICMS confirmado para esta operação.");
        setBusy(false);
        return;
      }
      const rate = String(form.get("icms_rate") || "").trim();
      const configuration: Record<string, unknown> = {
        icms_origin: "1",
        icms_cst: cst,
        ipi_cst: "00",
        ipi_zero_rate_cst: "01",
        pis_cst: "99",
        cofins_cst: "99",
        document_defaults: {
          operation_nature: "Compra para comercialização",
          presence_indicator: "9",
          intermediary_indicator: "0",
        },
        item_defaults: { commercial_unit: "UN", taxable_unit: "UN" },
      };
      if (rate) configuration.icms_rate = rate;
      if (cst === "51" && !rate) configuration.icms_base_reduction_rate = "100";
      await nfeApi.createTaxRule(selectedClient.id, {
        name: String(form.get("name")),
        issuer_state: String(form.get("issuer_state")).toUpperCase(),
        import_purpose: purpose,
        import_modality: String(form.get("import_modality")) as "direct" | "on_behalf" | "by_order",
        tax_regime: String(form.get("tax_regime")) as "1" | "2" | "3",
        priority: 100,
        effective_from: String(form.get("effective_from")),
        configuration_json: configuration,
        payment_defaults: { method: "90", value: "0.00" },
        transport_defaults: { freight_mode: "1" },
        active: true,
      });
      await checkSetup(selectedClient);
      setSetupDialog(null);
      toast.success("Regra tributária criada. Revise-a antes de autorizar uma NF-e.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveSequence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClient) return;
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      await nfeApi.saveNumberSequence(selectedClient.id, {
        environment,
        model: "55",
        series,
        current_number: Number(form.get("current_number") || 0),
        initial_number: Number(form.get("initial_number") || 1),
        max_number: 999999999,
        status: "active",
      });
      await checkSetup(selectedClient);
      setSetup((current) => ({
        ...current,
        numberSequence: true,
        checking: false,
      }));
      setSetupDialog(null);
      toast.success("Sequência numérica configurada.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function startIssuance() {
    if (!selectedClient || !normalizedDuimp) return;
    if (!setup.fiscalProfile || !setup.taxRule || !setup.numberSequence) {
      toast.info("Conclua os cadastros fiscais antes de capturar a DUIMP.");
      return;
    }
    setBusy(true);
    try {
      const process = await nfeApi.createProcess({
        importer_id: selectedClient.id,
        reference_code: `NFE-${normalizedDuimp}-${Date.now().toString().slice(-6)}`,
        duimp_number: normalizedDuimp,
        source: "portal_unico",
      });
      await nfeApi.fetchDuimp(process.id, environment);
      router.push(`/nfe/processes/${process.id}?importPurpose=${purpose}&environment=${environment}&series=${series}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const ready = setup.fiscalProfile && setup.taxRule && setup.numberSequence;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <p className="text-sm font-medium text-primary">Assistente de emissão</p>
        <h1 className="text-2xl font-semibold tracking-tight">Nova NF-e de importação</h1>
        <p className="mt-1 text-sm text-muted-foreground">Informe o mínimo necessário; o sistema reaproveita os cadastros do cliente e captura a DUIMP.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader><CardTitle>1. Cliente e DUIMP</CardTitle><CardDescription>Selecione o importador ou faça um cadastro rápido.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex gap-2">
              <div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou CNPJ" className="pl-9" /></div>
              <Button variant="outline" onClick={() => setSetupDialog("client")}><Plus /> Cliente</Button>
            </div>
            <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border p-2">
              {clients?.items.map((client) => (
                <button key={client.id} type="button" onClick={() => setSelectedClient(client)} className={`w-full rounded-md border p-3 text-left transition ${selectedClient?.id === client.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}>
                  <span className="block font-medium">{client.nome_resumido || client.razao_social}</span>
                  <span className="text-xs text-muted-foreground">{client.cnpj} · {client.razao_social}</span>
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="duimp">Número da DUIMP</Label><Input id="duimp" value={duimpNumber} onChange={(event) => setDuimpNumber(event.target.value)} placeholder="26BR0000000000-1" /></div>
              <div className="space-y-1.5"><Label>Finalidade</Label><Select value={purpose} onValueChange={(value) => setPurpose(value as ImportPurpose)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="resale">Revenda</SelectItem><SelectItem value="industrialization">Industrialização</SelectItem><SelectItem value="fixed_asset">Ativo imobilizado</SelectItem><SelectItem value="use_consumption">Uso e consumo</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Ambiente</Label><Select value={environment} onValueChange={(value) => setEnvironment(value as FiscalEnvironment)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="homologation">Homologação</SelectItem><SelectItem value="production">Produção</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label htmlFor="series">Série</Label><Input id="series" value={series} onChange={(event) => setSeries(event.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>2. Preparação fiscal</CardTitle><CardDescription>Cadastros reutilizáveis do cliente selecionado.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {!selectedClient && <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">Selecione um cliente para verificar os pré-requisitos.</p>}
            {selectedClient && setup.checking && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Verificando cadastros…</p>}
            {selectedClient && !setup.checking && [
              ["Perfil fiscal", setup.fiscalProfile, "profile"],
              ["Regra tributária", setup.taxRule, "rule"],
              ["Sequência numérica", setup.numberSequence, "sequence"],
            ].map(([label, done, dialog]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">{done ? <Check className="size-5 text-emerald-600" /> : <CircleAlert className="size-5 text-amber-600" />}<div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{done ? "Configurado" : "Pendente"}</p></div></div>
                <Button size="sm" variant="outline" onClick={() => setSetupDialog(dialog as typeof setupDialog)}><Settings2 /> {done ? "Revisar" : "Cadastrar"}</Button>
              </div>
            ))}
            {selectedClient && ready && <Alert className="border-emerald-500/30 bg-emerald-500/5"><Check /><AlertTitle>Pronto para capturar</AlertTitle><AlertDescription>Os pré-requisitos do cliente estão configurados.</AlertDescription></Alert>}
            <Button className="mt-3 w-full" size="lg" disabled={!selectedClient || !normalizedDuimp || !ready || busy} onClick={startIssuance}>{busy && <Loader2 className="animate-spin" />} Criar processo e capturar DUIMP</Button>
          </CardContent>
        </Card>
      </div>

      <Alert><CircleAlert /><AlertTitle>Homologação por padrão</AlertTitle><AlertDescription>A regra tributária rápida reduz digitação, mas não substitui a conferência fiscal. Pendências e divergências continuarão bloqueando a geração definitiva.</AlertDescription></Alert>

      <Dialog open={setupDialog === "client"} onOpenChange={(open) => !open && setSetupDialog(null)}><DialogContent><DialogHeader><DialogTitle>Cadastro rápido de cliente</DialogTitle><DialogDescription>Crie o cadastro básico agora; o perfil fiscal será preenchido em seguida.</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={createClient}><Field label="CNPJ" name="cnpj" /><Field label="Razão social" name="razao_social" /><Field label="Nome resumido" name="nome_resumido" required={false} /><Field label="Inscrição estadual" name="inscricao_estadual" required={false} /><Field label="Regime cadastral" name="regime_tributacao" defaultValue="REGIME_NORMAL" /><Button disabled={busy}>{busy && <Loader2 className="animate-spin" />} Salvar cliente</Button></form></DialogContent></Dialog>

      <Dialog open={setupDialog === "profile"} onOpenChange={(open) => !open && setSetupDialog(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Perfil fiscal</DialogTitle><DialogDescription>Dados do emitente usados no XML da NF-e.</DialogDescription></DialogHeader><form className="grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}><Field label="Razão social" name="legal_name" defaultValue={selectedClient?.razao_social} /><Field label="Nome fantasia" name="trade_name" defaultValue={selectedClient?.nome_resumido || ""} required={false} /><Field label="Inscrição estadual" name="state_registration" defaultValue={selectedClient?.inscricao_estadual || ""} required={false} /><div className="space-y-1.5"><Label>Regime tributário NF-e</Label><Select name="tax_regime" defaultValue="3"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1 — Simples Nacional</SelectItem><SelectItem value="2">2 — Excesso sublimite</SelectItem><SelectItem value="3">3 — Regime normal</SelectItem></SelectContent></Select></div><Field label="Logradouro" name="street" /><Field label="Número" name="number" /><Field label="Complemento" name="complement" required={false} /><Field label="Bairro" name="district" /><Field label="Código IBGE" name="city_code" placeholder="4106902" /><Field label="Município" name="city_name" /><Field label="UF" name="state" placeholder="PR" /><Field label="CEP" name="zip_code" /><Field label="Telefone" name="phone" required={false} /><Field label="E-mail" name="email" type="email" required={false} /><Button className="sm:col-span-2" disabled={busy}>Salvar perfil fiscal</Button></form></DialogContent></Dialog>

      <Dialog open={setupDialog === "rule"} onOpenChange={(open) => !open && setSetupDialog(null)}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Regra tributária rápida</DialogTitle><DialogDescription>Crie uma regra reaproveitável. CST e alíquota devem ser confirmados pela equipe fiscal.</DialogDescription></DialogHeader><form className="grid gap-4 sm:grid-cols-2" onSubmit={saveRule}><Field label="Nome da regra" name="name" defaultValue={`Importação ${purpose} - padrão`} /><Field label="UF do emitente" name="issuer_state" placeholder="PR" /><div className="space-y-1.5"><Label>Modalidade</Label><Select name="import_modality" defaultValue="direct"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="direct">Importação própria</SelectItem><SelectItem value="on_behalf">Por conta e ordem</SelectItem><SelectItem value="by_order">Por encomenda</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label>Regime tributário</Label><Select name="tax_regime" defaultValue="3"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1 — Simples Nacional</SelectItem><SelectItem value="2">2 — Excesso sublimite</SelectItem><SelectItem value="3">3 — Regime normal</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label>ICMS CST confirmado</Label><Select name="icms_cst"><SelectTrigger className="w-full"><SelectValue placeholder="Selecione o tratamento" /></SelectTrigger><SelectContent><SelectItem value="00">00 — Tributada integralmente</SelectItem><SelectItem value="40">40 — Isenta</SelectItem><SelectItem value="41">41 — Não tributada</SelectItem><SelectItem value="50">50 — Suspensão</SelectItem><SelectItem value="51">51 — Diferimento</SelectItem><SelectItem value="90">90 — Outras</SelectItem></SelectContent></Select></div><Field label="Alíquota ICMS (quando aplicável)" name="icms_rate" required={false} placeholder="Ex.: 12" /><Field label="Vigência inicial" name="effective_from" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /><Button className="sm:col-span-2" disabled={busy}>Salvar regra tributária</Button></form></DialogContent></Dialog>

      <Dialog open={setupDialog === "sequence"} onOpenChange={(open) => !open && setSetupDialog(null)}><DialogContent><DialogHeader><DialogTitle>Sequência numérica</DialogTitle><DialogDescription>Ambiente {environment}, modelo 55, série {series}. Informe o último número já utilizado.</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={saveSequence}><Field label="Último número utilizado" name="current_number" type="number" defaultValue="0" /><Field label="Primeiro número permitido" name="initial_number" type="number" defaultValue="1" /><Alert><CircleAlert /><AlertDescription>Em produção, confira a numeração atual na SEFAZ/ERP para evitar duplicidade.</AlertDescription></Alert><Button disabled={busy}>Salvar sequência</Button></form></DialogContent></Dialog>
    </div>
  );
}
