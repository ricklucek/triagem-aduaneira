"use client";

import useSWR from "swr";
import { dashboardApi } from "@/lib/api/services/dashboards";
import { usersApi } from "@/lib/api/services/users";
import { organizationSettingsApi } from "@/lib/api/services/organization-settings";
import { publicApi } from "../services/public";

export function useAdminDashboard() {
  return useSWR("dashboard:admin", dashboardApi.getAdminMetrics);
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
        cidade: params?.cidade.trim() ?? '',
        operacao: params?.operacao as "IMPORTACAO" | "EXPORTACAO",
      })
  );
}