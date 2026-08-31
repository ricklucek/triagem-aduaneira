"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BadgeDollarSign,
  Link2,
  MapPin,
  PencilLine,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";

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
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { prepostosApi } from "@/lib/api/services/prepostos";
import type {
  PrepostoAdmin,
  PrepostoContact,
  PrepostoCredential,
  PrepostoLocality,
  PrepostoTariff,
} from "@/lib/api/types/preposto-api";

type Props = {
  open: boolean;
  initial: PrepostoAdmin | null;
  credentials: PrepostoCredential[];
  onOpenChange: (open: boolean) => void;
  onChanged: () => Promise<void>;
  onCredentialsChanged: () => Promise<void>;
};

type TariffContext = {
  locality: PrepostoLocality;
  tariff: PrepostoTariff | null;
};

function apiError(error: unknown) {
  const candidate = error as {
    response?: {
      data?: { message?: string; errors?: Record<string, string[]> };
    };
    message?: string;
  };
  const errors = candidate.response?.data?.errors;
  return (
    (errors && Object.values(errors).flat()[0]) ||
    candidate.response?.data?.message ||
    candidate.message ||
    "Não foi possível concluir a operação."
  );
}

export function PrepostoEditor({
  open,
  initial,
  credentials,
  onOpenChange,
  onChanged,
  onCredentialsChanged,
}: Props) {
  const toast = useToast();
  const [entity, setEntity] = useState<PrepostoAdmin | null>(initial);
  const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState<PrepostoContact | null | undefined>();
  const [locality, setLocality] = useState<
    PrepostoLocality | null | undefined
  >();
  const [tariff, setTariff] = useState<TariffContext | undefined>();
  const [credential, setCredential] = useState<
    PrepostoCredential | null | undefined
  >();
  const [linkChoices, setLinkChoices] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setEntity(initial);
  }, [initial, open]);

  async function refresh(prepostoId = entity?.id) {
    if (!prepostoId) return;
    const updated = await prepostosApi.get(prepostoId);
    setEntity(updated);
    await onChanged();
  }

  async function run(action: () => Promise<void>, message: string) {
    setBusy(true);
    try {
      await action();
      toast.success(message);
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveGeneral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      nome: text(form, "nome"),
      razao_social: nullableText(form, "razao_social"),
      ativo: form.get("ativo") === "on",
      observacoes: nullableText(form, "observacoes"),
    };
    await run(
      async () => {
        if (entity) {
          await prepostosApi.update(entity.id, payload);
          await refresh(entity.id);
        } else {
          const created = await prepostosApi.create(payload);
          setEntity(created);
          await onChanged();
        }
      },
      entity
        ? "Dados do preposto atualizados."
        : "Preposto cadastrado. Complete os demais dados nas abas.",
    );
  }

  async function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entity) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      nome: text(form, "nome"),
      email: nullableText(form, "email"),
      telefone: nullableText(form, "telefone"),
      whatsapp: nullableText(form, "whatsapp"),
      principal: form.get("principal") === "on",
    };
    await run(
      async () => {
        if (contact)
          await prepostosApi.updateContact(entity.id, contact.id, payload);
        else await prepostosApi.createContact(entity.id, payload);
        setContact(undefined);
        await refresh();
      },
      contact ? "Contato atualizado." : "Contato adicionado.",
    );
  }

  async function saveLocality(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entity) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      cidade: text(form, "cidade"),
      uf: nullableText(form, "uf")?.toUpperCase() ?? null,
      descricao_local: nullableText(form, "descricao_local"),
      tipo_local: nullableText(form, "tipo_local"),
      atende_importacao: form.get("atende_importacao") === "on",
      atende_exportacao: form.get("atende_exportacao") === "on",
      valor_importacao: decimal(form, "valor_importacao"),
      valor_exportacao: decimal(form, "valor_exportacao"),
      valor_importacao_descricao: nullableText(
        form,
        "valor_importacao_descricao",
      ),
      valor_exportacao_descricao: nullableText(
        form,
        "valor_exportacao_descricao",
      ),
      moeda: text(form, "moeda") || "BRL",
      observacoes: nullableText(form, "observacoes"),
    };
    await run(
      async () => {
        if (locality)
          await prepostosApi.updateLocality(entity.id, locality.id, payload);
        else await prepostosApi.createLocality(entity.id, payload);
        setLocality(undefined);
        await refresh();
      },
      locality ? "Localidade atualizada." : "Localidade adicionada.",
    );
  }

  async function saveTariff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entity || !tariff) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      codigo: text(form, "codigo"),
      operacao: text(form, "operacao") as "IMPORTACAO" | "EXPORTACAO" | "AMBAS",
      tipo: text(form, "tipo"),
      valor: decimal(form, "valor"),
      valor_descricao: nullableText(form, "valor_descricao"),
      condicao: nullableText(form, "condicao"),
      principal: form.get("principal") === "on",
      moeda: text(form, "moeda") || "BRL",
      ativo: form.get("ativo") === "on",
      observacoes: nullableText(form, "observacoes"),
    };
    await run(
      async () => {
        if (tariff.tariff) {
          await prepostosApi.updateTariff(
            entity.id,
            tariff.locality.id,
            tariff.tariff.id,
            payload,
          );
        } else {
          await prepostosApi.createTariff(
            entity.id,
            tariff.locality.id,
            payload,
          );
        }
        setTariff(undefined);
        await refresh();
      },
      tariff.tariff ? "Tarifa atualizada." : "Tarifa adicionada.",
    );
  }

  async function saveCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      nome: text(form, "nome"),
      cpf: text(form, "cpf"),
      registro_rfb: nullableText(form, "registro_rfb"),
      categoria: text(form, "categoria") || "DESPACHANTE",
      ativo: form.get("ativo") === "on",
      observacoes: nullableText(form, "observacoes"),
    };
    await run(
      async () => {
        if (credential)
          await prepostosApi.updateCredential(credential.id, payload);
        else await prepostosApi.createCredential(payload);
        setCredential(undefined);
        await onCredentialsChanged();
        if (entity) await refresh();
      },
      credential ? "Credenciado atualizado." : "Credenciado cadastrado.",
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
          <SheetHeader>
            <SheetTitle>
              {entity ? `Gerenciar ${entity.nome}` : "Novo preposto"}
            </SheetTitle>
            <SheetDescription>
              As alterações de cada seção são salvas diretamente no catálogo.
            </SheetDescription>
          </SheetHeader>
          <Tabs defaultValue="general" className="mt-6">
            <TabsList className="h-auto w-full flex-wrap justify-start">
              <TabsTrigger value="general">Dados gerais</TabsTrigger>
              <TabsTrigger value="contacts" disabled={!entity}>
                Contatos
              </TabsTrigger>
              <TabsTrigger value="localities" disabled={!entity}>
                Localidades e tarifas
              </TabsTrigger>
              <TabsTrigger value="credentials" disabled={!entity}>
                Credenciados
              </TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="pt-4">
              <GeneralForm entity={entity} busy={busy} onSubmit={saveGeneral} />
            </TabsContent>
            <TabsContent value="contacts" className="space-y-4 pt-4">
              <SectionHeader
                title="Contatos"
                action="Adicionar contato"
                onAction={() => setContact(null)}
              />
              {entity?.contatos.map((item) => (
                <RecordCard
                  key={item.id}
                  title={item.nome}
                  description={
                    [item.email, item.telefone, item.whatsapp]
                      .filter(Boolean)
                      .join(" · ") || "Sem canais informados"
                  }
                  badges={item.principal ? ["Principal"] : []}
                  onEdit={() => setContact(item)}
                  onDelete={() =>
                    void run(async () => {
                      await prepostosApi.removeContact(entity.id, item.id);
                      await refresh();
                    }, "Contato excluído.")
                  }
                />
              ))}
              {!entity?.contatos.length && (
                <EmptyState text="Nenhum contato cadastrado." />
              )}
            </TabsContent>
            <TabsContent value="localities" className="space-y-4 pt-4">
              <SectionHeader
                title="Localidades, valores e tarifas"
                action="Adicionar localidade"
                onAction={() => setLocality(null)}
              />
              {entity?.localidades.map((item) => (
                <LocalityCard
                  key={item.id}
                  locality={item}
                  credentials={credentials}
                  linked={entity.credenciados.filter((entry) =>
                    entry.localidade_ids.includes(item.id),
                  )}
                  linkChoice={linkChoices[item.id] || ""}
                  onLinkChoice={(value) =>
                    setLinkChoices((current) => ({
                      ...current,
                      [item.id]: value,
                    }))
                  }
                  onEdit={() => setLocality(item)}
                  onDelete={() =>
                    void run(async () => {
                      await prepostosApi.removeLocality(entity.id, item.id);
                      await refresh();
                    }, "Localidade excluída.")
                  }
                  onNewTariff={() =>
                    setTariff({ locality: item, tariff: null })
                  }
                  onEditTariff={(selected) =>
                    setTariff({ locality: item, tariff: selected })
                  }
                  onDeleteTariff={(selected) =>
                    void run(async () => {
                      await prepostosApi.removeTariff(
                        entity.id,
                        item.id,
                        selected.id,
                      );
                      await refresh();
                    }, "Tarifa excluída.")
                  }
                  onLink={() =>
                    void run(async () => {
                      const selected = linkChoices[item.id];
                      if (!selected)
                        throw new Error("Selecione um credenciado.");
                      await prepostosApi.linkCredential(
                        entity.id,
                        item.id,
                        selected,
                      );
                      setLinkChoices((current) => ({
                        ...current,
                        [item.id]: "",
                      }));
                      await refresh();
                    }, "Credenciado vinculado.")
                  }
                  onUnlink={(credentialId) =>
                    void run(async () => {
                      await prepostosApi.unlinkCredential(
                        entity.id,
                        item.id,
                        credentialId,
                      );
                      await refresh();
                    }, "Vínculo removido.")
                  }
                />
              ))}
              {!entity?.localidades.length && (
                <EmptyState text="Nenhuma localidade cadastrada." />
              )}
            </TabsContent>
            <TabsContent value="credentials" className="space-y-4 pt-4">
              <SectionHeader
                title="Cadastro de despachantes credenciados"
                action="Novo credenciado"
                onAction={() => setCredential(null)}
              />
              <p className="text-sm text-muted-foreground">
                Após cadastrar, vincule o despachante às localidades na aba
                anterior.
              </p>
              {credentials.map((item) => (
                <RecordCard
                  key={item.id}
                  title={item.nome}
                  description={[
                    formatCpf(item.cpf),
                    item.registro_rfb,
                    item.categoria,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  badges={[item.ativo ? "Ativo" : "Inativo"]}
                  onEdit={() => setCredential(item)}
                  onDelete={() =>
                    void run(async () => {
                      await prepostosApi.removeCredential(item.id);
                      await onCredentialsChanged();
                      await refresh();
                    }, "Credenciado desativado.")
                  }
                />
              ))}
              {!credentials.length && (
                <EmptyState text="Nenhum despachante credenciado cadastrado." />
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <ContactDialog
        value={contact}
        open={contact !== undefined}
        busy={busy}
        onOpenChange={(next) => {
          if (!next) setContact(undefined);
        }}
        onSubmit={saveContact}
      />
      <LocalityDialog
        value={locality}
        open={locality !== undefined}
        busy={busy}
        onOpenChange={(next) => {
          if (!next) setLocality(undefined);
        }}
        onSubmit={saveLocality}
      />
      <TariffDialog
        context={tariff}
        open={tariff !== undefined}
        busy={busy}
        onOpenChange={(next) => {
          if (!next) setTariff(undefined);
        }}
        onSubmit={saveTariff}
      />
      <CredentialDialog
        value={credential}
        open={credential !== undefined}
        busy={busy}
        onOpenChange={(next) => {
          if (!next) setCredential(undefined);
        }}
        onSubmit={saveCredential}
      />
    </>
  );
}

function GeneralForm({
  entity,
  busy,
  onSubmit,
}: {
  entity: PrepostoAdmin | null;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome *">
          <Input name="nome" defaultValue={entity?.nome || ""} required />
        </Field>
        <Field label="Razão social">
          <Input
            name="razao_social"
            defaultValue={entity?.razao_social || ""}
          />
        </Field>
      </div>
      <Check
        name="ativo"
        label="Preposto ativo"
        defaultChecked={entity?.ativo ?? true}
      />
      <Field label="Observações">
        <Textarea
          name="observacoes"
          defaultValue={entity?.observacoes || ""}
          rows={5}
        />
      </Field>
      <Button type="submit" disabled={busy}>
        {busy
          ? "Salvando..."
          : entity
            ? "Salvar dados gerais"
            : "Criar e continuar"}
      </Button>
    </form>
  );
}

function ContactDialog({
  value,
  open,
  busy,
  onOpenChange,
  onSubmit,
}: {
  value: PrepostoContact | null | undefined;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={value ? "Editar contato" : "Novo contato"}
      description="Informe os canais usados na operação."
      busy={busy}
      onSubmit={onSubmit}
    >
      <Field label="Nome *">
        <Input name="nome" defaultValue={value?.nome || ""} required />
      </Field>
      <Field label="E-mail">
        <Input name="email" type="email" defaultValue={value?.email || ""} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefone">
          <Input name="telefone" defaultValue={value?.telefone || ""} />
        </Field>
        <Field label="WhatsApp">
          <Input name="whatsapp" defaultValue={value?.whatsapp || ""} />
        </Field>
      </div>
      <Check
        name="principal"
        label="Contato principal"
        defaultChecked={value?.principal ?? false}
      />
    </FormDialog>
  );
}

function LocalityDialog({
  value,
  open,
  busy,
  onOpenChange,
  onSubmit,
}: {
  value: PrepostoLocality | null | undefined;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={value ? "Editar localidade" : "Nova localidade"}
      description="Configure operações e valores-base por local de entrada."
      busy={busy}
      onSubmit={onSubmit}
      wide
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
        <Field label="Cidade *">
          <Input name="cidade" defaultValue={value?.cidade || ""} required />
        </Field>
        <Field label="UF">
          <Input name="uf" maxLength={2} defaultValue={value?.uf || ""} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Descrição do local">
          <Input
            name="descricao_local"
            defaultValue={value?.descricao_local || ""}
          />
        </Field>
        <Field label="Tipo">
          <select
            name="tipo_local"
            defaultValue={value?.tipo_local || ""}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Selecione</option>
            {["CIDADE", "PORTO", "AEROPORTO", "CLIA", "FRONTEIRA"].map(
              (option) => (
                <option key={option}>{option}</option>
              ),
            )}
          </select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-6">
        <Check
          name="atende_importacao"
          label="Atende importação"
          defaultChecked={value?.atende_importacao ?? true}
        />
        <Check
          name="atende_exportacao"
          label="Atende exportação"
          defaultChecked={value?.atende_exportacao ?? false}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Valor-base de importação">
          <Input
            name="valor_importacao"
            inputMode="decimal"
            defaultValue={value?.valor_importacao ?? ""}
          />
        </Field>
        <Field label="Descrição do valor de importação">
          <Input
            name="valor_importacao_descricao"
            defaultValue={value?.valor_importacao_descricao || ""}
          />
        </Field>
        <Field label="Valor-base de exportação">
          <Input
            name="valor_exportacao"
            inputMode="decimal"
            defaultValue={value?.valor_exportacao ?? ""}
          />
        </Field>
        <Field label="Descrição do valor de exportação">
          <Input
            name="valor_exportacao_descricao"
            defaultValue={value?.valor_exportacao_descricao || ""}
          />
        </Field>
      </div>
      <Field label="Moeda">
        <Input name="moeda" defaultValue={value?.moeda || "BRL"} />
      </Field>
      <Field label="Observações">
        <Textarea name="observacoes" defaultValue={value?.observacoes || ""} />
      </Field>
    </FormDialog>
  );
}

function TariffDialog({
  context,
  open,
  busy,
  onOpenChange,
  onSubmit,
}: {
  context: TariffContext | undefined;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const value = context?.tariff;
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={value ? "Editar tarifa" : "Nova tarifa condicional"}
      description="A tarifa ficará disponível para seleção no formulário do escopo."
      busy={busy}
      onSubmit={onSubmit}
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Código *">
          <Input name="codigo" defaultValue={value?.codigo || ""} required />
        </Field>
        <Field label="Tipo *">
          <Input
            name="tipo"
            defaultValue={value?.tipo || "CONDICIONAL"}
            required
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Operação *">
          <select
            name="operacao"
            defaultValue={value?.operacao || "IMPORTACAO"}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="IMPORTACAO">Importação</option>
            <option value="EXPORTACAO">Exportação</option>
            <option value="AMBAS">Ambas</option>
          </select>
        </Field>
        <Field label="Condição">
          <Input
            name="condicao"
            defaultValue={value?.condicao || ""}
            placeholder="Ex.: carga excedente ou cliente específico"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Valor">
          <Input
            name="valor"
            inputMode="decimal"
            defaultValue={value?.valor ?? ""}
          />
        </Field>
        <Field label="Descrição do valor">
          <Input
            name="valor_descricao"
            defaultValue={value?.valor_descricao || ""}
          />
        </Field>
        <Field label="Moeda">
          <Input name="moeda" defaultValue={value?.moeda || "BRL"} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-6">
        <Check
          name="principal"
          label="Tarifa principal"
          defaultChecked={value?.principal ?? false}
        />
        <Check
          name="ativo"
          label="Tarifa ativa"
          defaultChecked={value?.ativo ?? true}
        />
      </div>
      <Field label="Observações">
        <Textarea name="observacoes" defaultValue={value?.observacoes || ""} />
      </Field>
    </FormDialog>
  );
}

function CredentialDialog({
  value,
  open,
  busy,
  onOpenChange,
  onSubmit,
}: {
  value: PrepostoCredential | null | undefined;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={value ? "Editar credenciado" : "Novo credenciado"}
      description="O CPF completo fica restrito à área administrativa."
      busy={busy}
      onSubmit={onSubmit}
    >
      <Field label="Nome *">
        <Input name="nome" defaultValue={value?.nome || ""} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="CPF *">
          <Input name="cpf" defaultValue={value?.cpf || ""} required />
        </Field>
        <Field label="Registro RFB">
          <Input name="registro_rfb" defaultValue={value?.registro_rfb || ""} />
        </Field>
      </div>
      <Field label="Categoria">
        <Input
          name="categoria"
          defaultValue={value?.categoria || "DESPACHANTE"}
        />
      </Field>
      <Check
        name="ativo"
        label="Credenciado ativo"
        defaultChecked={value?.ativo ?? true}
      />
      <Field label="Observações">
        <Textarea name="observacoes" defaultValue={value?.observacoes || ""} />
      </Field>
    </FormDialog>
  );
}

function LocalityCard({
  locality,
  credentials,
  linked,
  linkChoice,
  onLinkChoice,
  onEdit,
  onDelete,
  onNewTariff,
  onEditTariff,
  onDeleteTariff,
  onLink,
  onUnlink,
}: {
  locality: PrepostoLocality;
  credentials: PrepostoCredential[];
  linked: PrepostoAdmin["credenciados"];
  linkChoice: string;
  onLinkChoice: (value: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onNewTariff: () => void;
  onEditTariff: (tariff: PrepostoTariff) => void;
  onDeleteTariff: (tariff: PrepostoTariff) => void;
  onLink: () => void;
  onUnlink: (credentialId: string) => void;
}) {
  const available = credentials.filter(
    (item) => item.ativo && !linked.some((entry) => entry.id === item.id),
  );
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4" /> {locality.cidade}
            {locality.uf ? ` / ${locality.uf}` : ""}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {locality.descricao_local || locality.tipo_local || "Sem descrição"}
          </p>
          <div className="mt-2 flex gap-1">
            {locality.atende_importacao && (
              <Badge variant="outline">Importação</Badge>
            )}
            {locality.atende_exportacao && (
              <Badge variant="outline">Exportação</Badge>
            )}
          </div>
        </div>
        <div>
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <PencilLine />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Tarifas</h4>
            <Button size="sm" variant="outline" onClick={onNewTariff}>
              <Plus /> Tarifa
            </Button>
          </div>
          {locality.tarifas.map((item) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">
                    {item.condicao || item.tipo}
                  </div>
                  <div className="text-muted-foreground">
                    {item.operacao} ·{" "}
                    {money(item.valor, item.moeda, item.valor_descricao)}
                  </div>
                </div>
                <div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditTariff(item)}
                  >
                    <PencilLine />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => onDeleteTariff(item)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!locality.tarifas.length && (
            <EmptyState text="Sem tarifas adicionais." />
          )}
        </section>
        <section className="space-y-3">
          <h4 className="font-medium">Credenciados nesta localidade</h4>
          {linked.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border p-3 text-sm"
            >
              <div>
                <div className="font-medium">{item.nome}</div>
                <div className="text-muted-foreground">
                  {[item.cpf_mascarado, item.registro_rfb]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => onUnlink(item.id)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Select value={linkChoice} onValueChange={onLinkChoice}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um credenciado" />
              </SelectTrigger>
              <SelectContent>
                {available.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={onLink} disabled={!linkChoice}>
              <Link2 /> Vincular
            </Button>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  busy,
  onSubmit,
  wide = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          wide
            ? "max-h-[90vh] overflow-y-auto sm:max-w-3xl"
            : "max-h-[90vh] overflow-y-auto sm:max-w-xl"
        }
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RecordCard({
  title,
  description,
  badges,
  onEdit,
  onDelete,
}: {
  title: string;
  description: string;
  badges: string[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2 font-medium">
          <UserRound className="size-4" /> {title}
          {badges.map((badge) => (
            <Badge key={badge} variant="secondary">
              {badge}
            </Badge>
          ))}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <PencilLine />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      <Button size="sm" onClick={onAction}>
        <Plus /> {action}
      </Button>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 accent-primary"
      />{" "}
      {label}
    </label>
  );
}
function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
function text(form: FormData, name: string) {
  return String(form.get(name) || "").trim();
}
function nullableText(form: FormData, name: string) {
  return text(form, name) || null;
}
function decimal(form: FormData, name: string) {
  const value = text(form, name).replace(",", ".");
  return value ? Number(value) : null;
}
function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11
    ? digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
    : value;
}
function money(
  value: number | null,
  currency: string,
  description: string | null,
) {
  if (description) return description;
  if (value === null) return "Valor não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(Number(value));
}
