"use client";

import { FormEvent, ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { usersApi } from "@/lib/api/services/users";
import type { CreateUserPayload, UserSummary } from "@/lib/api/types/dashboard-api";

const emptyForm: CreateUserPayload = {
  nome: "",
  email: "",
  password: "",
  role: "comercial",
  setor: "",
};

type UserFormSheetProps = {
  user?: UserSummary;
  trigger: ReactNode;
  onSaved: () => Promise<void> | void;
};

export function UserFormSheet({ user, trigger, onSaved }: UserFormSheetProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateUserPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(user);

  const getInitialForm = () => {
    if (!user) return emptyForm;

    return {
      nome: user.nome,
      email: user.email,
      password: "",
      role: user.role,
      setor: user.setor,
    };
  };

  const onOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setForm(getInitialForm());
    }

    setOpen(nextOpen);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (user) {
        await usersApi.updateUser(user.id, form);
        toast.success("Usuário atualizado com sucesso.");
      } else {
        await usersApi.createUser(form);
        toast.success("Usuário criado com sucesso.");
      }

      setOpen(false);
      setForm(emptyForm);
      await onSaved();
    } catch {
      toast.error("Não foi possível salvar o usuário.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader className="p-5">
          <SheetTitle>{isEditing ? "Editar usuário" : "Criar usuário"}</SheetTitle>
        </SheetHeader>
        <form className="mt-6 grid gap-3 p-5" onSubmit={onSubmit}>
          <Field label="Nome">
            <Input
              value={form.nome}
              onChange={(event) => setForm({ ...form, nome: event.target.value })}
              required
            />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </Field>
          <Field label="Senha">
            <Input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required={!isEditing}
            />
          </Field>
          <Field label="Setor">
            <Input
              value={form.setor}
              onChange={(event) => setForm({ ...form, setor: event.target.value })}
              required
            />
          </Field>
          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select
              value={form.role}
              onValueChange={(value) => setForm({ ...form, role: value as CreateUserPayload["role"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="credenciamento">Credenciamento</SelectItem>
                <SelectItem value="operacao">Operação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
