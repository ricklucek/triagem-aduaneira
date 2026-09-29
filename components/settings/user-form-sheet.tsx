"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Check, Info, RotateCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { usersApi } from "@/lib/api/services/users";
import type { CreateUserPayload, UserSummary, UserTag } from "@/lib/api/types/dashboard-api";
import { cn } from "@/lib/utils";

type UserForm = CreateUserPayload;

function emptyForm(): UserForm {
  return {
    nome: "",
    email: "",
    password: "",
    role: "operacao",
    setor: "",
    ativo: true,
    tag_ids: [],
  };
}

function apiError(error: unknown) {
  const candidate = error as {
    response?: { data?: { message?: string; messages?: Record<string, string[]> } };
    message?: string;
  };
  const messages = candidate.response?.data?.messages;
  return candidate.response?.data?.message
    || (messages ? Object.values(messages).flat().find(Boolean) : undefined)
    || candidate.message
    || "Não foi possível salvar o usuário.";
}

type UserFormSheetProps = {
  user?: UserSummary;
  tags: UserTag[];
  trigger: ReactNode;
  onSaved: () => Promise<void> | void;
};

export function UserFormSheet({ user, tags, trigger, onSaved }: UserFormSheetProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(user);
  const activeTags = useMemo(
    () => tags.filter((tag) => tag.active || user?.tags.some((assigned) => assigned.id === tag.id)),
    [tags, user],
  );
  const adminTag = activeTags.find((tag) => tag.is_master);
  const adminSelected = Boolean(adminTag && form.tag_ids.includes(adminTag.id));

  const getInitialForm = (): UserForm => {
    if (!user) return emptyForm();
    return {
      nome: user.nome,
      email: user.email,
      password: "",
      role: user.role,
      setor: user.setor ?? "",
      ativo: user.ativo,
      tag_ids: user.tags.map((tag) => tag.id),
    };
  };

  const onOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setForm(getInitialForm());
    setOpen(nextOpen);
  };

  const setRole = (role: UserForm["role"]) => {
    setForm((current) => ({
      ...current,
      role,
      tag_ids: role === "admin"
        ? (adminTag ? [adminTag.id] : [])
        : current.tag_ids.filter((id) => id !== adminTag?.id),
    }));
  };

  const toggleTag = (tag: UserTag) => {
    if (!tag.active && !form.tag_ids.includes(tag.id)) return;
    setForm((current) => {
      const selected = current.tag_ids.includes(tag.id);
      if (tag.is_master) {
        return {
          ...current,
          role: selected ? "operacao" : "admin",
          tag_ids: selected ? [] : [tag.id],
        };
      }
      if (adminSelected) return current;
      return {
        ...current,
        tag_ids: selected
          ? current.tag_ids.filter((id) => id !== tag.id)
          : [...current.tag_ids, tag.id],
      };
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.role === "admin" && !adminTag) {
      toast.error("A tag mestre Admin não está disponível.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = isEditing && !form.password
        ? { ...form, password: undefined }
        : form;
      if (user) {
        await usersApi.updateUser(user.id, payload);
        toast.success("Usuário atualizado com sucesso.");
      } else {
        await usersApi.createUser(form);
        toast.success("Usuário criado com sucesso.");
      }
      setOpen(false);
      setForm(emptyForm());
      await onSaved();
    } catch (error) {
      toast.error(apiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>{isEditing ? "Editar usuário" : "Novo usuário"}</SheetTitle>
          <SheetDescription>
            Defina separadamente o acesso técnico e as funções operacionais desta pessoa.
          </SheetDescription>
        </SheetHeader>
        <form className="space-y-6 px-6 pb-8" onSubmit={onSubmit}>
          <section className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" htmlFor="user-name">
              <Input
                id="user-name"
                value={form.nome}
                onChange={(event) => setForm({ ...form, nome: event.target.value })}
                required
              />
            </Field>
            <Field label="E-mail" htmlFor="user-email">
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </Field>
            <Field label={isEditing ? "Nova senha (opcional)" : "Senha"} htmlFor="user-password">
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                minLength={8}
                required={!isEditing}
              />
            </Field>
            <Field label="Setor" htmlFor="user-sector">
              <Input
                id="user-sector"
                value={form.setor}
                onChange={(event) => setForm({ ...form, setor: event.target.value })}
                placeholder="Ex.: Operações"
                required
              />
            </Field>
          </section>

          <section className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Acesso ao sistema</Label>
              <Select value={form.role} onValueChange={(value) => setRole(value as UserForm["role"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="credenciamento">Credenciamento</SelectItem>
                  <SelectItem value="operacao">Operação</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Controla as permissões técnicas e menus disponíveis.</p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.ativo === false ? "inactive" : "active"}
                onValueChange={(value) => setForm({ ...form, ativo: value === "active" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Usuários inativos não podem acessar o sistema.</p>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <Label>Tags do perfil</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Use uma ou mais tags para classificar responsabilidades e alimentar os próximos filtros.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeTags.map((tag) => {
                const selected = form.tag_ids.includes(tag.id);
                const disabled = adminSelected && !tag.is_master;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={disabled}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "flex min-h-16 items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
                      disabled && "cursor-not-allowed opacity-45",
                    )}
                  >
                    <span className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                    )}>
                      {selected ? <Check className="size-3.5" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        {tag.is_master ? <ShieldCheck className="size-4" /> : null}
                        {tag.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {tag.description || "Sem descrição."}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {adminSelected ? (
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                <Info className="mt-0.5 size-4 shrink-0" />
                Admin é a tag mestre. Enquanto estiver selecionada, as demais tags ficam bloqueadas.
              </div>
            ) : null}
          </section>

          <div className="flex justify-end gap-2 border-t pt-5">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <RotateCw className="size-4 animate-spin" /> : null}
              {submitting ? "Salvando..." : "Salvar usuário"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
