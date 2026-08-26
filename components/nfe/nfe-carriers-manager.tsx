"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CircleAlert, Loader2, PencilLine, Plus, Power, RefreshCw, Search, Truck } from "lucide-react";

import { MunicipalityReferenceSearch } from "@/components/nfe/fiscal-reference-search";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { getSessionRole } from "@/lib/api/hooks/use-auth";
import { nfeApi } from "@/lib/api/services/nfe";
import type { NfeCarrier, NfeCarrierPayload } from "@/lib/api/types/nfe-api";

function apiError(error: unknown) {
  const candidate = error as { response?: { data?: { message?: string; messages?: Record<string, string[]> } }; message?: string };
  const messages = candidate.response?.data?.messages;
  if (messages) return Object.values(messages).flat()[0] || "Revise os dados informados.";
  return candidate.response?.data?.message || candidate.message || "Não foi possível concluir a operação.";
}

function formatTaxId(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 14) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (digits.length === 11) return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return value;
}

export function NfeCarriersManager() {
  const toast = useToast();
  const isAdmin = getSessionRole() === "admin";
  const [items, setItems] = useState<NfeCarrier[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NfeCarrier | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await nfeApi.listCarriers({
        q: query.trim() || undefined,
        active: includeInactive ? undefined : true,
        limit: 100,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setLoading(false);
    }
  }, [includeInactive, query, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(carrier: NfeCarrier) {
    setEditing(carrier);
    setDialogOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    const payload: NfeCarrierPayload = {
      legal_name: value("legal_name"),
      trade_name: value("trade_name") || null,
      tax_id: value("tax_id"),
      state_registration: value("state_registration") || null,
      street: value("street"),
      number: value("number"),
      complement: value("complement") || null,
      district: value("district"),
      municipality_code: value("municipality_code"),
      zip_code: value("zip_code"),
      phone: value("phone") || null,
      email: value("email") || null,
      active: editing?.active ?? true,
    };
    setBusy("save");
    try {
      if (editing) await nfeApi.updateCarrier(editing.id, payload);
      else await nfeApi.createCarrier(payload);
      setDialogOpen(false);
      setEditing(null);
      await load();
      toast.success(editing ? "Transportadora atualizada." : "Transportadora cadastrada.");
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(carrier: NfeCarrier) {
    setBusy(carrier.id);
    try {
      if (carrier.active) await nfeApi.deactivateCarrier(carrier.id);
      else await nfeApi.updateCarrier(carrier.id, { active: true });
      await load();
      toast.success(carrier.active ? "Transportadora desativada." : "Transportadora reativada.");
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><Truck className="size-6 text-primary" /><h1 className="text-2xl font-semibold">Transportadoras</h1></div>
          <p className="mt-1 text-sm text-muted-foreground">Cadastros reutilizáveis na revisão da NF-e. A seleção gera uma cópia no rascunho e preserva o histórico fiscal.</p>
        </div>
        {isAdmin && <Button onClick={openCreate}><Plus /> Nova transportadora</Button>}
      </div>

      {!isAdmin && (
        <Alert><CircleAlert /><AlertTitle>Consulta somente</AlertTitle><AlertDescription>Apenas administradores podem cadastrar ou alterar transportadoras.</AlertDescription></Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cadastros da organização</CardTitle>
          <CardDescription>{total} transportadora(s) encontrada(s).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1"><Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Pesquisar por razão social, nome fantasia, CNPJ ou CPF" /></div>
            <label className="flex items-center gap-2 rounded-md border px-3 text-sm"><input type="checkbox" checked={includeInactive} onChange={(event) => setIncludeInactive(event.target.checked)} /> Exibir inativas</label>
            <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} /> Atualizar</Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Transportadora</TableHead><TableHead>CPF/CNPJ</TableHead><TableHead>Município</TableHead><TableHead>Contato</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((carrier) => (
                  <TableRow key={carrier.id}>
                    <TableCell><strong className="block">{carrier.legal_name}</strong><span className="text-xs text-muted-foreground">{carrier.trade_name || "Sem nome fantasia"}</span></TableCell>
                    <TableCell>{formatTaxId(carrier.tax_id)}<span className="block text-xs text-muted-foreground">IE {carrier.state_registration || "não informada"}</span></TableCell>
                    <TableCell>{carrier.municipality_name}/{carrier.state}<span className="block text-xs text-muted-foreground">IBGE {carrier.municipality_code}</span></TableCell>
                    <TableCell>{carrier.phone || carrier.email || "—"}</TableCell>
                    <TableCell><Badge variant={carrier.active ? "default" : "secondary"}>{carrier.active ? "Ativa" : "Inativa"}</Badge></TableCell>
                    <TableCell><div className="flex justify-end gap-2">{isAdmin && <><Button size="sm" variant="outline" onClick={() => openEdit(carrier)}><PencilLine /> Editar</Button><Button size="sm" variant="ghost" onClick={() => void toggleActive(carrier)} disabled={busy === carrier.id}>{busy === carrier.id ? <Loader2 className="animate-spin" /> : <Power />} {carrier.active ? "Desativar" : "Reativar"}</Button></>}</div></TableCell>
                  </TableRow>
                ))}
                {!loading && items.length === 0 && <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">Nenhuma transportadora encontrada.</TableCell></TableRow>}
                {loading && <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 animate-spin" /> Carregando cadastros…</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Editar transportadora" : "Nova transportadora"}</DialogTitle><DialogDescription>O município e a UF serão preenchidos pelo catálogo oficial do IBGE.</DialogDescription></DialogHeader>
          <form className="space-y-5" onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="legal_name">Razão social</Label><Input id="legal_name" name="legal_name" defaultValue={editing?.legal_name || ""} maxLength={60} required /></div>
              <div className="space-y-1.5"><Label htmlFor="trade_name">Nome fantasia</Label><Input id="trade_name" name="trade_name" defaultValue={editing?.trade_name || ""} maxLength={60} /></div>
              <div className="space-y-1.5"><Label htmlFor="tax_id">CNPJ ou CPF</Label><Input id="tax_id" name="tax_id" defaultValue={editing?.tax_id || ""} required /></div>
              <div className="space-y-1.5"><Label htmlFor="state_registration">Inscrição estadual</Label><Input id="state_registration" name="state_registration" defaultValue={editing?.state_registration || ""} /></div>
              <div className="space-y-1.5"><Label htmlFor="zip_code">CEP</Label><Input id="zip_code" name="zip_code" defaultValue={editing?.zip_code || ""} required /></div>
              <div className="space-y-1.5"><Label htmlFor="street">Logradouro</Label><Input id="street" name="street" defaultValue={editing?.street || ""} required /></div>
              <div className="space-y-1.5"><Label htmlFor="number">Número</Label><Input id="number" name="number" defaultValue={editing?.number || ""} required /></div>
              <div className="space-y-1.5"><Label htmlFor="complement">Complemento</Label><Input id="complement" name="complement" defaultValue={editing?.complement || ""} /></div>
              <div className="space-y-1.5"><Label htmlFor="district">Bairro</Label><Input id="district" name="district" defaultValue={editing?.district || ""} required /></div>
              <MunicipalityReferenceSearch initialCode={editing?.municipality_code || ""} initialName={editing?.municipality_name || ""} initialState={editing?.state || ""} codeName="municipality_code" cityName="municipality_name" stateName="state" />
              <div className="space-y-1.5"><Label htmlFor="phone">Telefone</Label><Input id="phone" name="phone" defaultValue={editing?.phone || ""} /></div>
              <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" defaultValue={editing?.email || ""} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={busy === "save"}>Cancelar</Button><Button type="submit" disabled={busy === "save"}>{busy === "save" && <Loader2 className="animate-spin" />} Salvar transportadora</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
