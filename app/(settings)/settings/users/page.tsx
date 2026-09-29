"use client";

import { useMemo, useState } from "react";
import {
  Ellipsis,
  Pencil,
  Plus,
  RotateCw,
  Search,
  ShieldCheck,
  Tags,
  UserCheck,
  UserRoundPlus,
  UsersRound,
  UserX,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { UserFormSheet } from "@/components/settings/user-form-sheet";
import { UserTagBadge } from "@/components/settings/user-tag-badge";
import { UserTagManagerSheet } from "@/components/settings/user-tag-manager-sheet";
import { useUsers, useUserTags } from "@/lib/api/hooks/use-dashboards";
import { usersApi } from "@/lib/api/services/users";
import type { UserSummary } from "@/lib/api/types/dashboard-api";
import { hasRole } from "@/lib/auth/guard";

const roleLabels: Record<UserSummary["role"], string> = {
  admin: "Administrador",
  comercial: "Comercial",
  credenciamento: "Credenciamento",
  operacao: "Operação",
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function apiError(error: unknown) {
  const candidate = error as { response?: { data?: { message?: string } }; message?: string };
  return candidate.response?.data?.message || candidate.message || "Não foi possível alterar o usuário.";
}

export default function SettingsUsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [tagId, setTagId] = useState("all");
  const { data: usersData, isLoading, mutate: mutateUsers } = useUsers({ include_inactive: true });
  const { data: tagsData, isLoading: tagsLoading, mutate: mutateTags } = useUserTags(true);

  const users = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return (usersData ?? []).filter((user) => {
      if (status === "active" && !user.ativo) return false;
      if (status === "inactive" && user.ativo) return false;
      if (tagId !== "all" && !user.tags.some((tag) => tag.id === tagId)) return false;
      if (!query) return true;
      return [user.nome, user.email, user.setor ?? "", ...user.tags.map((tag) => tag.name)]
        .some((value) => value.toLocaleLowerCase("pt-BR").includes(query));
    });
  }, [usersData, search, status, tagId]);

  if (!hasRole("admin")) return <p>Acesso restrito ao administrador.</p>;

  const tags = tagsData ?? [];
  const activeCount = (usersData ?? []).filter((user) => user.ativo).length;
  const inactiveCount = (usersData ?? []).length - activeCount;
  const adminsCount = (usersData ?? []).filter((user) => user.role === "admin" && user.ativo).length;

  const refreshAll = async () => {
    await Promise.all([mutateUsers(), mutateTags()]);
  };

  const toggleStatus = async (user: UserSummary) => {
    try {
      if (user.ativo) {
        await usersApi.deleteUser(user.id);
        toast.success("Usuário inativado com sucesso.");
      } else {
        await usersApi.updateUser(user.id, { ativo: true });
        toast.success("Usuário reativado com sucesso.");
      }
      await mutateUsers();
    } catch (error) {
      toast.error(apiError(error));
    }
  };

  return (
    <main className="min-h-screen w-full space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Configurações da organização</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Usuários e perfis</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Gerencie acessos e classifique as responsabilidades da equipe com tags operacionais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <UserTagManagerSheet
            tags={tags}
            onSaved={refreshAll}
            trigger={(
              <Button variant="outline" disabled={tagsLoading}>
                <Tags className="size-4" /> Gerenciar tags
              </Button>
            )}
          />
          <UserFormSheet
            tags={tags}
            onSaved={refreshAll}
            trigger={(
              <Button disabled={tagsLoading}>
                <UserRoundPlus className="size-4" /> Novo usuário
              </Button>
            )}
          />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={UsersRound} label="Total de usuários" value={(usersData ?? []).length} />
        <MetricCard icon={UserCheck} label="Usuários ativos" value={activeCount} tone="emerald" />
        <MetricCard icon={UserX} label="Usuários inativos" value={inactiveCount} tone="slate" />
        <MetricCard icon={ShieldCheck} label="Administradores ativos" value={adminsCount} tone="rose" />
      </section>

      <Card className="gap-0 overflow-hidden px-0 py-0">
        <CardHeader className="border-b px-5 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Equipe</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {users.length} resultado(s) para os filtros atuais.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_200px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar nome, e-mail, setor ou tag"
                  className="pl-9"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tagId} onValueChange={setTagId}>
                <SelectTrigger><SelectValue placeholder="Todas as tags" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as tags</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>{tag.name}{!tag.active ? " (inativa)" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading || tagsLoading ? (
            <div className="flex min-h-56 items-center justify-center gap-2 text-muted-foreground">
              <RotateCw className="size-5 animate-spin" /> Carregando usuários...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/35">
                    <TableHead className="pl-5">Usuário</TableHead>
                    <TableHead>Tags do perfil</TableHead>
                    <TableHead>Acesso</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="w-16 pr-5 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-44 text-center text-muted-foreground">
                        Nenhum usuário encontrado com estes filtros.
                      </TableCell>
                    </TableRow>
                  ) : users.map((user) => (
                    <TableRow key={user.id} className={!user.ativo ? "opacity-65" : undefined}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <Avatar><AvatarFallback>{initials(user.nome)}</AvatarFallback></Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{user.nome}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-sm flex-wrap gap-1.5">
                          {user.tags.length ? user.tags.map((tag) => <UserTagBadge key={tag.id} tag={tag} />) : (
                            <span className="text-xs text-muted-foreground">Sem tags</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><span className="text-sm">{roleLabels[user.role]}</span></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.setor || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.ativo ? "secondary" : "outline"} className={user.ativo ? "bg-emerald-100 text-emerald-800" : undefined}>
                          {user.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(user.updated_at)}</TableCell>
                      <TableCell className="pr-5 text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Ações de ${user.nome}`}>
                              <Ellipsis className="size-5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-52 p-2">
                            <UserFormSheet
                              user={user}
                              tags={tags}
                              onSaved={refreshAll}
                              trigger={(
                                <Button variant="ghost" className="w-full justify-start">
                                  <Pencil className="size-4" /> Editar usuário
                                </Button>
                              )}
                            />
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => toggleStatus(user)}
                            >
                              {user.ativo ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                              {user.ativo ? "Inativar usuário" : "Reativar usuário"}
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "blue",
}: {
  icon: typeof Plus;
  label: string;
  value: number;
  tone?: "blue" | "emerald" | "slate" | "rose";
}) {
  const tones = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  };
  return (
    <Card className="gap-0 p-4 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="size-5" />
        </span>
      </div>
    </Card>
  );
}
