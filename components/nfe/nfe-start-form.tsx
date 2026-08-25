"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search } from "lucide-react";
import { clientsApi } from "@/lib/api/services/clients";
import { nfeApi } from "@/lib/api/services/nfe";
import { useClients } from "@/lib/api/hooks/use-clients-api";
import type { ClientApi } from "@/lib/api/types/client-api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function errorMessage(error: unknown) {
  const candidate = error as { response?: { data?: { message?: string } }; message?: string };
  return candidate.response?.data?.message || candidate.message || "Não foi possível concluir a operação.";
}

function Field({ label, name, required = true }: { label: string; name: string; required?: boolean }) {
  return <div className="space-y-1.5"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} required={required} /></div>;
}

export function NfeStartForm() {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientApi | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data: clients, mutate: refreshClients } = useClients({ q: search || undefined, ativo: true, limit: 30 });

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
        regime_tributacao: "REGIME_NORMAL",
        ativo: true,
      });
      await refreshClients();
      setSelectedClient(client);
      setClientDialogOpen(false);
      toast.success("Cliente cadastrado e selecionado.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function openProcess() {
    if (!selectedClient) return;
    setBusy(true);
    try {
      const process = await nfeApi.createProcess({ importer_id: selectedClient.id, source: "portal_unico" });
      router.push(`/nfe/processes/${process.id}?step=client`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
      <div>
        <p className="text-sm font-medium text-primary">Assistente de emissão</p>
        <h1 className="text-2xl font-semibold tracking-tight">Novo processo de NF-e</h1>
        <p className="mt-1 text-sm text-muted-foreground">Selecione o cliente. Os cadastros fiscais serão revisados dentro do processo antes da importação da DUIMP.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Selecionar cliente</CardTitle><CardDescription>O processo será criado primeiro; nenhum dado do Portal Único será consultado nesta tela.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex gap-2">
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou CNPJ" className="pl-9" /></div>
            <Button variant="outline" onClick={() => setClientDialogOpen(true)}><Plus /> Cliente</Button>
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-lg border p-2">
            {clients?.items.map((client) => (
              <button key={client.id} type="button" onClick={() => setSelectedClient(client)} className={`w-full rounded-md border p-4 text-left transition ${selectedClient?.id === client.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}>
                <span className="block font-medium">{client.nome_resumido || client.razao_social}</span>
                <span className="text-xs text-muted-foreground">{client.cnpj} · {client.razao_social}</span>
              </button>
            ))}
            {clients && clients.items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>}
          </div>
          <Button className="w-full" size="lg" disabled={!selectedClient || busy} onClick={() => void openProcess()}>{busy && <Loader2 className="animate-spin" />} Abrir novo processo</Button>
        </CardContent>
      </Card>
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cadastro rápido de cliente</DialogTitle><DialogDescription>Crie o cadastro básico; os dados fiscais serão completados na primeira etapa do processo.</DialogDescription></DialogHeader>
          <form className="grid gap-4" onSubmit={createClient}>
            <Field label="CNPJ" name="cnpj" /><Field label="Razão social" name="razao_social" /><Field label="Nome resumido" name="nome_resumido" required={false} /><Field label="Inscrição estadual" name="inscricao_estadual" required={false} />
            <Button disabled={busy}>{busy && <Loader2 className="animate-spin" />} Salvar cliente</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
