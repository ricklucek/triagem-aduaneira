"use client";

import useSWR from "swr";
import { dashboardApi } from "@/lib/api/services/dashboards";
import { usersApi } from "@/lib/api/services/users";

export function useAdminDashboard() {
  return useSWR("dashboard:admin", dashboardApi.getAdminMetrics);
}

export function useComercialDashboard() {
  return useSWR("dashboard:comercial", dashboardApi.getComercialMetrics);
}

export function useCredenciamentoDashboard() {
  return useSWR("dashboard:credenciamento", dashboardApi.getCredenciamentoMetrics);
}

export function useOperacaoDashboard() {
  return useSWR("dashboard:operacao", dashboardApi.getOperacaoMetrics);
}

export function useUsers() {
  return useSWR("users:list", usersApi.listUsers);
}
