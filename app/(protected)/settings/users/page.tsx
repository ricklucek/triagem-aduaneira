"use client";

import { FormEvent, useState } from "react";
import { Ellipsis, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasRole } from "@/lib/auth/guard";
import { useUsers } from "@/lib/api/hooks/use-dashboards";
import { usersApi } from "@/lib/api/services/users";
import type { CreateUserPayload, UserSummary } from "@/lib/api/types/dashboard-api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { set } from "zod";

const emptyForm: CreateUserPayload = { nome: "", email: "", password: "", role: "comercial", setor: "" };

export default function SettingsUsersPage() {
  const { data, isLoading, mutate } = useUsers();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateUserPayload>(emptyForm);

  const [submitting, setSubmitting] = useState(false);

  if (!hasRole("admin")) return <p>Acesso restrito ao administrador.</p>;

  const onSubmit = async (event: FormEvent) => {
    setSubmitting(true);
    event.preventDefault();
    if (editingId) {
      await usersApi.updateUser(editingId, form);
    } else {
      await usersApi.createUser(form);
    }
    setSubmitting(false);
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    await mutate();
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (user: UserSummary) => {
    setEditingId(user.id);
    setForm({ nome: user.nome, email: user.email, password: "", role: user.role, setor: user.setor });
    setOpen(true);
  };

  const onDelete = async (user: UserSummary) => {
    if (user.role !== "administrador") {
      await usersApi.deleteUser(user.id);
      await mutate();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar usuários</CardTitle>
        <Button onClick={openCreate}>Criar usuário</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Carregando usuários...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.nome}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.setor}</TableCell>
                  <TableCell>{user.ativo ? "Ativo" : "Inativo"}</TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="inline-flex size-8 items-center justify-center rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
                          aria-label="Abrir menu de opções"
                        >
                          <Ellipsis className="h-5 w-5 text-white-light" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="popover-menu-container right-0 w-56">
                        <div className="flex w-full flex-col gap-4">
                          <div className="popover-menu-item">
                            <Button variant="ghost" className="w-full justify-start" onClick={() => openEdit(user)}>Editar</Button>
                          </div>
                          <div className="popover-menu-item">
                            <Button variant="destructive" className="w-full justify-start" onClick={() => onDelete(user)}>Excluir</Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader className="p-5">
            <SheetTitle>{editingId ? "Editar usuário" : "Criar usuário"}</SheetTitle>
          </SheetHeader>
          <form className="mt-6 grid gap-3 p-5" onSubmit={onSubmit}>
            <Field label="Nome"><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></Field>
            <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
            <Field label="Senha"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} /></Field>
            <Field label="Setor"><Input value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })} required /></Field>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as CreateUserPayload['role'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
