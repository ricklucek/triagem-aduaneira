"use client";

import { Ellipsis, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasRole } from "@/lib/auth/guard";
import { useUsers } from "@/lib/api/hooks/use-dashboards";
import { usersApi } from "@/lib/api/services/users";
import type { UserSummary } from "@/lib/api/types/dashboard-api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { UserFormSheet } from "@/components/settings/user-form-sheet";

const ADMIN_ROLES = new Set(["admin", "administrador"]);

export default function SettingsUsersPage() {
  const { data: usersData, isLoading, mutate } = useUsers();

  if (!hasRole("admin")) return <p>Acesso restrito ao administrador.</p>;

  const refreshUsers = async () => {
    await mutate();
  };

  const onDelete = async (user: UserSummary) => {
    if (ADMIN_ROLES.has(user.role)) {
      toast.info("Usuários administradores devem ser gerenciados separadamente.");
      return;
    }

    try {
      await usersApi.deleteUser(user.id);
      await mutate();
      toast.success("Usuário removido com sucesso.");
    } catch {
      toast.error("Não foi possível excluir o usuário.");
    }
  };

  const renderTable = (rows: UserSummary[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Perfil</TableHead>
          <TableHead className="w-20">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6}>Nenhum usuário encontrado.</TableCell>
          </TableRow>
        ) : (
          rows.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.nome}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
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
                        <UserFormSheet
                          user={user}
                          onSaved={refreshUsers}
                          trigger={(
                            <Button variant="ghost" className="w-full justify-start">
                              Editar
                            </Button>
                          )}
                        />
                      </div>
                      <div className="popover-menu-item">
                        <Button
                          variant="destructive"
                          className="w-full justify-start"
                          onClick={() => onDelete(user)}
                          disabled={ADMIN_ROLES.has(user.role)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <main className="w-full min-h-screen">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciar usuários</CardTitle>
          <UserFormSheet
            onSaved={refreshUsers}
            trigger={<Button>Criar usuário</Button>}
          />
        </CardHeader>
        <CardContent className="space-y-8">
          {isLoading ? (
            <div className="flex items-center gap-2 p-5 justify-center">
              <RotateCw className="size-5 animate-spin" />
            </div>
          ) : (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Usuários</h3>
              {renderTable(usersData ?? [])}
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
