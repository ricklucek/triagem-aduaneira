"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminSettings } from "@/lib/api/hooks/use-dashboards";
import type { UserRole } from "@/lib/api/types/auth-api";
import { AdminFixedInfoSheet } from "@/components/settings/admin-fixed-info-sheet";

export function SettingsHome({ role }: { role: UserRole }) {
  const { data } = useAdminSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
      </CardHeader>
      <CardContent className="grid max-w-xl gap-3">
        {role === "admin" && data ? <AdminFixedInfoSheet initial={data} /> : null}
        <Link href="/settings/prepostos">
          <Button variant="outline" className="w-full justify-start">Contatos de prepostos</Button>
        </Link>
        {role === "admin" ? (
          <Link href="/settings/users">
            <Button variant="outline" className="w-full justify-start">Gerenciar usuários</Button>
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
