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
  const key = [
    "dashboard:admin:metrics",
    filters.status ?? "",
    filters.dateFrom ?? "",
    filters.dateTo ?? "",
  ].toLocaleString();

  return useSWR(key, () => dashboardApi.getAdminDashboardMetrics(filters));
}

export function useAdminScopesByUser(filters: ScopesByUserFilters) {
  const key = [
    "dashboard:admin:scopes-by-user",
    filters.status ?? "",
    filters.groupBy ?? "",
    filters.dateFrom ?? "",
    filters.dateTo ?? "",
    filters.includeScopes ? "includeScopes:true" : "includeScopes:false",
  ].toLocaleString();

  return useSWR(key, () => dashboardApi.getAdminScopesByUser(filters));
}

export function useAdminServicesMetrics(filters: ServicesMetricsFilters) {
  const key = [
    "dashboard:admin:services",
    filters.status ?? "",
    filters.dateFrom ?? "",
    filters.dateTo ?? "",
    filters.serviceCode ?? "",
  ].toLocaleString();

  return useSWR(key, () => dashboardApi.getAdminServicesMetrics(filters));
}

export function useAdminServicesByScope(filters: ServicesByScopeFilters) {
  const key = [
    "dashboard:admin:services:by-scope",
    filters.status ?? "",
    filters.dateFrom ?? "",
    filters.dateTo ?? "",
    filters.createdById ?? "",
    filters.serviceCode ?? "",
    filters.limit ?? "",
    filters.offset ?? "",
  ].toLocaleString();

  return useSWR(key, () => dashboardApi.getAdminServicesByScope(filters));
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
  return useSWR(
    key ? ["organization:settings", key].toLocaleString() : null,
    () => organizationSettingsApi.getSettingsByKey(key),
  );
}

export function usePrepostosLookup(params?: {
  cidade: string;
  operacao: "IMPORTACAO" | "EXPORTACAO";
}) {
  const cidade = params?.cidade?.trim() ?? "";
  const operacao = params?.operacao ?? "IMPORTACAO";

  return useSWR(
    cidade && operacao
      ? ["prepostos:lookup", cidade, operacao].toLocaleString()
      : null,
    () =>
      publicApi.lookupPrepostos({
        cidade,
        operacao,
      }),
  );
}