"use client";

import { FormEvent, useState } from "react";
import { MoreHorizontal } from "lucide-react";
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

const emptyForm: CreateUserPayload = { nome: "", email: "", password: "", role: "comercial", setor: "" };

export default function SettingsUsersPage() {
  const { data, isLoading, mutate } = useUsers();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateUserPayload>(emptyForm);

  if (!hasRole("admin")) return <p>Acesso restrito ao administrador.</p>;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (editingId) {
      await usersApi.updateUser(editingId, form);
    } else {
      await usersApi.createUser(form);
    }
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

  const onDelete = async (id: string) => {
    await usersApi.deleteUser(id);
    await mutate();
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
                    <details className="relative">
                      <summary className="flex cursor-pointer list-none justify-center"><MoreHorizontal className="size-4" /></summary>
                      <div className="absolute right-0 z-10 mt-1 w-32 rounded-md border bg-background p-1 shadow">
                        <Button variant="ghost" className="w-full justify-start" onClick={() => openEdit(user)}>Editar</Button>
                        <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => onDelete(user.id)}>Excluir</Button>
                      </div>
                    </details>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar usuário" : "Criar usuário"}</SheetTitle>
          </SheetHeader>
          <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
            <Field label="Nome"><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></Field>
            <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
            <Field label="Senha"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} /></Field>
            <Field label="Setor"><Input value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })} required /></Field>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as CreateUserPayload['role'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="credenciamento">Credenciamento</SelectItem>
                  <SelectItem value="operacao">Operação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Salvar</Button>
          </form>
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
