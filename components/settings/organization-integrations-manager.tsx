"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, CircleAlert, Loader2, PlugZap, RefreshCw } from "lucide-react";
import { nfeApi } from "@/lib/api/services/nfe";
import type { ProviderConnectionSummary } from "@/lib/api/types/nfe-api";
import { hasRole } from "@/lib/auth/guard";
import { useToast } from "@/components/ui/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function errorMessage(error: unknown) {
  const candidate = error as { response?: { data?: { message?: string } }; message?: string };
  return candidate.response?.data?.message || candidate.message || "Não foi possível atualizar a integração.";
}

function safeReturnTo(value?: string) {
  return value?.startsWith("/nfe/processes/") ? value : "/nfe/processes";
}

async function fetchOrganizationConnection() {
  const response = await nfeApi.listProviderConnections({
    provider: "portal_unico",
    environment: "production",
    status: "active",
    limit: 100,
  });
  return response.items.find((item) => !item.importer_id) || null;
}

export function OrganizationIntegrationsManager({ returnTo }: { returnTo?: string }) {
  const toast = useToast();
  const [connection, setConnection] = useState<ProviderConnectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isAdmin = hasRole("admin");
  const backHref = safeReturnTo(returnTo);

  const loadConnection = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setConnection(await fetchOrganizationConnection());
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchOrganizationConnection()
      .then((value) => {
        if (active) setConnection(value);
      })
      .catch((error) => {
        if (active) setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submitConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const credentialsRef = String(form.get("credentials_ref") || "").trim();
    if (!credentialsRef) {
      toast.info("Informe a referência segura que contém as credenciais do Portal Único.");
      return;
    }

    setSaving(true);
    try {
      await nfeApi.saveProviderConnection({
        importer_id: null,
        provider: "portal_unico",
        environment: "production",
        auth_type: "api_key",
        status: "active",
        credentials_ref: credentialsRef,
        config_json: { role_type: "IMPEXP" },
      });
      await loadConnection();
      toast.success("Integração organizacional com o Portal Único atualizada.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return (
      <main className="w-full min-h-screen p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <Button variant="outline" asChild><Link href={backHref}><ArrowLeft /> Voltar ao processo</Link></Button>
          <Alert>
            <CircleAlert />
            <AlertTitle>Configuração restrita</AlertTitle>
            <AlertDescription>
              Somente administradores da organização podem alterar a integração com o Portal Único. Solicite a configuração a um administrador e retome o processo depois.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Integrações da organização</h1>
            <p className="text-sm text-muted-foreground">Credenciais compartilhadas pelos processos da organização.</p>
          </div>
          <Button variant="outline" asChild><Link href={backHref}><ArrowLeft /> Voltar ao processo</Link></Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2"><PlugZap className="size-5" /> Portal Único</CardTitle>
                <CardDescription>Conexão utilizada para consultar e importar as DUIMPs.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadConnection()} disabled={loading || saving}>
                <RefreshCw className={loading ? "animate-spin" : ""} /> Atualizar status
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? <p className="text-sm text-muted-foreground">Consultando a integração…</p> : null}
            {loadError ? <Alert variant="destructive"><CircleAlert /><AlertTitle>Falha ao consultar</AlertTitle><AlertDescription>{loadError}</AlertDescription></Alert> : null}
            {!loading && !loadError && connection ? (
              <Alert className="border-emerald-500/30 bg-emerald-500/5">
                <Check />
                <AlertTitle>Conexão ativa</AlertTitle>
                <AlertDescription>Os processos da organização já podem importar DUIMPs pelo Portal Único.</AlertDescription>
              </Alert>
            ) : null}
            {!loading && !loadError && !connection ? (
              <Alert>
                <CircleAlert />
                <AlertTitle>Conexão pendente</AlertTitle>
                <AlertDescription>Cadastre a referência das credenciais para liberar a importação de DUIMPs.</AlertDescription>
              </Alert>
            ) : null}

            {connection?.last_error ? (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>Última falha registrada</AlertTitle>
                <AlertDescription>{connection.last_error}</AlertDescription>
              </Alert>
            ) : null}

            <form className="space-y-4" onSubmit={submitConnection}>
              <div className="space-y-1.5">
                <Label htmlFor="portal-credentials-ref">Referência segura das credenciais</Label>
                <Input id="portal-credentials-ref" name="credentials_ref" defaultValue="gcp:PORTAL_UNICO" required />
                <p className="text-xs text-muted-foreground">
                  A referência aponta para o Client ID e o Client Secret mantidos no gerenciador de segredos. Os valores das chaves não são armazenados neste formulário.
                </p>
              </div>
              <Button disabled={saving || loading}>
                {saving ? <Loader2 className="animate-spin" /> : <Check />}
                {connection ? "Atualizar integração" : "Ativar integração"}
              </Button>
            </form>

            <Alert>
              <CircleAlert />
              <AlertTitle>Credenciais diferentes do certificado da NF-e</AlertTitle>
              <AlertDescription>
                Esta integração serve somente para consultar DUIMPs. O certificado A1 do cliente será cadastrado e validado no futuro fluxo de assinatura da NF-e.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
