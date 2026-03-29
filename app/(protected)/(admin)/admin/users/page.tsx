"use client";

import { FormEvent, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hasRole } from "@/lib/auth/guard";
import { useUsers } from "@/lib/api/hooks/use-dashboards";
import { usersApi } from "@/lib/api/services/users";
import type { CreateUserPayload } from "@/lib/api/types/dashboard-api";

export default function AdminUsersPage() {
  const { data, isLoading, mutate } = useUsers();
  const [form, setForm] = useState<CreateUserPayload>({
    nome: "",
    email: "",
    password: "",
    role: "comercial",
    setor: "",
  });

  if (!hasRole("admin")) return <p>Acesso restrito ao administrador.</p>;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await usersApi.createUser(form);
    setForm({
      nome: "",
      email: "",
      password: "",
      role: "comercial",
      setor: "",
    });
    await mutate();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        Usuários (somente administrador)
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Criar usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
            <Field label="Nome">
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </Field>
            <Field label="Senha">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </Field>
            <Field label="Setor">
              <Input
                value={form.setor}
                onChange={(e) => setForm({ ...form, setor: e.target.value })}
                required
              />
            </Field>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm({ ...form, role: value as CreateUserPayload["role"] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="credenciamento">Credenciamento</SelectItem>
                  <SelectItem value="operacao">Operação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit">Criar usuário</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários cadastrados</CardTitle>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
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
