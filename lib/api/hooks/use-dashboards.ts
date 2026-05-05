"use client";

import useSWR from "swr";
import { dashboardApi } from "@/lib/api/services/dashboards";
import { usersApi } from "@/lib/api/services/users";
import { organizationSettingsApi } from "@/lib/api/services/organization-settings";
import { publicApi } from "../services/public";
import type {
  AdminDashboardMetricsFilters,
  ScopesByUserFilters,
  ServicesByScopeFilters,
  ServicesMetricsFilters,
} from "../types/dashboard-api";

export function useAdminDashboard() {
  return useSWR("dashboard:admin", dashboardApi.getAdminMetrics);
}

export function useAdminDashboardMetrics(filters: AdminDashboardMetricsFilters) {
  return useSWR(["dashboard:admin:metrics", filters].toString(), ([, params]) =>
    dashboardApi.getAdminDashboardMetrics(filters),
  );
}

export function useAdminScopesByUser(filters: ScopesByUserFilters) {
  return useSWR(["dashboard:admin:scopes-by-user", filters].toString(), ([, params]) =>
    dashboardApi.getAdminScopesByUser(filters),
  );
}

export function useAdminServicesMetrics(filters: ServicesMetricsFilters) {
  return useSWR(["dashboard:admin:services", filters].toString(), ([, params]) =>
    dashboardApi.getAdminServicesMetrics(filters),
  );
}


export function useAdminServicesByScope(filters: ServicesByScopeFilters) {
  return useSWR(["dashboard:admin:services:by-scope", filters].toString(), ([, params]) =>
    dashboardApi.getAdminServicesByScope(filters),
  );
}

export function useComercialDashboard() {
  return useSWR("dashboard:comercial", dashboardApi.getComercialMetrics);
}

export function useCredenciamentoDashboard() {
  return useSWR(
    "dashboard:credenciamento",
    dashboardApi.getCredenciamentoMetrics,
  );
}

export function useOperacaoDashboard() {
  return useSWR("dashboard:operacao", dashboardApi.getOperacaoMetrics);
}

export function useUsers() {
  return useSWR("users:list", usersApi.listUsers);
}

export function useAdmins() {
  return useSWR("admins:list", usersApi.listAdmins);
}

export function useAdminSettings() {
  return useSWR("organization:settings", organizationSettingsApi.getSettings);
}

export function useOrganizationSettingsByKey(key: string) {
  return useSWR(`organization:settings:${key}`, () => organizationSettingsApi.getSettingsByKey(key));
}

export function usePrepostosLookup(params?: {
  cidade: string;
  operacao: "IMPORTACAO" | "EXPORTACAO";
}) {
  return useSWR(
    `prepostos:lookup?cidade=${params?.cidade.trim()}&operacao=${params?.operacao}`,
    () =>
      publicApi.lookupPrepostos({
        cidade: params?.cidade.trim() ?? "",
        operacao: params?.operacao as "IMPORTACAO" | "EXPORTACAO",
      }),
  );
}
