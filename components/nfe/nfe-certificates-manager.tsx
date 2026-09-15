"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CircleAlert,
  KeyRound,
  Loader2,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { getSessionRole } from "@/lib/api/hooks/use-auth";
import { clientsApi } from "@/lib/api/services/clients";
import { nfeApi } from "@/lib/api/services/nfe";
import type { ClientApi } from "@/lib/api/types/client-api";
import type {
  FiscalCertificate,
  FiscalCertificateStatus,
} from "@/lib/api/types/nfe-api";

const MAX_CERTIFICATE_BYTES = 64 * 1024;

const statusLabels: Record<FiscalCertificateStatus, string> = {
  pending_validation: "Aguardando validação",
  active: "Ativo",
  expired: "Expirado",
  revoked: "Revogado",
  disabled: "Inativo",
  invalid: "Inválido",
};

function apiError(error: unknown) {
  const candidate = error as {
    response?: {
      data?: { message?: string; messages?: Record<string, string[]> };
    };
    message?: string;
  };
  const messages = candidate.response?.data?.messages;
  return (
    candidate.response?.data?.message ||
    (messages ? Object.values(messages).flat().find(Boolean) : undefined) ||
    candidate.message ||
    "Não foi possível concluir a operação."
  );
}

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 14
    ? digits.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5",
      )
    : value;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

function statusVariant(status: FiscalCertificateStatus) {
  if (status === "active") return "default" as const;
  if (["expired", "revoked", "invalid"].includes(status)) {
    return "destructive" as const;
  }
  return "secondary" as const;
}

function validityMessage(certificate: FiscalCertificate) {
  const days = certificate.expires_in_days;
  if (days === null || days === undefined) return "Validade não identificada";
  if (days < 0) return `Vencido há ${Math.abs(days)} dia(s)`;
  if (days === 0) return "Vence hoje";
  return `Vence em ${days} dia(s)`;
}

export function NfeCertificatesManager() {
  const toast = useToast();
  const isAdmin = getSessionRole() === "admin";
  const [clients, setClients] = useState<ClientApi[]>([]);
  const [clientQuery, setClientQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [certificates, setCertificates] = useState<FiscalCertificate[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId],
  );

  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const response = await clientsApi.listClients({
        q: clientQuery.trim() || undefined,
        ativo: true,
        limit: 100,
      });
      setClients(response.items);
      setSelectedClientId((current) => {
        if (response.items.some((client) => client.id === current)) {
          return current;
        }
        return response.items[0]?.id || "";
      });
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setLoadingClients(false);
    }
  }, [clientQuery, toast]);

  const loadCertificates = useCallback(async () => {
    if (!selectedClientId) {
      setCertificates([]);
      return;
    }
    setLoadingCertificates(true);
    try {
      setCertificates(
        await nfeApi.listFiscalCertificates(selectedClientId),
      );
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setLoadingCertificates(false);
    }
  }, [selectedClientId, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadClients(), 250);
    return () => window.clearTimeout(timer);
  }, [loadClients]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCertificates(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCertificates]);

  async function uploadCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClientId) return;
    const form = new FormData(event.currentTarget);
    const certificate = form.get("certificate");
    const password = String(form.get("password") || "");
    const activate = form.get("activate") === "on";
    if (!(certificate instanceof File) || !certificate.name) {
      toast.info("Selecione um arquivo .pfx ou .p12.");
      return;
    }
    if (certificate.size > MAX_CERTIFICATE_BYTES) {
      toast.error("O arquivo excede o limite de 64 KiB do Secret Manager.");
      return;
    }
    setBusy("upload");
    try {
      await nfeApi.uploadFiscalCertificate(selectedClientId, {
        certificate,
        password,
        environment: "production",
        activate,
      });
      setUploadOpen(false);
      setUploadKey((value) => value + 1);
      await loadCertificates();
      toast.success(
        activate
          ? "Certificado validado, armazenado e ativado."
          : "Certificado validado e armazenado como inativo.",
      );
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setBusy(null);
    }
  }

  async function runAction(
    certificate: FiscalCertificate,
    action: "validate" | "activate" | "deactivate",
  ) {
    if (!selectedClientId) return;
    if (
      action === "activate" &&
      !window.confirm(
        "Ativar este certificado? O certificado atualmente ativo será desativado.",
      )
    ) {
      return;
    }
    setBusy(`${action}:${certificate.id}`);
    try {
      if (action === "validate") {
        await nfeApi.validateFiscalCertificate(
          selectedClientId,
          certificate.id,
        );
      } else if (action === "activate") {
        await nfeApi.activateFiscalCertificate(
          selectedClientId,
          certificate.id,
        );
      } else {
        await nfeApi.deactivateFiscalCertificate(
          selectedClientId,
          certificate.id,
        );
      }
      await loadCertificates();
      toast.success(
        action === "validate"
          ? "Certificado validado novamente."
          : action === "activate"
            ? "Certificado ativado."
            : "Certificado desativado.",
      );
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
          <div className="flex items-center gap-2">
            <KeyRound className="size-6 text-primary" />
            <h1 className="text-2xl font-semibold">Certificados eCNPJ A1</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Certificados utilizados na futura assinatura das NF-e do cliente.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setUploadOpen(true)}
            disabled={!selectedClientId}
          >
            <Upload /> Enviar certificado
          </Button>
        )}
      </div>

      <Alert className="border-emerald-500/30 bg-emerald-500/5">
        <ShieldCheck />
        <AlertTitle>Armazenamento protegido</AlertTitle>
        <AlertDescription>
          O arquivo e a senha são validados pela API e armazenados em secrets
          separados e versionados. A interface nunca permite recuperar o PFX
          ou visualizar sua senha.
        </AlertDescription>
      </Alert>

      {!isAdmin && (
        <Alert>
          <CircleAlert />
          <AlertTitle>Consulta somente</AlertTitle>
          <AlertDescription>
            Apenas administradores podem enviar, ativar ou desativar
            certificados.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cliente emitente</CardTitle>
          <CardDescription>
            Pesquise e selecione o cliente cujo CNPJ será conferido no
            certificado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1.25fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              value={clientQuery}
              onChange={(event) => setClientQuery(event.target.value)}
              className="pl-9"
              placeholder="Pesquisar por razão social ou CNPJ"
            />
          </div>
          <select
            value={selectedClientId}
            onChange={(event) => setSelectedClientId(event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            disabled={loadingClients}
          >
            {!clients.length && <option value="">Nenhum cliente encontrado</option>}
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.razao_social} — {formatCnpj(client.cnpj)}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => void loadCertificates()}
            disabled={!selectedClientId || loadingCertificates}
          >
            <RefreshCw
              className={loadingCertificates ? "animate-spin" : ""}
            />
            Atualizar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificados cadastrados</CardTitle>
          <CardDescription>
            {selectedClient
              ? `${selectedClient.razao_social} · ${formatCnpj(selectedClient.cnpj)}`
              : "Selecione um cliente."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Identificação</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((certificate) => (
                  <TableRow key={certificate.id}>
                    <TableCell>
                      <Badge variant={statusVariant(certificate.status)}>
                        {statusLabels[certificate.status]}
                      </Badge>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Produção
                      </span>
                    </TableCell>
                    <TableCell>
                      <strong className="block">
                        {formatDate(certificate.valid_until)}
                      </strong>
                      <span className="text-xs text-muted-foreground">
                        {validityMessage(certificate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block">
                        CNPJ {formatCnpj(certificate.issuer_cnpj)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Série {certificate.certificate_serial_number || "—"}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        SHA-256 {certificate.certificate_fingerprint_sha256?.slice(0, 16) || "—"}…
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block">
                        {formatDate(certificate.created_at)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {certificate.created_by_name || "Usuário não identificado"}
                      </span>
                      {certificate.validation_error && (
                        <span className="mt-1 block max-w-xs text-xs text-destructive">
                          {certificate.validation_error}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isAdmin && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void runAction(certificate, "validate")}
                            disabled={Boolean(busy)}
                          >
                            {busy === `validate:${certificate.id}` ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <BadgeCheck />
                            )}
                            Validar
                          </Button>
                          {certificate.is_active ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void runAction(certificate, "deactivate")}
                              disabled={Boolean(busy)}
                            >
                              {busy === `deactivate:${certificate.id}` ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Power />
                              )}
                              Desativar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => void runAction(certificate, "activate")}
                              disabled={Boolean(busy) || certificate.status === "expired"}
                            >
                              {busy === `activate:${certificate.id}` ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Power />
                              )}
                              Ativar
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingCertificates && certificates.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Nenhum certificado cadastrado para este cliente.
                    </TableCell>
                  </TableRow>
                )}
                {loadingCertificates && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-28 text-center text-muted-foreground"
                    >
                      <Loader2 className="mx-auto mb-2 animate-spin" />
                      Carregando certificados…
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent key={uploadKey} className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Enviar certificado eCNPJ A1</DialogTitle>
            <DialogDescription>
              O CNPJ do certificado deve ser igual ao CNPJ fiscal de {selectedClient?.razao_social || "cliente selecionado"}.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={uploadCertificate}>
            <div className="space-y-1.5">
              <Label htmlFor="certificate">Arquivo do certificado</Label>
              <Input
                id="certificate"
                name="certificate"
                type="file"
                accept=".pfx,.p12,application/x-pkcs12"
                required
              />
              <p className="text-xs text-muted-foreground">
                Formatos .pfx ou .p12, com até 64 KiB.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="certificate-password">Senha do certificado</Label>
              <Input
                id="certificate-password"
                name="password"
                type="password"
                autoComplete="new-password"
                maxLength={1024}
                required
              />
            </div>
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <strong className="block">Ambiente: Produção</strong>
              <span className="text-muted-foreground">
                O certificado será registrado para as novas emissões em produção.
              </span>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm">
              <input
                className="mt-1"
                name="activate"
                type="checkbox"
                defaultChecked
              />
              <span>
                <strong className="block">Ativar após validar</strong>
                <span className="text-muted-foreground">
                  Se já existir um certificado ativo, ele será mantido no histórico como inativo.
                </span>
              </span>
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadOpen(false)}
                disabled={busy === "upload"}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy === "upload"}>
                {busy === "upload" && <Loader2 className="animate-spin" />}
                Validar e armazenar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
