"use client";

import AdminDashboardPanel from "./sections/admin-dashboard-panel";
import ComercialDashboardPanel from "./sections/comercial-dashboard-panel";
import type { UserRole } from "@/lib/api/types/auth-api";

export default function DashboardRoleView({ role }: { role?: UserRole }) {
  if (role === "admin") {
    return <AdminDashboardPanel />;
  }

  if (role === "comercial") {
    return <ComercialDashboardPanel />;
  }

  if (role === "operacao") {
    return <p>Painel de operação em preparação.</p>;
  }

  return <p>Seu perfil ainda não possui visualização disponível neste dashboard.</p>;
}
